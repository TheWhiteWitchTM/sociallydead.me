"use client"

import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { MarkdownRenderer } from "@/components/markdown-renderer"
import { MessageCircle, Repeat2, Heart } from "lucide-react"

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
  const timeAgo = formatDistanceToNow(new Date(post.record.createdAt), { addSuffix: true })

  return (
    <Card className="border-border hover:bg-accent/50 transition-colors">
        <CardContent className="p-3 sm:p-4">
          <div className="flex gap-2 sm:gap-3">
            <Avatar className="h-9 w-9 sm:h-10 sm:w-10 shrink-0">
              <AvatarImage src={post.author.avatar || "/placeholder.svg"} alt={post.author.displayName || post.author.handle} />
              <AvatarFallback className="text-sm">
                {(post.author.displayName || post.author.handle).slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0 overflow-hidden">
              <div className="flex flex-wrap items-center gap-x-1 leading-tight">
                <span className="font-semibold break-all">
                  {post.author.displayName || post.author.handle}
                </span>
                <span className="text-sm text-muted-foreground truncate max-w-[120px] sm:max-w-none">
                  @{post.author.handle}
                </span>
                <span className="text-muted-foreground hidden sm:inline">·</span>
                <span className="text-xs sm:text-sm text-muted-foreground">
                  {timeAgo}
                </span>
              </div>
              
              <div className="mt-2">
                <MarkdownRenderer content={post.record.text} />
              </div>
              
              <div className="mt-2 sm:mt-3 flex items-center -ml-2">
                <Link
                  href="/"
                  className="flex items-center gap-1 px-2 py-1 text-muted-foreground hover:text-primary transition-colors"
                  title="Sign in to reply"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span className="text-xs sm:text-sm tabular-nums">{post.replyCount}</span>
                </Link>
                
                <Link
                  href="/"
                  className="flex items-center gap-1 px-2 py-1 text-muted-foreground hover:text-green-500 transition-colors"
                  title="Sign in to repost"
                >
                  <Repeat2 className="h-4 w-4" />
                  <span className="text-xs sm:text-sm tabular-nums">{post.repostCount}</span>
                </Link>
                
                <Link
                  href="/"
                  className="flex items-center gap-1 px-2 py-1 text-muted-foreground hover:text-red-500 transition-colors"
                  title="Sign in to like"
                >
                  <Heart className="h-4 w-4" />
                  <span className="text-xs sm:text-sm tabular-nums">{post.likeCount}</span>
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
  )
}
