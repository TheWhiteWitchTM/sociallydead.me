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
    reply?: {
      root: { uri: string; cid: string }
      parent: { uri: string; cid: string }
    }
  }
  embed?: {
    $type: string
    record?: {
      uri: string
      cid: string
      author: {
        did: string
        handle: string
        displayName?: string
        avatar?: string
      }
      value: {
        text: string
        createdAt: string
      }
    }
    images?: Array<{
      thumb: string
      fullsize: string
      alt: string
    }>
  }
  replyCount: number
  repostCount: number
  likeCount: number
  viewer?: {
    like?: string
    repost?: string
  }
  reason?: {
    $type: string
    by?: {
      did: string
      handle: string
      displayName?: string
      avatar?: string
    }
  }
}

interface FeedProps {
  type: "timeline" | "profile" | "replies" | "media" | "likes"
  actor?: string
}

export function Feed({ type, actor }: FeedProps) {
  const { getTimeline, getUserPosts, getUserReplies, getUserMedia, getUserLikes, user, isAuthenticated } = useBluesky()
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadPosts = useCallback(async () => {
    if (!isAuthenticated) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      let fetchedPosts: Post[]
      
      switch (type) {
        case "timeline":
          const timelineResult = await getTimeline()
          fetchedPosts = timelineResult.posts
          break
        case "profile":
          fetchedPosts = await getUserPosts(actor)
          break
        case "replies":
          fetchedPosts = await getUserReplies(actor)
          break
        case "media":
          fetchedPosts = await getUserMedia(actor)
          break
        case "likes":
          fetchedPosts = await getUserLikes(actor)
          break
        default:
          fetchedPosts = []
      }
      
      setPosts(fetchedPosts)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load posts")
    } finally {
      setIsLoading(false)
    }
  }, [type, actor, getTimeline, getUserPosts, getUserReplies, getUserMedia, getUserLikes, isAuthenticated])

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
        <p className="text-muted-foreground">
          {type === "timeline" && "Your timeline is empty. Follow some people to see their posts!"}
          {type === "profile" && "No posts yet"}
          {type === "replies" && "No replies yet"}
          {type === "media" && "No media posts yet"}
          {type === "likes" && "No liked posts yet"}
        </p>
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
