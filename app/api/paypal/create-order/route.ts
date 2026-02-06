import { NextRequest, NextResponse } from "next/server"

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID!
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET!
const PAYPAL_API = process.env.PAYPAL_MODE === "sandbox"
  ? "https://api-m.sandbox.paypal.com"
  : "https://api-m.paypal.com"

async function getPayPalAccessToken(): Promise<string> {
  const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  })

  if (!res.ok) {
    throw new Error("Failed to get PayPal access token")
  }

  const data = await res.json()
  return data.access_token
}

export async function POST(req: NextRequest) {
  try {
    const { amount = "1.00" } = await req.json()

    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount < 1.0) {
      return NextResponse.json(
        { error: "Minimum amount is $1.00" },
        { status: 400 }
      )
    }

    const accessToken = await getPayPalAccessToken()

    const res = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
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
            description: "SociallyDead Blue Verification Badge",
          },
        ],
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error("PayPal create order error:", errText)
      return NextResponse.json(
        { error: "Failed to create PayPal order" },
        { status: 500 }
      )
    }

    const order = await res.json()
    // Find the approval URL from PayPal's response
    const approvalUrl = order.links?.find((link: { rel: string; href: string }) => link.rel === "approve")?.href
    return NextResponse.json({ orderId: order.id, approvalUrl })
  } catch (error) {
    console.error("Create order error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
