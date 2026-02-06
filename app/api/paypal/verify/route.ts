import { NextRequest, NextResponse } from "next/server"

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || ""
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || ""

const PAYPAL_LIVE = "https://api-m.paypal.com"
const PAYPAL_SANDBOX = "https://api-m.sandbox.paypal.com"

async function getPayPalAccessToken(apiBase: string): Promise<string> {
  const res = await fetch(`${apiBase}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  })

  if (!res.ok) {
    const errBody = await res.text()
    throw new Error(`PayPal auth failed (${res.status}): ${errBody}`)
  }

  const data = await res.json()
  return data.access_token
}

async function verifyOrder(orderId: string, apiBase: string): Promise<{ verified: boolean; amount: number; payerEmail?: string }> {
  const accessToken = await getPayPalAccessToken(apiBase)

  const res = await fetch(`${apiBase}/v2/checkout/orders/${orderId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  })

  if (!res.ok) {
    return { verified: false, amount: 0 }
  }

  const order = await res.json()

  if (order.status !== "COMPLETED") {
    return { verified: false, amount: 0 }
  }

  const amount = parseFloat(
    order.purchase_units?.[0]?.amount?.value || "0"
  )

  return {
    verified: amount >= 1.0,
    amount,
    payerEmail: order.payer?.email_address,
  }
}

export async function POST(req: NextRequest) {
  try {
    const { orderId, handle, did, accessJwt, pdsUrl, apiBase: clientApiBase } = await req.json()

    if (!orderId || !handle || !did || !accessJwt) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Use the same API base that was used to create/capture the order
    const apiBase = clientApiBase && [PAYPAL_LIVE, PAYPAL_SANDBOX].includes(clientApiBase)
      ? clientApiBase
      : (process.env.PAYPAL_MODE === "sandbox" ? PAYPAL_SANDBOX : PAYPAL_LIVE)

    // 1. Verify the PayPal order
    const { verified, amount, payerEmail } = await verifyOrder(orderId, apiBase)

    if (!verified) {
      return NextResponse.json(
        { error: "Payment not verified. Minimum $1.00 required." },
        { status: 400 }
      )
    }

    // 2. Write the supporter record to the user's PDS
    const pds = pdsUrl || "https://bsky.social"
    const recordRes = await fetch(
      `${pds}/xrpc/com.atproto.repo.putRecord`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessJwt}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          repo: did,
          collection: "me.sociallydead.supporter",
          rkey: "self",
          record: {
            $type: "me.sociallydead.supporter",
            verifiedAt: new Date().toISOString(),
            amount: amount.toString(),
            paypalOrderId: orderId,
            payerEmail: payerEmail || "",
            tier: "blue",
            createdAt: new Date().toISOString(),
          },
        }),
      }
    )

    if (!recordRes.ok) {
      const errText = await recordRes.text()
      console.error("[PayPal] Failed to write supporter record:", errText)
      return NextResponse.json(
        { error: "Payment verified but failed to save supporter status. Please contact support." },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "You are now verified! The blue checkmark will appear next to your name.",
      amount,
    })
  } catch (error) {
    console.error("[PayPal] Verification error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
