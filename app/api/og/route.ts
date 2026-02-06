import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url")
  
  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 })
  }

  try {
    // Validate URL
    new URL(url)
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 })
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "SociallyDead/1.0 (link preview)",
        "Accept": "text/html",
      },
    })
    clearTimeout(timeout)

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch URL" }, { status: 502 })
    }

    const contentType = response.headers.get("content-type") || ""
    if (!contentType.includes("text/html")) {
      return NextResponse.json({ error: "Not an HTML page" }, { status: 400 })
    }

    const html = await response.text()
    
    // Parse OG tags
    const getMetaContent = (property: string): string | null => {
      // Try og: prefix
      const ogMatch = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']*?)["']`, "i"))
      if (ogMatch) return ogMatch[1]
      // Try reversed attribute order
      const reversed = html.match(new RegExp(`<meta[^>]+content=["']([^"']*?)["'][^>]+(?:property|name)=["']${property}["']`, "i"))
      if (reversed) return reversed[1]
      return null
    }

    const title = getMetaContent("og:title") || getMetaContent("twitter:title") || html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] || ""
    const description = getMetaContent("og:description") || getMetaContent("twitter:description") || getMetaContent("description") || ""
    const image = getMetaContent("og:image") || getMetaContent("twitter:image") || ""

    // Resolve relative image URLs
    let resolvedImage = image
    if (image && !image.startsWith("http")) {
      try {
        resolvedImage = new URL(image, url).href
      } catch {
        resolvedImage = ""
      }
    }

    return NextResponse.json({
      url,
      title: title.trim(),
      description: description.trim(),
      image: resolvedImage,
    })
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return NextResponse.json({ error: "Request timeout" }, { status: 504 })
    }
    return NextResponse.json({ error: "Failed to fetch metadata" }, { status: 500 })
  }
}
