import { NextRequest, NextResponse } from "next/server"

// In-memory store for view counts (resets on server restart)
// This is a custom SociallyDead-only analytics layer
const viewCounts = new Map<string, { views: number; linkClicks: number; lastViewed: string }>()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { postUri, action } = body

    if (!postUri || !action) {
      return NextResponse.json({ error: "Missing postUri or action" }, { status: 400 })
    }

    const existing = viewCounts.get(postUri) || { views: 0, linkClicks: 0, lastViewed: new Date().toISOString() }

    if (action === "view") {
      existing.views += 1
      existing.lastViewed = new Date().toISOString()
    } else if (action === "link_click") {
      existing.linkClicks += 1
    }

    viewCounts.set(postUri, existing)

    return NextResponse.json({ 
      postUri,
      views: existing.views,
      linkClicks: existing.linkClicks,
    })
  } catch {
    return NextResponse.json({ error: "Failed to track view" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const postUri = url.searchParams.get("postUri")

    if (!postUri) {
      // Return all stats (for analytics dashboard)
      const allStats: Record<string, { views: number; linkClicks: number }> = {}
      viewCounts.forEach((value, key) => {
        allStats[key] = { views: value.views, linkClicks: value.linkClicks }
      })
      return NextResponse.json(allStats)
    }

    const stats = viewCounts.get(postUri) || { views: 0, linkClicks: 0 }
    return NextResponse.json({
      postUri,
      views: stats.views,
      linkClicks: stats.linkClicks,
    })
  } catch {
    return NextResponse.json({ error: "Failed to get view count" }, { status: 500 })
  }
}
