"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { useBluesky } from "@/lib/bluesky-context"
import { PostCard } from "@/components/post-card"
import { PublicPostCard } from "@/components/public-post-card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, ArrowLeft, MessageCircle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

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
}

export default function PostDetailPage() {
  const params = useParams()
  const handle = params.handle as string
  const postId = params.postId as string
  
  const { getPost, getPostThread, isAuthenticated, user } = useBluesky()
  
  const [post, setPost] = useState<Post | null>(null)
  const [replies, setReplies] = useState<Post[]>([])
  const [parentPost, setParentPost] = useState<Post | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadPost = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Construct the AT URI - handle can be either a handle or a DID
      const uri = `at://${handle}/app.bsky.feed.post/${postId}`
      
      // Try to get the thread which includes parent and replies
      const thread = await getPostThread(uri)
      
      if (thread?.post) {
        setPost(thread.post as Post)
        
        // Get parent post if this is a reply
        if (thread.parent?.post) {
          setParentPost(thread.parent.post as Post)
        }
        
        // Get replies - they are already Post objects, not wrapped
        if (thread.replies && Array.isArray(thread.replies)) {
          setReplies(thread.replies as Post[])
        }
      } else {
        // Fallback to single post fetch
        const singlePost = await getPost(uri)
        if (singlePost) {
          setPost(singlePost as Post)
        } else {
          setError("Post not found")
        }
      }
    } catch (err) {
      console.error("Failed to load post:", err)
      setError("Failed to load post")
    } finally {
      setIsLoading(false)
    }
  }, [handle, postId, getPost, getPostThread])

  useEffect(() => {
    loadPost()
  }, [loadPost])

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-14 items-center gap-4 px-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <h1 className="text-xl font-bold">Post</h1>
          </div>
        </header>
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="min-h-screen">
        <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-14 items-center gap-4 px-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <h1 className="text-xl font-bold">Post</h1>
          </div>
        </header>
        <div className="flex flex-col items-center justify-center py-12 text-center px-4">
          <p className="text-muted-foreground mb-4">{error || "Post not found"}</p>
          <Button asChild>
            <Link href="/">Go Home</Link>
          </Button>
        </div>
      </div>
    )
  }

  const isOwnPost = user?.did === post.author.did

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center gap-4 px-4">
          <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Post</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto">
        {/* Parent post if this is a reply */}
        {parentPost && (
          <div className="border-b border-border opacity-75">
            <div className="px-4 py-2 text-xs text-muted-foreground">
              Replying to
            </div>
            {isAuthenticated ? (
              <PostCard post={parentPost} isOwnPost={user?.did === parentPost.author.did} />
            ) : (
              <PublicPostCard post={parentPost} />
            )}
          </div>
        )}

        {/* Main post */}
        <div className="border-b border-border">
          {isAuthenticated ? (
            <PostCard 
              post={post} 
              isOwnPost={isOwnPost}
              onPostUpdated={loadPost}
            />
          ) : (
            <PublicPostCard post={post} />
          )}
        </div>

        {/* Replies section */}
        {replies.length > 0 && (
          <div className="border-b border-border">
            <div className="px-4 py-3 flex items-center gap-2 text-sm font-medium">
              <MessageCircle className="h-4 w-4" />
              {replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}
            </div>
          </div>
        )}

        {replies.map((reply) => (
          <div key={reply.uri} className="border-b border-border">
            {isAuthenticated ? (
              <PostCard 
                post={reply} 
                isOwnPost={user?.did === reply.author.did}
                onPostUpdated={loadPost}
              />
            ) : (
              <PublicPostCard post={reply} />
            )}
          </div>
        ))}

        {replies.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No replies yet</p>
          </div>
        )}
      </main>
    </div>
  )
}
