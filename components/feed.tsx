"use client"

import { useEffect, useState, useCallback } from "react"
import { useBluesky } from "@/lib/bluesky-context"
import { PostCard } from "@/components/post-card"
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
  }
  replyCount: number
  repostCount: number
  likeCount: number
  viewer?: {
    like?: string
    repost?: string
  }
}

interface FeedProps {
  type: "timeline" | "profile"
  actor?: string
}

export function Feed({ type, actor }: FeedProps) {
  const { getTimeline, getUserPosts, user, isAuthenticated } = useBluesky()
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadPosts = useCallback(async () => {
    if (!isAuthenticated) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const fetchedPosts = type === "timeline" 
        ? await getTimeline()
        : await getUserPosts(actor)
      setPosts(fetchedPosts)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load posts")
    } finally {
      setIsLoading(false)
    }
  }, [type, actor, getTimeline, getUserPosts, isAuthenticated])

  useEffect(() => {
    loadPosts()
  }, [loadPosts])

  if (!isAuthenticated) {
    return null
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={loadPosts} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground">No posts yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={loadPosts} variant="ghost" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>
      {posts.map((post) => (
        <PostCard
          key={post.uri}
          post={post}
          isOwnPost={user?.did === post.author.did}
          onPostUpdated={loadPosts}
        />
      ))}
    </div>
  )
}
