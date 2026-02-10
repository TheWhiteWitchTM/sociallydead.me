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

export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json()

    if (!orderId) {
      return NextResponse.json(
        { error: "Missing order ID" },
        { status: 400 }
      )
    }

    const accessToken = await getPayPalAccessToken()

    const res = await fetch(
      `${PAYPAL_LIVE}/v2/checkout/orders/${orderId}/capture`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    )

    if (!res.ok) {
      const errText = await res.text()
      console.error("[PayPal] Capture error:", errText)
      return NextResponse.json(
        { error: "Failed to capture PayPal payment. If you approved the payment in PayPal, it may take a moment to process." },
        { status: 500 }
      )
    }

    const data = await res.json()
    return NextResponse.json({
      status: data.status,
      orderId: data.id,
    })
  } catch (error) {
    console.error("[PayPal] Capture order error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
