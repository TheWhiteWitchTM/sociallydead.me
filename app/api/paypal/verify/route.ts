import { NextRequest, NextResponse } from "next/server"

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || ""
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || ""

const PAYPAL_LIVE = "https://api-m.paypal.com"

async function getPayPalAccessToken(): Promise<string> {
  const res = await fetch(`${PAYPAL_LIVE}/v1/oauth2/token`, {
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

async function verifyOrder(orderId: string): Promise<{ verified: boolean; amount: number; payerEmail?: string }> {
  const accessToken = await getPayPalAccessToken()

  const res = await fetch(`${PAYPAL_LIVE}/v2/checkout/orders/${orderId}`, {
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
    const { orderId, handle, did, accessJwt, pdsUrl } = await req.json()

    if (!orderId || !handle || !did || !accessJwt) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // 1. Verify the PayPal order
    const { verified, amount, payerEmail } = await verifyOrder(orderId)

    if (!verified) {
      return NextResponse.json(
        { error: "Payment not verified. Minimum $1.00 required." },
        { status: 400 }
      )
    }

    // 2. Write the supporter record to the user's PDS
    const pds = pdsUrl || "https://bsky.social"
    try {
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
        console.error("[PayPal] Failed to write supporter record to PDS:", errText)
        // We continue even if PDS write fails, as long as we can write to our own repo
      }
    } catch (e) {
      console.error("[PayPal] Error writing to PDS:", e)
    }

    // 3. Also update the SociallyDead app-record for the blue badge
    try {
      const { upsertAppRecord, getAppRecord } = await import('@/lib/sociallydead-app-repo');
      
      // Determine supporter tier and star flag
      const isStar = amount >= 50
      const tier = isStar ? "star" : "blue"

      // Get existing record if any to preserve other fields
      const existing = await getAppRecord(did);
      await upsertAppRecord(did, {
        ...existing,
        verified: true,
        verifiedAt: new Date().toISOString(),
        supporterTier: tier,
        star: isStar,
      });
      console.log(`[PayPal] Successfully updated app-record for DID: ${did} (tier=${tier})`);
    } catch (err) {
      console.error("[PayPal] Failed to update app-record:", err);
      // If this fails, the user won't get the badge immediately in SociallyDead
      return NextResponse.json(
        { error: "Payment verified but failed to update status. Please contact support." },
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
