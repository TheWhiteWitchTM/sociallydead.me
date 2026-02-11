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

    // 2. Update the SociallyDead app-record and add to lists
    try {
      const { upsertAppRecord, getAppRecord, getAppAgent } = await import('@/lib/sociallydead-app-repo');

      // Get existing record if any to preserve other fields
      const existing = await getAppRecord(did);

      // Build the update
      const update: any = {
        ...existing,
        verified: true, // Any payment $1+ sets verified to true
        verifiedAt: new Date().toISOString(),
      };

      // If $50 or more, also set supporter to true
      const isSupporter = amount >= 50;
      if (isSupporter) {
        update.supporter = true;
      }

      await upsertAppRecord(did, update);
      console.log(`[PayPal] Successfully updated app-record for DID: ${did} (verified=true, supporter=${isSupporter})`);

      // 3. Add user to appropriate lists using the app agent
      const appAgent = await getAppAgent();

      const verifiedListUri = "at://did:plc:ranzwz5adtvnl2pphevoujhx/app.bsky.graph.list/3memjc3ndqn2m";
      const supportersListUri = "at://did:plc:ranzwz5adtvnl2pphevoujhx/app.bsky.graph.list/3memjmwrzmc2g";

      // Add to verified list (all payments $1+)
      try {
        await appAgent.com.atproto.repo.createRecord({
          repo: appAgent.session!.did,
          collection: 'app.bsky.graph.listitem',
          record: {
            $type: 'app.bsky.graph.listitem',
            subject: did,
            list: verifiedListUri,
            createdAt: new Date().toISOString(),
          }
        });
        console.log(`[PayPal] Added ${did} to verified list`);
      } catch (err: any) {
        // Ignore if already in list
        if (!err?.message?.includes('already exists')) {
          console.error("[PayPal] Failed to add to verified list:", err);
        }
      }

      // Add to supporters list if $50+
      if (isSupporter) {
        try {
          await appAgent.com.atproto.repo.createRecord({
            repo: appAgent.session!.did,
            collection: 'app.bsky.graph.listitem',
            record: {
              $type: 'app.bsky.graph.listitem',
              subject: did,
              list: supportersListUri,
              createdAt: new Date().toISOString(),
            }
          });
          console.log(`[PayPal] Added ${did} to supporters list`);
        } catch (err: any) {
          // Ignore if already in list
          if (!err?.message?.includes('already exists')) {
            console.error("[PayPal] Failed to add to supporters list:", err);
          }
        }
      }
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
