import { NextRequest, NextResponse } from "next/server"

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || ""
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || ""

const PAYPAL_LIVE = "https://api-m.paypal.com"
const PAYPAL_SANDBOX = "https://api-m.sandbox.paypal.com"

// Determine which API to use: explicit env var, or try live first
function getPayPalAPI(): string {
  if (process.env.PAYPAL_MODE === "sandbox") return PAYPAL_SANDBOX
  if (process.env.PAYPAL_MODE === "live") return PAYPAL_LIVE
  // Default to live
  return PAYPAL_LIVE
}

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

async function getWorkingPayPalConnection(): Promise<{ accessToken: string; apiBase: string }> {
  const primaryApi = getPayPalAPI()

  try {
    const accessToken = await getPayPalAccessToken(primaryApi)
    return { accessToken, apiBase: primaryApi }
  } catch {
    // If primary fails and no explicit mode set, try the other endpoint
    if (!process.env.PAYPAL_MODE) {
      const fallbackApi = primaryApi === PAYPAL_LIVE ? PAYPAL_SANDBOX : PAYPAL_LIVE
      console.log("[PayPal] Primary auth failed, trying fallback:", fallbackApi)
      const accessToken = await getPayPalAccessToken(fallbackApi)
      return { accessToken, apiBase: fallbackApi }
    }
    throw new Error(
      `PayPal authentication failed. Your credentials don't work with the ${primaryApi.includes("sandbox") ? "sandbox" : "live"} API. ` +
      `Try setting PAYPAL_MODE=${primaryApi.includes("sandbox") ? "live" : "sandbox"} in your environment variables.`
    )
  }
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

    const { accessToken, apiBase } = await getWorkingPayPalConnection()

    const res = await fetch(`${apiBase}/v2/checkout/orders`, {
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

    // Store which API base was used so capture uses the same one
    return NextResponse.json({ orderId: order.id, approvalUrl, apiBase })
  } catch (error) {
    console.error("[PayPal] Create order error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
