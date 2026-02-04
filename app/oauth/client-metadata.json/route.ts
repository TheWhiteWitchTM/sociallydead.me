import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const origin = `${url.protocol}//${url.host}`
  
  const clientMetadata = {
    client_id: `${origin}/oauth/client-metadata.json`,
    client_name: "SociallyDead",
    client_uri: origin,
    logo_uri: `${origin}/icons/icon-192.png`,
    tos_uri: `${origin}/terms`,
    policy_uri: `${origin}/privacy`,
    redirect_uris: [`${origin}/oauth/callback`],
    scope: "atproto transition:generic",
    grant_types: ["authorization_code", "refresh_token"],
    response_types: ["code"],
    application_type: "web",
    token_endpoint_auth_method: "none",
    dpop_bound_access_tokens: true,
  }

  return NextResponse.json(clientMetadata, {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  })
}
