"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { Heart, MessageCircle, Repeat2, MoreHorizontal, Pencil, Trash2, Quote, Flag, Share, ExternalLink, Sparkles, Loader2, BookmarkPlus, Bookmark, Copy, Pin, PinOff, Star, UserPlus, BarChart3, Eye, MousePointerClick } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { MarkdownRenderer, RichMarkdownRenderer } from "@/components/markdown-renderer"
import { ComposeInput, type LinkCardData, type MediaFile } from "@/components/compose-input"
import { UserHoverCard } from "@/components/user-hover-card"
import { VerifiedBadge } from "@/components/verified-badge"
import { HandleLink } from "@/components/handle-link"
import { useBluesky } from "@/lib/bluesky-context"
import { cn } from "@/lib/utils"

function formatEngagement(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
  return count.toString()
}

interface PostCardProps {
  post: {
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
    embed?: any
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
  isOwnPost?: boolean
  isPinned?: boolean
  onPostUpdated?: () => void
  showReplyContext?: boolean
}

export function PostCard({
                           post,
                           isOwnPost,
                           isPinned,
                           onPostUpdated,
                           showReplyContext = true,
                         }: PostCardProps) {
  const {
    likePost,
    unlikePost,
    repost,
    unrepost,
    editPost,
    deletePost,
    createPost,
    quotePost,
    reportPost,
    pinPost,
    unpinPost,
    addHighlight,
    followUser,
    getProfile,
    user,
    isAuthenticated,
    login,
    addBookmark,
    removeBookmark,
    isBookmarked: checkIsBookmarked,
  } = useBluesky()

  const isBookmarked = checkIsBookmarked(post.uri)
  const [isLiked, setIsLiked] = useState(!!post.viewer?.like)
  const [isReposted, setIsReposted] = useState(!!post.viewer?.repost)
  const [likeCount, setLikeCount] = useState(post.likeCount)
  const [repostCount, setRepostCount] = useState(post.repostCount)
  const [replyCount, setReplyCount] = useState(post.replyCount)
  const [likeUri, setLikeUri] = useState(post.viewer?.like)
  const [repostUri, setRepostUri] = useState(post.viewer?.repost)

  // Dialogs
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isReplyDialogOpen, setIsReplyDialogOpen] = useState(false)
  const [isQuoteDialogOpen, setIsQuoteDialogOpen] = useState(false)
  const [isRepostDialogOpen, setIsRepostDialogOpen] = useState(false)
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false)
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false)
  const [isFactCheckOpen, setIsFactCheckOpen] = useState(false)

  const [editText, setEditText] = useState(post.record.text)
  const [replyText, setReplyText] = useState("")
  const [quoteText, setQuoteText] = useState("")
  const [replyMediaFiles, setReplyMediaFiles] = useState<MediaFile[]>([])
  const [replyLinkCard, setReplyLinkCard] = useState<LinkCardData | null>(null)
  const [quoteMediaFiles, setQuoteMediaFiles] = useState<MediaFile[]>([])
  const [quoteLinkCard, setQuoteLinkCard] = useState<LinkCardData | null>(null)

  const [isFollowing, setIsFollowing] = useState<boolean | null>(null)
  const [isFollowLoading, setIsFollowLoading] = useState(false)
  const [reportReason, setReportReason] = useState("spam")
  const [reportDetails, setReportDetails] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [factCheckResult, setFactCheckResult] = useState<string | null>(null)
  const [isFactChecking, setIsFactChecking] = useState(false)
  const [isPinning, setIsPinning] = useState(false)
  const [isHighlighting, setIsHighlighting] = useState(false)
  const [viewCount, setViewCount] = useState(0)
  const [linkClickCount, setLinkClickCount] = useState(0)
  const [isBookmarking, setIsBookmarking] = useState(false)

  const cardRef = useRef<HTMLDivElement>(null)
  const hasTrackedView = useRef(false)

  // ────────────────────────────────────────────────
  //   ALL YOUR EXISTING HANDLERS GO HERE (UNCHANGED)
  //   Copy-paste them from your original file
  // ────────────────────────────────────────────────

  // handleAuthRequired, handleLike, handleRepostClick, handleRepost,
  // handleEdit, handleDelete, handleReply, handleQuote, handleReport,
  // handleReplyClick, handleShare, openOnBluesky, handleFactCheck,
  // handleBookmark, handleCopyText, handlePinPost, handleUnpinPost,
  // handleAddHighlight, trackLinkClick, handleFollow
  // ... paste all of them here ...

  const isRepostReason = post.reason?.$type === "app.bsky.feed.defs#reasonRepost"

  return (
    <>
      <article
        ref={cardRef}
        className="border-b border-border hover:bg-accent/50 transition-colors"
      >
        {/* Header */}
        <div className="grid grid-cols-[auto_1fr_auto] gap-2 px-3 sm:px-4 pt-3 pb-2">
          <div>
            <UserHoverCard handle={post.author.handle}>
              <Link href={`/profile/${post.author.handle}`} className="shrink-0 relative">
                <Avatar className="h-9 w-9 sm:h-10 sm:w-10 cursor-pointer hover:opacity-80 transition-opacity">
                  <AvatarImage src={post.author.avatar || "/placeholder.svg"} alt={post.author.displayName || post.author.handle} />
                  <AvatarFallback className="text-sm">
                    {(post.author.displayName || post.author.handle).slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <VerifiedBadge
                  handle={post.author.handle}
                  did={post.author.did}
                  className="absolute left-5 top-7 rounded-full"
                />
              </Link>
            </UserHoverCard>
          </div>

          <div className="flex flex-col gap-2">
            <div>
              {post.author.displayName}
              <VerifiedBadge handle={post.author.handle} did={post.author.did} className="pt-1" />
            </div>
            <div className="flex flex-row gap-2">
              <HandleLink handle={post.author.handle} className="text-sm truncate max-w-[120px] sm:max-w-none" />
              <Link
                href={`/profile/${post.author.handle}/post/${post.uri.split("/").pop()}`}
                className="text-muted-foreground text-xs sm:text-sm whitespace-nowrap hover:underline"
              >
                {formatDistanceToNow(new Date(post.record.createdAt), { addSuffix: true })}
              </Link>
              {showReplyContext && post.record.reply && (
                <div className="text-sm text-muted-foreground mb-1">Replying to a thread</div>
              )}
              {isRepostReason && post.reason?.by && (
                <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
                  <Repeat2 className="h-4 w-4 shrink-0" />
                  <Link href={`/profile/${post.reason.by.handle}`} className="hover:underline truncate">
                    {post.reason.by.displayName || post.reason.by.handle} reposted
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-row gap-1 items-start">
            {!isOwnPost && isFollowing === false && (
              <Button
                variant="outline"
                size="sm"
                className="h-6 px-2 text-xs ml-1"
                onClick={handleFollow}
                disabled={isFollowLoading}
              >
                {isFollowLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <>
                    <UserPlus className="h-3 w-3 mr-1" />
                    Follow
                  </>
                )}
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleFactCheck}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  AI Fact-Check
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleBookmark} disabled={isBookmarking}>
                  {isBookmarking ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : isBookmarked ? (
                    <>
                      <Bookmark className="mr-2 h-4 w-4 fill-current" />
                      Remove Bookmark
                    </>
                  ) : (
                    <>
                      <BookmarkPlus className="mr-2 h-4 w-4" />
                      Bookmark
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleCopyText}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Text
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleShare}>
                  <Share className="mr-2 h-4 w-4" />
                  Copy Link
                </DropdownMenuItem>
                <DropdownMenuItem onClick={openOnBluesky}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open on Bluesky
                </DropdownMenuItem>
                {isOwnPost && (
                  <>
                    <DropdownMenuSeparator />
                    {isPinned ? (
                      <DropdownMenuItem onClick={handleUnpinPost} disabled={isPinning}>
                        <PinOff className="mr-2 h-4 w-4" />
                        {isPinning ? "Unpinning..." : "Unpin from Profile"}
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onClick={handlePinPost} disabled={isPinning}>
                        <Pin className="mr-2 h-4 w-4" />
                        {isPinning ? "Pinning..." : "Pin to Profile"}
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={handleAddHighlight} disabled={isHighlighting}>
                      <Star className="mr-2 h-4 w-4 text-yellow-500" />
                      {isHighlighting ? "Adding..." : "Add to Highlights"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit (Pseudo)
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setIsDeleteDialogOpen(true)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
                {!isOwnPost && isAuthenticated && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setIsReportDialogOpen(true)}
                      className="text-destructive"
                    >
                      <Flag className="mr-2 h-4 w-4" />
                      Report Post
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Content */}
        <div className="px-3 sm:px-4 pb-3">
          <div className="flex gap-2 sm:gap-3">
            <div className="flex-1 min-w-0 overflow-hidden">
              <div className="mt-2">
                <MarkdownRenderer content={post.record.text} />
              </div>

              {post.embed?.images && post.embed.images.length > 0 && (
                <div
                  className={cn(
                    "mt-3 grid gap-2",
                    post.embed.images.length === 1 && "grid-cols-1",
                    post.embed.images.length === 2 && "grid-cols-2",
                    post.embed.images.length >= 3 && "grid-cols-2"
                  )}
                >
                  {post.embed.images.map((img: any, idx: number) => (
                    <a
                      key={idx}
                      href={img.fullsize}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative rounded-lg overflow-hidden"
                    >
                      <img
                        src={img.thumb}
                        alt={img.alt || "Image"}
                        className="w-full h-auto max-h-80 object-cover rounded-lg"
                      />
                    </a>
                  ))}
                </div>
              )}

              {/* paste your external embed, quoted post rendering here if needed */}

              <div className="mt-2 sm:mt-3 flex items-center -ml-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 text-muted-foreground h-8 px-2 hover:text-primary hover:bg-primary/10"
                  onClick={handleReplyClick}
                >
                  <MessageCircle className="h-4 w-4" />
                  <span className="text-xs sm:text-sm tabular-nums">{replyCount}</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "gap-1 h-8 px-2 hover:text-green-500 hover:bg-green-500/10",
                    isReposted ? "text-green-500" : "text-muted-foreground"
                  )}
                  onClick={handleRepostClick}
                >
                  <Repeat2 className="h-4 w-4" />
                  <span className="text-xs sm:text-sm tabular-nums">{repostCount}</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "gap-1 h-8 px-2 hover:text-red-500 hover:bg-red-500/10",
                    isLiked ? "text-red-500" : "text-muted-foreground"
                  )}
                  onClick={handleLike}
                >
                  <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
                  <span className="text-xs sm:text-sm tabular-nums">{likeCount}</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "gap-1 h-8 px-2 hover:text-blue-500 hover:bg-blue-500/10",
                    isBookmarked ? "text-blue-500" : "text-muted-foreground"
                  )}
                  onClick={handleBookmark}
                  title={isBookmarked ? "Remove bookmark" : "Bookmark"}
                >
                  <Bookmark className={cn("h-4 w-4", isBookmarked && "fill-current")} />
                </Button>

                {viewCount > 0 && (
                  <span
                    className="flex items-center gap-1 h-8 px-2 text-muted-foreground ml-auto"
                    title={`${viewCount} views`}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span className="text-xs tabular-nums">{formatEngagement(viewCount)}</span>
                  </span>
                )}

                {(replyCount + repostCount + likeCount + viewCount) > 0 && (
                  <button
                    onClick={() => setIsAnalyticsOpen(true)}
                    className={cn(
                      "flex items-center gap-1 h-8 px-2 text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 rounded-md transition-colors",
                      viewCount === 0 && "ml-auto"
                    )}
                    title="View post analytics"
                  >
                    <BarChart3 className="h-3.5 w-3.5" />
                    <span className="text-xs tabular-nums">
                      {formatEngagement(replyCount + repostCount + likeCount)}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </article>

      {/* ────────────────────────────────────────────────
          ALL DIALOGS BELOW – COPY THEM FROM YOUR ORIGINAL FILE
      ──────────────────────────────────────────────── */}

      <Dialog open={isReplyDialogOpen} onOpenChange={(open) => {
        setIsReplyDialogOpen(open)
        if (!open) {
          setReplyMediaFiles([])
          setReplyLinkCard(null)
        }
      }}>
        {/* ... your reply dialog content ... */}
      </Dialog>

      <Dialog open={isRepostDialogOpen} onOpenChange={setIsRepostDialogOpen}>
        {/* ... repost dialog ... */}
      </Dialog>

      <Dialog open={isQuoteDialogOpen} onOpenChange={(open) => {
        setIsQuoteDialogOpen(open)
        if (!open) {
          setQuoteMediaFiles([])
          setQuoteLinkCard(null)
        }
      }}>
        {/* ... quote dialog ... */}
      </Dialog>

      <Dialog open={isAnalyticsOpen} onOpenChange={setIsAnalyticsOpen}>
        {/* ... analytics dialog ... */}
      </Dialog>

      <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
        {/* ... report dialog ... */}
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        {/* ... edit dialog ... */}
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        {/* ... delete dialog ... */}
      </Dialog>

      <Dialog open={isFactCheckOpen} onOpenChange={setIsFactCheckOpen}>
        {/* ... fact check dialog ... */}
      </Dialog>
    </>
  )
}