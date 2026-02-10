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
    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
      return NextResponse.json(
        { error: "PayPal is not configured. Please set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET environment variables." },
        { status: 500 }
      )
    }

    const { amount = "1.00" } = await req.json()

    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount < 1.0) {
      return NextResponse.json(
        { error: "Minimum amount is $1.00" },
        { status: 400 }
      )
    }

    const accessToken = await getPayPalAccessToken()

    const res = await fetch(`${PAYPAL_LIVE}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: "USD",
              value: numAmount.toFixed(2),
            },
            description: "SociallyDead Supporter - Blue Verification Badge",
          },
        ],
        application_context: {
          brand_name: "SociallyDead",
          user_action: "PAY_NOW",
          return_url: "https://sociallydead.me/settings",
          cancel_url: "https://sociallydead.me/settings",
        },
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error("[PayPal] Create order error:", errText)
      return NextResponse.json(
        { error: "Failed to create PayPal order. Please try again." },
        { status: 500 }
      )
    }

    const order = await res.json()
    const approvalUrl = order.links?.find((link: { rel: string; href: string }) => link.rel === "approve")?.href

    return NextResponse.json({ orderId: order.id, approvalUrl })
  } catch (error) {
    console.error("[PayPal] Create order error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
