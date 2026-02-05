"use client"

import { useEffect, useState } from "react"
import { useBluesky } from "@/lib/bluesky-context"
import { PublicPostCard } from "@/components/public-post-card"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw } from "lucide-react"

interface Post {
  uri: string
  cid: string
  author: {
    did: string
    handle: string
    displayName?: string
    avatar?: string
  }
  record: {
    text: string
    createdAt: string
    facets?: unknown[]
  }
  replyCount: number
  repostCount: number
  likeCount: number
  indexedAt: string
}

export function PublicFeed() {
  const { getPublicFeed, login } = useBluesky()
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadFeed = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const feed = await getPublicFeed()
      setPosts(feed)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load feed")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadFeed()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={loadFeed} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card p-4 text-card-foreground">
        <p className="text-sm text-muted-foreground">
          You&apos;re viewing the public feed. Sign in with Bluesky to see your timeline and interact with posts.
        </p>
        <Button onClick={login} className="mt-3" size="sm">
          Sign in with Bluesky
        </Button>
      </div>
      
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">What&apos;s Hot</h2>
        <Button onClick={loadFeed} variant="ghost" size="sm">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="space-y-4">
        {posts.map((post) => (
          <PublicPostCard key={post.uri} post={post} />
        ))}
      </div>
    </div>
  )
}
