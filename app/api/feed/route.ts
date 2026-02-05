import { NextRequest, NextResponse } from "next/server"

const categorySearchTerms: Record<string, string[]> = {
  news: ["news", "breaking news", "headlines", "journalism", "world news"],
  politics: ["politics", "election", "government", "congress", "democracy", "vote"],
  games: ["gaming", "videogames", "playstation", "xbox", "nintendo", "gaming news"],
  tech: ["technology", "programming", "coding", "software", "ai", "tech news"],
  health: ["health", "fitness", "wellness", "nutrition", "mental health", "exercise"],
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const category = searchParams.get("category")

  if (!category || !categorySearchTerms[category]) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 })
  }

  const terms = categorySearchTerms[category]
  const searchTerm = terms[Math.floor(Math.random() * terms.length)]

  try {
    const response = await fetch(
      `https://public.api.bsky.app/xrpc/app.bsky.feed.searchPosts?q=${encodeURIComponent(searchTerm)}&limit=30`,
      {
        headers: {
          "Accept": "application/json",
        },
        next: { revalidate: 60 },
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Bluesky API error:", response.status, errorText)
      return NextResponse.json({ error: "Failed to fetch from Bluesky" }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching feed:", error)
    return NextResponse.json({ error: "Failed to fetch feed" }, { status: 500 })
  }
}
