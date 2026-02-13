"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import { useBluesky } from "@/lib/bluesky-context"
import { PostCard } from "@/components/post-card"
import { PublicPostCard } from "@/components/public-post-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {Loader2, RefreshCw, ArrowLeft, TrendingUp} from "lucide-react"
import { VerifiedBadge } from "@/components/verified-badge"
import { HandleLink } from "@/components/handle-link"

const categoryConfig = {
  // keep if you want fallback icon, but not strictly needed anymore
  trending: {
    label: "Trending",
    icon: TrendingUp, // or whatever default
  }
}

export default function TrendingTopicPage() {
  const params = useParams()
  const router = useRouter()

  const encodedTopic = params.topic as string
  const rawTopic = decodeURIComponent(encodedTopic) // "Breaking News" or "#AI"

  const {
    isAuthenticated,
    isLoading: authLoading,
    user,
    getAllPostsForHashtag,
    searchPosts, // fallback if needed
  } = useBluesky()

  const [posts, setPosts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Normalize topic for better search results
  const normalizeTopic = (topic: string) => {
    let cleaned = topic.trim()
    if (cleaned.startsWith('#')) cleaned = cleaned.slice(1)

    // Convert "Breaking News" → "BreakingNews"
    const camelCased = cleaned
      .split(/\s+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('')

    return {
      camel: camelCased,
      original: cleaned,
      quoted: `"${cleaned}"` // for exact phrase fallback
    }
  }

  const loadPosts = useCallback(async () => {
    if (!rawTopic) return

    setIsLoading(true)
    setError(null)

    try {
      const { camel, quoted } = normalizeTopic(rawTopic)

      // First try: #CamelCased (most common real usage)
      let fetched = await getAllPostsForHashtag(camel, {
        maxPages: 10,
        maxPosts: 500,
      })

      // If very few results, try quoted phrase as fallback
      if (fetched.length < 8) {
        console.log("Few results with camelCase → trying quoted phrase fallback")
        const fallback = await searchPosts(quoted, undefined)
        fetched = [...fetched, ...fallback.posts]
      }

      setPosts(fetched)
    } catch (err) {
      console.error("Failed to load trending posts:", err)
      setError("Could not load posts for this trend. Try refreshing.")
    } finally {
      setIsLoading(false)
    }
  }, [rawTopic, getAllPostsForHashtag, searchPosts])

  useEffect(() => {
    loadPosts()
  }, [loadPosts])

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!rawTopic) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">No topic specified</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* ── YOUR ORIGINAL HEADER STYLE RESTORED ── */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">
              Trending: {rawTopic.startsWith('#') ? rawTopic : `#${rawTopic}`}
            </h1>
          </div>
          <Button
            onClick={loadPosts}
            variant="ghost"
            size="icon"
            disabled={isLoading}
          >
            <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-0 sm:px-4 py-6">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={loadPosts}>Try Again</Button>
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground">No recent posts found for this trend</p>
            <p className="text-sm mt-2 text-muted-foreground">
              It might be a new/quiet topic or try a different one
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              isAuthenticated ? (
                <PostCard
                  key={post.uri}
                  post={post}
                  isOwnPost={user?.did === post.author.did}
                  onPostUpdated={loadPosts}
                />
              ) : (
                <PublicPostCard key={post.uri} post={post} />
              )
            ))}
          </div>
        )}
      </main>
    </div>
  )
}