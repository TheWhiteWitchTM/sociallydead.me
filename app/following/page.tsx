"use client"

import { useEffect, useState, useCallback } from "react"
import { useBluesky } from "@/lib/bluesky-context"
import { PostCard } from "@/components/post-card"
import { PublicPostCard } from "@/components/public-post-card"
import { Button } from "@/components/ui/button"
import {Users, Loader2, RefreshCw, Sparkles} from "lucide-react"
import {PageHeader} from "@/components/page-header";

export default function DiscoverPage() {
  const { isAuthenticated, getTimeline } = useBluesky()
  const [posts, setPosts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadFeed = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const feed = await getTimeline()
      setPosts(feed.posts)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load discover feed")
    } finally {
      setIsLoading(false)
    }
  }, [getTimeline])

  useEffect(() => {
    loadFeed()
  }, [loadFeed])

  return (
    <div className="min-h-screen">
      <PageHeader
        isLoading={isLoading}
        onRefresh={loadFeed}
      >
        <Users className="h-5 w-5" />
        Following
      </PageHeader>

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
