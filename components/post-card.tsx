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
import { MarkdownRenderer } from "@/components/markdown-renderer"
import { ComposeInput } from "@/components/compose-input"
import { UserHoverCard } from "@/components/user-hover-card"
import { VerifiedBadge } from "@/components/verified-badge"
import { HandleLink } from "@/components/handle-link"
import { useBluesky } from "@/lib/bluesky-context"
import { cn } from "@/lib/utils"
import { BlueskyContent } from "@/components/bluesky-content"
import { BlueskyHeader } from "@/components/bluesky-header"
import { BlueskyFooter } from "@/components/bluesky-footer"

function formatEngagement(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
  return count.toString()
}

interface PostCardProps {
  post: any
  isOwnPost?: boolean
  isPinned?: boolean
  onPostUpdated?: () => void
  showReplyContext?: boolean
}

export function PostCard({
                           post,
                           isOwnPost = false,
                           isPinned = false,
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
    addBookmark,
    removeBookmark,
    isBookmarked: checkIsBookmarked,
    user,
    isAuthenticated,
    login,
  } = useBluesky()

  const isBookmarked = checkIsBookmarked(post.uri)

  const [isLiked, setIsLiked] = useState(!!post.viewer?.like)
  const [isReposted, setIsReposted] = useState(!!post.viewer?.repost)
  const [likeCount, setLikeCount] = useState(post.likeCount)
  const [repostCount, setRepostCount] = useState(post.repostCount)
  const [replyCount, setReplyCount] = useState(post.replyCount)
  const [likeUri, setLikeUri] = useState(post.viewer?.like)
  const [repostUri, setRepostUri] = useState(post.viewer?.repost)

  const [editText, setEditText] = useState(post.record.text || "")
  const [replyText, setReplyText] = useState("")
  const [quoteText, setQuoteText] = useState("")
  const [reportReason, setReportReason] = useState("spam")
  const [reportDetails, setReportDetails] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isFactCheckOpen, setIsFactCheckOpen] = useState(false)
  const [factCheckResult, setFactCheckResult] = useState<string | null>(null)
  const [isFactChecking, setIsFactChecking] = useState(false)
  const [isPinning, setIsPinning] = useState(false)
  const [isHighlighting, setIsHighlighting] = useState(false)
  const [isBookmarking, setIsBookmarking] = useState(false)
  const [isFollowLoading, setIsFollowLoading] = useState(false)

  const [isReplyDialogOpen, setIsReplyDialogOpen] = useState(false)
  const [isQuoteDialogOpen, setIsQuoteDialogOpen] = useState(false)
  const [isRepostDialogOpen, setIsRepostDialogOpen] = useState(false)
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false)
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

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

  const handleRepost = async () => {
    if (!handleAuthRequired()) return
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

  const handleReply = async () => {
    if (!replyText.trim()) return
    setIsLoading(true)
    try {
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
    if (!quoteText.trim()) return
    setIsLoading(true)
    try {
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

  const handlePinToggle = async () => {
    if (!handleAuthRequired()) return
    setIsPinning(true)
    try {
      if (isPinned) {
        await unpinPost()
      } else {
        await pinPost(post.uri, post.cid)
      }
      onPostUpdated?.()
    } catch (error) {
      console.error("Pin/unpin failed:", error)
    } finally {
      setIsPinning(false)
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
      console.error("Bookmark failed:", error)
    } finally {
      setIsBookmarking(false)
    }
  }

  const handleCopyText = () => {
    navigator.clipboard.writeText(post.record.text).catch(() => {})
  }

  const handleShare = () => {
    const postUrl = `https://bsky.app/profile/${post.author?.handle}/post/${post.uri.split('/').pop()}`
    navigator.clipboard.writeText(postUrl).catch(() => window.open(postUrl, '_blank'))
  }

  const openOnBluesky = () => {
    window.open(`https://bsky.app/profile/${post.author?.handle}/post/${post.uri.split('/').pop()}`, '_blank')
  }

  const handleFollow = async () => {
    if (!handleAuthRequired()) return
    setIsFollowLoading(true)
    try {
      await followUser(post.author?.did)
    } catch (error) {
      console.error("Follow failed:", error)
    } finally {
      setIsFollowLoading(false)
    }
  }

  const handleFactCheck = async () => {
    setIsFactChecking(true)
    setIsFactCheckOpen(true)
    setFactCheckResult(null)
    try {
      // await fetch('/api/fact-check', { ... })
      setFactCheckResult("Fact-check placeholder - implement your API")
    } catch {
      setFactCheckResult("Unable to fact-check right now.")
    } finally {
      setIsFactChecking(false)
    }
  }

  const handleHighlight = async () => {
    if (!handleAuthRequired()) return
    setIsHighlighting(true)
    try {
      await addHighlight(post.uri, post.cid)
      onPostUpdated?.()
    } catch (error) {
      console.error("Highlight failed:", error)
    } finally {
      setIsHighlighting(false)
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
      console.error("Edit failed:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const isRepostReason = post.reason?.$type === 'app.bsky.feed.defs#reasonRepost'

  return (
    <div className="hover:bg-accent/50 transition-colors border-b-2 border-b-red-600">
      <div className="p-3">
        {/* Header */}
        <BlueskyHeader
          post={post}
          isOwnPost={isOwnPost}
          isPinned={isPinned}
          showReplyContext={showReplyContext}
          isFollowLoading={isFollowLoading}
          onFollow={handleFollow}
          onBookmark={handleBookmark}
          onCopyText={handleCopyText}
          onShare={handleShare}
          onOpenBluesky={openOnBluesky}
          onPinToggle={handlePinToggle}
          onHighlight={handleHighlight}
          onEdit={() => setIsEditDialogOpen(true)}
          onDelete={() => setIsDeleteDialogOpen(true)}
          onReport={() => setIsReportDialogOpen(true)}
          onFactCheck={handleFactCheck}
        />

        {/* Content */}
        <BlueskyContent post={post} className="mt-2" />

        {/* Footer */}
        <BlueskyFooter
          replyCount={replyCount}
          repostCount={repostCount}
          likeCount={likeCount}
          isLiked={isLiked}
          isReposted={isReposted}
          isBookmarked={isBookmarked}
          onLike={handleLike}
          onRepostClick={() => setIsRepostDialogOpen(true)}
          onReplyClick={() => setIsReplyDialogOpen(true)}
          onBookmark={handleBookmark}
          onAnalyticsClick={() => setIsAnalyticsOpen(true)}
        />
      </div>

      {/* Reply Dialog */}
      <Dialog open={isReplyDialogOpen} onOpenChange={setIsReplyDialogOpen}>
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
              text={replyText}
              onTextChange={setReplyText}
              placeholder="Write your reply..."
              onSubmit={handleReply}
              isLoading={isLoading}
              onCancel={() => setIsReplyDialogOpen(false)}
              compact
              autoFocus
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Quote Dialog */}
      <Dialog open={isQuoteDialogOpen} onOpenChange={setIsQuoteDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Quote Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <ComposeInput
              text={quoteText}
              onTextChange={setQuoteText}
              placeholder="Add your thoughts..."
              onSubmit={handleQuote}
              isLoading={isLoading}
              onCancel={() => setIsQuoteDialogOpen(false)}
              compact
              autoFocus
            />

            <div className="border rounded-lg p-3 bg-muted/30">
              <MarkdownRenderer content={post.record.text} />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Repost Dialog */}
      <Dialog open={isRepostDialogOpen} onOpenChange={setIsRepostDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Repost</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Button variant="outline" onClick={handleRepost}>
              {isReposted ? "Undo Repost" : "Repost"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsRepostDialogOpen(false)
                setIsQuoteDialogOpen(true)
              }}
            >
              Quote Post
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Report Dialog */}
      <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Report Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <RadioGroup value={reportReason} onValueChange={setReportReason}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="spam" id="spam" />
                <Label htmlFor="spam">Spam or misleading</Label>
              </div>
              {/* ... your other radio options ... */}
            </RadioGroup>

            <div>
              <Label htmlFor="details">Additional details (optional)</Label>
              <Textarea
                id="details"
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                className="mt-1"
                placeholder="Provide more context..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReportDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReport} disabled={isLoading}>
              {isLoading ? "Reporting..." : "Submit Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Post (Pseudo-Edit)</DialogTitle>
            <DialogDescription>
              This will delete your original post and create a new one with the edited content.
              Likes and reposts will be lost.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="min-h-32"
            placeholder="What's happening?"
          />
          <p className="text-xs text-muted-foreground">
            Supports Markdown: **bold**, *italic*, `code`, [links](url), lists, etc.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={isLoading || !editText.trim()}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Post</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            Are you sure you want to delete this post? This action cannot be undone.
          </DialogDescription>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
              {isLoading ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fact-Check Dialog */}
      <Dialog open={isFactCheckOpen} onOpenChange={setIsFactCheckOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Fact-Check
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-sm line-clamp-4">{post.record.text}</p>
            </div>
            {isFactChecking ? (
              <div className="flex flex-col items-center justify-center py-8 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Analyzing claims...</p>
              </div>
            ) : factCheckResult ? (
              <div className="p-4 rounded-lg border bg-background">
                <MarkdownRenderer content={factCheckResult} />
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFactCheckOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Analytics Dialog */}
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
    </div>
  )
}