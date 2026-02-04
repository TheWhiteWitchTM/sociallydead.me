"use client"

import { formatDistanceToNow } from "date-fns"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { MarkdownRenderer } from "@/components/markdown-renderer"
import { MessageCircle, Repeat2, Heart } from "lucide-react"
import { useBluesky } from "@/lib/bluesky-context"

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

interface PublicPostCardProps {
  post: Post
}

export function PublicPostCard({ post }: PublicPostCardProps) {
  const { login } = useBluesky()
  const timeAgo = formatDistanceToNow(new Date(post.record.createdAt), { addSuffix: true })

  const handleInteraction = () => {
    login()
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={post.author.avatar || "/placeholder.svg"} alt={post.author.displayName || post.author.handle} />
            <AvatarFallback>
              {(post.author.displayName || post.author.handle).slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold truncate">
                {post.author.displayName || post.author.handle}
              </span>
              <span className="text-sm text-muted-foreground truncate">
                @{post.author.handle}
              </span>
              <span className="text-sm text-muted-foreground">
                {timeAgo}
              </span>
            </div>
            
            <div className="mt-2">
              <MarkdownRenderer content={post.record.text} />
            </div>
            
            <div className="mt-3 flex items-center gap-6">
              <button
                onClick={handleInteraction}
                className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
                title="Sign in to reply"
              >
                <MessageCircle className="h-4 w-4" />
                <span className="text-sm">{post.replyCount}</span>
              </button>
              
              <button
                onClick={handleInteraction}
                className="flex items-center gap-1 text-muted-foreground hover:text-green-500 transition-colors"
                title="Sign in to repost"
              >
                <Repeat2 className="h-4 w-4" />
                <span className="text-sm">{post.repostCount}</span>
              </button>
              
              <button
                onClick={handleInteraction}
                className="flex items-center gap-1 text-muted-foreground hover:text-red-500 transition-colors"
                title="Sign in to like"
              >
                <Heart className="h-4 w-4" />
                <span className="text-sm">{post.likeCount}</span>
              </button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
