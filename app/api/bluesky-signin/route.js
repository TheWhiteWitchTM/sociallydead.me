// app/api/bluesky-signin/route.js
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { handle } = await request.json()

    if (!handle || typeof handle !== 'string' || handle.trim() === '') {
      return NextResponse.json({ error: 'Enter your Bluesky handle' }, { status: 400 })
    }

    const trimmed = handle.trim()

    // Basic validation
    if (trimmed.length < 3 || !trimmed.includes('.')) {
      return NextResponse.json({ error: 'Handle should look like username.bsky.social' }, { status: 400 })
    }

    // Quick public check if handle exists
    const res = await fetch(`https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${encodeURIComponent(trimmed)}`)
    if (!res.ok) {
      if (res.status === 404) {
        return NextResponse.json({ error: 'Handle not found — check spelling or account status' }, { status: 400 })
      }
      return NextResponse.json({ error: 'Could not verify handle' }, { status: 500 })
    }

    // Handle exists — generate authorize URL
    const authUrl = `https://bsky.social/oauth/authorize?` +
      `client_id=https://sociallydead.me/client-metadata.json&` +
      `redirect_uri=https://sociallydead.me/oauth-callback&` +
      `response_type=code&` +
      `scope=atproto%20transition:email%20transition:offline_access`

    return NextResponse.json({ success: true, authUrl })
  } catch (err) {
    console.error('Sign-in API error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}