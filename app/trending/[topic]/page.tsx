"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import { useBluesky } from "@/lib/bluesky-context"
import { PostCard } from "@/components/post-card"
import { PublicPostCard } from "@/components/public-post-card"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw, ArrowLeft } from "lucide-react"

export default function TrendingTopicPage() {
  const params = useParams()
  const router = useRouter()

  // topic comes URL-encoded from the route, e.g. "Breaking%20News" or "%23AI"
  const encodedTopic = params.topic as string
  const topic = decodeURIComponent(encodedTopic) // human-readable: "Breaking News" or "#AI"

  const {
    isAuthenticated,
    isLoading: authLoading,
    user,
    getAllPostsForHashtag,
  } = useBluesky()

  const [posts, setPosts] = useState<any[]>([]) // adjust type to match your BlueskyPost
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadPosts = useCallback(async () => {
    if (!topic) return

    setIsLoading(true)
    setError(null)

    try {
      // Use your new helper — fetches up to ~500 recent/relevant posts for this topic
      const fetchedPosts = await getAllPostsForHashtag(topic, {
        maxPages: 12,     // adjust as needed (each page ~50 posts)
        maxPosts: 600,
      })

      setPosts(fetchedPosts)
    } catch (err) {
      console.error("Failed to load trending posts:", err)
      setError(err instanceof Error ? err.message : "Failed to load posts for this trend")
    } finally {
      setIsLoading(false)
    }
  }, [topic, getAllPostsForHashtag])

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

  if (!topic) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">No topic specified</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center gap-4 px-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold truncate">
              Trending: {topic.startsWith('#') ? topic : `#${topic}`}
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

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={loadPosts} variant="outline">
              Try Again
            </Button>
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-lg text-muted-foreground">No posts found for this trend yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Try refreshing or check back later
            </p>
          </div>
        ) : (
          <div className="space-y-6">
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