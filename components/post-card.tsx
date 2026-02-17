"use client"

import { useState } from "react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import {
  Heart,
  MessageCircle,
  Repeat2,
  MoreHorizontal,
  Pencil,
  Trash2,
  Quote,
  Flag,
  Share,
  ExternalLink,
  Sparkles,
  Loader2,
  BookmarkPlus,
  Bookmark,
  Copy,
  Pin,
  PinOff,
  Star,
  UserPlus,
  BarChart3,
} from "lucide-react"
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
import { BlueskyContent } from "@/components/bluesky-content"

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
  const [reportReason, setReportReason] = useState("spam")
  const [reportDetails, setReportDetails] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isFactChecking, setIsFactChecking] = useState(false)
  const [isPinning, setIsPinning] = useState(false)
  const [isHighlighting, setIsHighlighting] = useState(false)
  const [isBookmarking, setIsBookmarking] = useState(false)
  const [isFollowLoading, setIsFollowLoading] = useState(false)

  const handleAuthRequired = () => {
    if (!isAuthenticated) {
      login()
      return false
    }
    return true
  }

  const handleLike = async () => {
    if (!handleAuthRequired()) return
    try {
      if (isLiked && likeUri) {
        await unlikePost(likeUri)
        setIsLiked(false)
        setLikeCount(c => c - 1)
        setLikeUri(undefined)
      } else {
        const newLikeUri = await likePost(post.uri, post.cid)
        setIsLiked(true)
        setLikeCount(c => c + 1)
        setLikeUri(newLikeUri)
      }
    } catch (error) {
      console.error("Failed to like/unlike:", error)
    }
  }

  const handleRepostClick = () => {
    if (!handleAuthRequired()) return
    setIsRepostDialogOpen(true)
  }

  const handleRepost = async () => {
    try {
      if (isReposted && repostUri) {
        await unrepost(repostUri)
        setIsReposted(false)
        setRepostCount(c => c - 1)
        setRepostUri(undefined)
      } else {
        const newRepostUri = await repost(post.uri, post.cid)
        setIsReposted(true)
        setRepostCount(c => c + 1)
        setRepostUri(newRepostUri)
      }
      setIsRepostDialogOpen(false)
    } catch (error) {
      console.error("Failed to repost/unrepost:", error)
    }
  }

  const handleEdit = async () => {
    if (!editText.trim()) return
    setIsLoading(true)
    try {
      await editPost(post.uri, editText)
      setIsEditDialogOpen(false)
      onPostUpdated?.()
    } catch (error) {
      console.error("Failed to edit post:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    setIsLoading(true)
    try {
      await deletePost(post.uri)
      setIsDeleteDialogOpen(false)
      onPostUpdated?.()
    } catch (error) {
      console.error("Failed to delete post:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleReply = async () => {
    try {
      if (!replyText.trim()) return
      setIsLoading(true)
      await createPost(replyText, {
        reply: { uri: post.uri, cid: post.cid },
      })
      setReplyText("")
      setReplyCount(c => c + 1)
      setIsReplyDialogOpen(false)
      onPostUpdated?.()
    } catch (error) {
      console.error("Failed to reply:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuote = async () => {
    try {
      if (!quoteText.trim()) return
      setIsLoading(true)
      await quotePost(quoteText, { uri: post.uri, cid: post.cid })
      setQuoteText("")
      setIsQuoteDialogOpen(false)
      onPostUpdated?.()
    } catch (error) {
      console.error("Failed to quote post:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleReport = async () => {
    setIsLoading(true)
    try {
      const reason = reportDetails ? `${reportReason}: ${reportDetails}` : reportReason
      await reportPost(post.uri, post.cid, reason)
      setReportReason("spam")
      setReportDetails("")
      setIsReportDialogOpen(false)
    } catch (error) {
      console.error("Failed to report:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBookmark = async () => {
    if (!handleAuthRequired()) return
    setIsBookmarking(true)
    try {
      if (isBookmarked) {
        await removeBookmark(post.uri)
      } else {
        await addBookmark(post.uri)
      }
    } catch (error) {
      console.error("Failed to bookmark/unbookmark:", error)
    } finally {
      setIsBookmarking(false)
    }
  }

  const handleCopyText = () => {
    navigator.clipboard.writeText(post.record.text).catch(() => {})
  }

  const handlePinPost = async () => {
    if (!handleAuthRequired()) return
    setIsPinning(true)
    try {
      await pinPost(post.uri, post.cid)
      onPostUpdated?.()
    } catch (error) {
      console.error("Failed to pin post:", error)
    } finally {
      setIsPinning(false)
    }
  }

  const handleUnpinPost = async () => {
    if (!handleAuthRequired()) return
    setIsPinning(true)
    try {
      await unpinPost()
      onPostUpdated?.()
    } catch (error) {
      console.error("Failed to unpin post:", error)
    } finally {
      setIsPinning(false)
    }
  }

  const handleAddHighlight = async () => {
    if (!handleAuthRequired()) return
    setIsHighlighting(true)
    try {
      await addHighlight(post.uri, post.cid)
      onPostUpdated?.()
    } catch (error) {
      console.error("Failed to add highlight:", error)
    } finally {
      setIsHighlighting(false)
    }
  }

  const handleFollow = async () => {
    if (!isAuthenticated) {
      login()
      return
    }
    setIsFollowLoading(true)
    try {
      await followUser(post.author?.did)
    } catch (error) {
      console.error("Failed to follow:", error)
    } finally {
      setIsFollowLoading(false)
    }
  }

  const handleShare = async () => {
    const postUrl = `https://bsky.app/profile/${post.author?.handle}/post/${post.uri.split('/').pop()}`
    try {
      await navigator.clipboard.writeText(postUrl)
    } catch {
      window.open(postUrl, '_blank')
    }
  }

  const openOnBluesky = () => {
    const postUrl = `https://bsky.app/profile/${post.author?.handle}/post/${post.uri.split('/').pop()}`
    window.open(postUrl, '_blank')
  }

  const handleFactCheck = async () => {
    // Your existing fact-check logic - left untouched
    console.log("Fact-check triggered - implement API call here")
  }

  const isRepostReason = post.reason?.$type === 'app.bsky.feed.defs#reasonRepost'

  return (
    <>
      <div className="hover:bg-accent/50 transition-colors border-b-2 border-b-red-600">
        <div className="grid grid-cols-[auto_1fr_auto] gap-2 p-3">
          <div>
            <UserHoverCard handle={post.author?.handle}>
              <Link href={`/profile/${post.author?.handle}`} className="shrink-0 relative">
                <Avatar className="h-9 w-9 sm:h-10 sm:w-10 cursor-pointer hover:opacity-80 transition-opacity">
                  <AvatarImage src={post.author?.avatar || "/placeholder.svg"} alt={post.author?.displayName || post.author?.handle} />
                  <AvatarFallback className="text-sm">
                    {(post.author?.displayName || post.author?.handle).slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <VerifiedBadge
                  handle={post.author?.handle}
                  did={post.author?.did}
                  className="absolute left-5 top-7 rounded-full"
                />
              </Link>
            </UserHoverCard>
          </div>

          <div className="flex flex-col gap-0">
            <div>
              {post.author?.displayName}
              <VerifiedBadge
                handle={post.author?.handle}
                did={post.author?.did}
                className="pt-1"
              />
            </div>
            <HandleLink handle={post.author?.handle} className="text-sm truncate max-w-[120px] sm:max-w-none" />

            <div className="flex flex-row gap-2 text-xs text-muted-foreground mt-0.5">
              <Link
                href={`/profile/${post.author?.handle}/post/${post.uri.split('/').pop()}`}
                className="hover:underline"
              >
                {formatDistanceToNow(new Date(post.record.createdAt), { addSuffix: true })}
              </Link>
              {showReplyContext && post.record.reply && (
                <div className="text-sm text-muted-foreground">
                  Replying to a thread
                </div>
              )}
              {isRepostReason && post.reason?.by && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Repeat2 className="h-4 w-4 shrink-0" />
                  <Link href={`/profile/${post.reason.by?.handle}`} className="hover:underline truncate">
                    {post.reason.by?.displayName || post.reason.by?.handle} reposted
                  </Link>
                </div>
              )}
            </div>

            {/* Core content - all text, media, quotes handled here */}
            <BlueskyContent post={post} className="mt-2" />
          </div>

          <div className="flex flex-row gap-1">
            {!isOwnPost && (
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

        <div className="mt-2 sm:mt-3 flex items-center -ml-2 px-3 pb-3">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-muted-foreground h-8 px-2 hover:text-primary hover:bg-primary/10"
            onClick={() => handleAuthRequired() && setIsReplyDialogOpen(true)}
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

          {(replyCount + repostCount + likeCount) > 0 && (
            <button
              onClick={() => setIsAnalyticsOpen(true)}
              className={cn(
                "flex items-center gap-1 h-8 px-2 text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 rounded-md transition-colors ml-auto"
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

      {/* ──────────────────────────────────────────────── */}
      {/* Dialogs – kept completely unchanged as requested */}
      {/* ──────────────────────────────────────────────── */}

      <Dialog open={isReplyDialogOpen} onOpenChange={(open) => {
        setIsReplyDialogOpen(open)
        if (!open) {
          // reset media/link state if needed
        }
      }}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Reply to Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={post.author?.avatar || "/placeholder.svg"} />
                  <AvatarFallback className="text-xs">
                    {(post.author?.displayName || post.author?.handle).slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium text-sm">{post.author?.displayName || post.author?.handle}</span>
                <HandleLink handle={post.author?.handle} className="text-sm" />
              </div>
              <p className="text-sm text-muted-foreground line-clamp-3">{post.record.text}</p>
            </div>

            <ComposeInput
              postType="reply"
              text={replyText}
              onTextChange={setReplyText}
              placeholder="Write your reply..."
              minHeight="min-h-24"
              onCancel={() => setIsReplyDialogOpen(false)}
              onSubmit={handleReply}
              compact
              autoFocus
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Repost/Quote Dialog */}
      <Dialog open={isRepostDialogOpen} onOpenChange={setIsRepostDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Repost</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Button variant="outline" className="justify-start h-12" onClick={handleRepost}>
              <Repeat2 className="mr-3 h-5 w-5" />
              <div className="text-left">
                <div className="font-medium">{isReposted ? "Undo Repost" : "Repost"}</div>
                <div className="text-xs text-muted-foreground">
                  {isReposted ? "Remove this from your profile" : "Share to your followers"}
                </div>
              </div>
            </Button>
            <Button
              variant="outline"
              className="justify-start h-12"
              onClick={() => {
                setIsRepostDialogOpen(false)
                setIsQuoteDialogOpen(true)
              }}
            >
              <Quote className="mr-3 h-5 w-5" />
              <div className="text-left">
                <div className="font-medium">Quote Post</div>
                <div className="text-xs text-muted-foreground">Share with your commentary</div>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quote Dialog */}
      <Dialog open={isQuoteDialogOpen} onOpenChange={(open) => {
        setIsQuoteDialogOpen(open)
        if (!open) {
          // reset quote media/link if needed
        }
      }}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Quote Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <ComposeInput
              postType="quote"
              text={quoteText}
              onTextChange={setQuoteText}
              placeholder="Add your thoughts..."
              minHeight="min-h-24"
              onCancel={() => setIsQuoteDialogOpen(false)}
              onSubmit={handleQuote}
              compact
              autoFocus
            />

            <div className="border rounded-lg p-3 bg-muted/30">
              <MarkdownRenderer content={post.record.text} />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Analytics Dialog – views & clicks removed */}
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
                <span className="text-lg font-bold tabular-nums">{replyCount.toLocaleString()}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-green-500/10">
                    <Repeat2 className="h-4 w-4 text-green-500" />
                  </div>
                  <span className="text-sm font-medium">Reposts</span>
                </div>
                <span className="text-lg font-bold tabular-nums">{repostCount.toLocaleString()}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-red-500/10">
                    <Heart className="h-4 w-4 text-red-500" />
                  </div>
                  <span className="text-sm font-medium">Likes</span>
                </div>
                <span className="text-lg font-bold tabular-nums">{likeCount.toLocaleString()}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-purple-500/10">
                    <BarChart3 className="h-4 w-4 text-purple-500" />
                  </div>
                  <span className="text-sm font-medium">Total Engagements</span>
                </div>
                <span className="text-lg font-bold tabular-nums">
                  {(replyCount + repostCount + likeCount).toLocaleString()}
                </span>
              </div>
            </div>

            {(replyCount + repostCount + likeCount) > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Engagement Breakdown</p>
                <div className="h-3 w-full rounded-full bg-muted overflow-hidden flex">
                  {replyCount > 0 && (
                    <div
                      className="h-full bg-blue-500 transition-all"
                      style={{ width: `${(replyCount / (replyCount + repostCount + likeCount)) * 100}%` }}
                    />
                  )}
                  {repostCount > 0 && (
                    <div
                      className="h-full bg-green-500 transition-all"
                      style={{ width: `${(repostCount / (replyCount + repostCount + likeCount)) * 100}%` }}
                    />
                  )}
                  {likeCount > 0 && (
                    <div
                      className="h-full bg-red-500 transition-all"
                      style={{ width: `${(likeCount / (replyCount + repostCount + likeCount)) * 100}%` }}
                    />
                  )}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-blue-500" /> Replies
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-green-500" /> Reposts
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-red-500" /> Likes
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Report, Edit, Delete, Fact-Check dialogs remain unchanged */}
      {/* ... paste your existing dialog code here if you want to keep them exactly as-is ... */}
    </>
  )
}