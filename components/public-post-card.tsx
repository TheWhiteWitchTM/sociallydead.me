"use client"

import { useState } from "react"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { MarkdownRenderer } from "@/components/markdown-renderer"
import { UserHoverCard } from "@/components/user-hover-card"
import { VerifiedBadge } from "@/components/verified-badge"
import { HandleLink } from "@/components/handle-link"
import { MessageCircle, Repeat2, Heart, BarChart3 } from "lucide-react"

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
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false)
  const timeAgo = formatDistanceToNow(new Date(post.record.createdAt), { addSuffix: true })
  const totalEngagement = post.replyCount + post.repostCount + post.likeCount

  return (
    <>
    <Card className="border-border hover:bg-accent/50 transition-colors rounded-none sm:rounded-lg border-x-0 sm:border-x">
        <CardContent className="p-3 sm:p-4">
          <div className="flex gap-2 sm:gap-3">
            <UserHoverCard handle={post.author.handle}>
              <Link href={`/profile/${post.author.handle}`} className="shrink-0 relative">
                <Avatar className="h-9 w-9 sm:h-10 sm:w-10 cursor-pointer hover:opacity-80 transition-opacity">
                  <AvatarImage src={post.author.avatar || "/placeholder.svg"} alt={post.author.displayName || post.author.handle} />
                  <AvatarFallback className="text-sm">
                    {(post.author.displayName || post.author.handle).slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  Card
                </div>
                <VerifiedBadge 
                  handle={post.author.handle} 
                  did={post.author.did}
                  className="absolute -right-1 -bottom-1 scale-50 origin-bottom-right bg-background rounded-full" 
                />
              </Link>
            </UserHoverCard>
            
            <div className="flex-1 min-w-0 overflow-hidden">
              <div className="flex flex-wrap items-center gap-x-1 leading-tight">
                <UserHoverCard handle={post.author.handle}>
                  <Link href={`/profile/${post.author.handle}`} className="font-semibold break-all hover:underline">
                    {post.author.displayName || post.author.handle}
                  </Link>
                </UserHoverCard>
                <HandleLink handle={post.author.handle} className="text-sm truncate max-w-[120px] sm:max-w-none" />
                <span className="text-muted-foreground hidden sm:inline">·</span>
                <span className="text-xs sm:text-sm text-muted-foreground">
                  {timeAgo}
                </span>
              </div>
              
              <div className="mt-2">
                <MarkdownRenderer content={post.record.text} />
              </div>
              
              <div className="mt-2 sm:mt-3 flex items-center -ml-2">
                <span
                  className="flex items-center gap-1 px-2 py-1 text-muted-foreground cursor-default"
                  title="Sign in to reply"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span className="text-xs sm:text-sm tabular-nums">{post.replyCount}</span>
                </span>
                
                <span
                  className="flex items-center gap-1 px-2 py-1 text-muted-foreground cursor-default"
                  title="Sign in to repost"
                >
                  <Repeat2 className="h-4 w-4" />
                  <span className="text-xs sm:text-sm tabular-nums">{post.repostCount}</span>
                </span>
                
                <span
                  className="flex items-center gap-1 px-2 py-1 text-muted-foreground cursor-default"
                  title="Sign in to like"
                >
                  <Heart className="h-4 w-4" />
                  <span className="text-xs sm:text-sm tabular-nums">{post.likeCount}</span>
                </span>
                
                {totalEngagement > 0 && (
                  <button
                    onClick={() => setIsAnalyticsOpen(true)}
                    className="flex items-center gap-1 px-2 py-1 text-muted-foreground ml-auto hover:text-blue-500 hover:bg-blue-500/10 rounded-md transition-colors"
                    title="View post analytics"
                  >
                    <BarChart3 className="h-3.5 w-3.5" />
                    <span className="text-xs tabular-nums">
                      {totalEngagement >= 1000000 ? `${(totalEngagement / 1000000).toFixed(1)}M` : totalEngagement >= 1000 ? `${(totalEngagement / 1000).toFixed(1)}K` : totalEngagement}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Post Analytics Dialog */}
      <Dialog open={isAnalyticsOpen} onOpenChange={setIsAnalyticsOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Post Analytics
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-500/10">
                    <MessageCircle className="h-4 w-4 text-blue-500" />
                  </div>
                  <span className="text-sm font-medium">Replies</span>
                </div>
                <span className="text-lg font-bold tabular-nums">{post.replyCount.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-green-500/10">
                    <Repeat2 className="h-4 w-4 text-green-500" />
                  </div>
                  <span className="text-sm font-medium">Reposts</span>
                </div>
                <span className="text-lg font-bold tabular-nums">{post.repostCount.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-red-500/10">
                    <Heart className="h-4 w-4 text-red-500" />
                  </div>
                  <span className="text-sm font-medium">Likes</span>
                </div>
                <span className="text-lg font-bold tabular-nums">{post.likeCount.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-purple-500/10">
                    <BarChart3 className="h-4 w-4 text-purple-500" />
                  </div>
                  <span className="text-sm font-medium">Total Engagements</span>
                </div>
                <span className="text-lg font-bold tabular-nums">{totalEngagement.toLocaleString()}</span>
              </div>
            </div>
            {totalEngagement > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Engagement Breakdown</p>
                <div className="h-3 w-full rounded-full bg-muted overflow-hidden flex">
                  {post.replyCount > 0 && (
                    <div className="h-full bg-blue-500" style={{ width: `${(post.replyCount / totalEngagement) * 100}%` }} />
                  )}
                  {post.repostCount > 0 && (
                    <div className="h-full bg-green-500" style={{ width: `${(post.repostCount / totalEngagement) * 100}%` }} />
                  )}
                  {post.likeCount > 0 && (
                    <div className="h-full bg-red-500" style={{ width: `${(post.likeCount / totalEngagement) * 100}%` }} />
                  )}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-blue-500" />
                    Replies
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                    Reposts
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-red-500" />
                    Likes
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
