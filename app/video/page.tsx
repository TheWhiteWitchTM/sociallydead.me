"use client"

import { useEffect, useState, useCallback } from "react"
import { useBluesky } from "@/lib/bluesky-context"
import { PostCard } from "@/components/post-card"
import { PublicPostCard } from "@/components/public-post-card"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw, Play } from "lucide-react"  // ← changed Landmark → Play for video vibe

export default function VideosPage() {  // ← renamed component for clarity (optional but recommended)
  const { isAuthenticated, searchByHashtag } = useBluesky()
  const [posts, setPosts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadFeed = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await searchByHashtag("videos")  // ← changed from "politics" to "videos"
      setPosts(result.posts)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load videos feed")
    } finally {
      setIsLoading(false)
    }
  }, [searchByHashtag])

  useEffect(() => {
    loadFeed()
  }, [loadFeed])

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Play className="h-5 w-5" />  {/* ← video/play icon instead of Landmark */}
            <h1 className="text-xl font-bold">Videos</h1>
          </div>
          <Button onClick={loadFeed} variant="ghost" size="icon" disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-0 sm:px-4 py-6">
        {isLoading && posts.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={loadFeed}>Try Again</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              isAuthenticated ? (
                <PostCard key={post.uri} post={post} />
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