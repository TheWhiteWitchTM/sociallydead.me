"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { Heart, MessageCircle, Repeat2, MoreHorizontal, Pencil, Trash2, Quote, Flag, Share, ExternalLink, Sparkles, Loader2, BookmarkPlus, Bookmark, Copy, Pin, PinOff, Star, UserPlus, BarChart3, Eye, MousePointerClick } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {Card, CardContent, CardFooter, CardHeader} from "@/components/ui/card"
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
  isOwnPost?: boolean
  isPinned?: boolean
  onPostUpdated?: () => void
  showReplyContext?: boolean
}

export function PostCard({ post, isOwnPost, isPinned, onPostUpdated, showReplyContext = true }: PostCardProps) {
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

  const [editText, setEditText] = useState(post.record.text)
  const [replyText, setReplyText] = useState("")
  const [quoteText, setQuoteText] = useState("")

  // Analytics dialog
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false)

  // Reply media state
  const [replyMediaFiles, setReplyMediaFiles] = useState<MediaFile[]>([])
  const [replyLinkCard, setReplyLinkCard] = useState<LinkCardData | null>(null)

  // Quote media state
  const [quoteMediaFiles, setQuoteMediaFiles] = useState<MediaFile[]>([])
  const [quoteLinkCard, setQuoteLinkCard] = useState<LinkCardData | null>(null)

  // Follow state
  const [isFollowing, setIsFollowing] = useState<boolean | null>(null)
  const [isFollowLoading, setIsFollowLoading] = useState(false)
  const [reportReason, setReportReason] = useState("spam")
  const [reportDetails, setReportDetails] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isFactCheckOpen, setIsFactCheckOpen] = useState(false)
  const [factCheckResult, setFactCheckResult] = useState<string | null>(null)
  const [isFactChecking, setIsFactChecking] = useState(false)
  const [isPinning, setIsPinning] = useState(false)
  const [isHighlighting, setIsHighlighting] = useState(false)
  const [viewCount, setViewCount] = useState(0)
  const [linkClickCount, setLinkClickCount] = useState(0)
  const [isBookmarking, setIsBookmarking] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const hasTrackedView = useRef(false)

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
        setLikeCount((c) => c - 1)
        setLikeUri(undefined)
      } else {
        const newLikeUri = await likePost(post.uri, post.cid)
        setIsLiked(true)
        setLikeCount((c) => c + 1)
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
        setRepostCount((c) => c - 1)
        setRepostUri(undefined)
      } else {
        const newRepostUri = await repost(post.uri, post.cid)
        setIsReposted(true)
        setRepostCount((c) => c + 1)
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
    if (!replyText.trim() && replyMediaFiles.length === 0) return
    setIsLoading(true)
    try {
      const images = replyMediaFiles.filter(f => f.type === "image").map(f => f.file)
      const video = replyMediaFiles.find(f => f.type === "video")?.file
      await createPost(replyText, {
        reply: { uri: post.uri, cid: post.cid },
        images: images.length > 0 ? images : undefined,
        video: video || undefined,
        linkCard: replyLinkCard && !replyMediaFiles.length ? replyLinkCard : undefined,
      })
      setReplyText("")
      setReplyMediaFiles([])
      setReplyLinkCard(null)
      setReplyCount((c) => c + 1)
      setIsReplyDialogOpen(false)
      onPostUpdated?.()
    } catch (error) {
      console.error("Failed to reply:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuote = async () => {
    if (!quoteText.trim() && quoteMediaFiles.length === 0) return
    setIsLoading(true)
    try {
      await quotePost(quoteText, { uri: post.uri, cid: post.cid })
      setQuoteText("")
      setQuoteMediaFiles([])
      setQuoteLinkCard(null)
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

  const handleReplyClick = () => {
    if (!handleAuthRequired()) return
    setIsReplyDialogOpen(true)
  }

  const handleShare = async () => {
    const postUrl = `https://bsky.app/profile/${post.author.handle}/post/${post.uri.split('/').pop()}`
    try {
      await navigator.clipboard.writeText(postUrl)
    } catch {
      // Fallback - open in new tab
      window.open(postUrl, '_blank')
    }
  }

  const openOnBluesky = () => {
    const postUrl = `https://bsky.app/profile/${post.author.handle}/post/${post.uri.split('/').pop()}`
    window.open(postUrl, '_blank')
  }

  const handleFactCheck = async () => {
    setIsFactChecking(true)
    setIsFactCheckOpen(true)
    setFactCheckResult(null)

    try {
      const response = await fetch('/api/fact-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: post.record.text }),
      })

      if (response.ok) {
        const data = await response.json()
        setFactCheckResult(data.result)
      } else {
        setFactCheckResult("Unable to fact-check this post at the moment. Please try again later.")
      }
    } catch {
      setFactCheckResult("Unable to fact-check this post at the moment. Please try again later.")
    } finally {
      setIsFactChecking(false)
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

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(post.record.text)
    } catch {
      // Fallback - do nothing
    }
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
      alert(error instanceof Error ? error.message : "Failed to add highlight")
    } finally {
      setIsHighlighting(false)
    }
  }

  // Track view when post becomes visible (IntersectionObserver)
  useEffect(() => {
    const el = cardRef.current
    if (!el || hasTrackedView.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasTrackedView.current) {
            hasTrackedView.current = true
            // Fire and forget view tracking
            fetch('/api/views', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ postUri: post.uri, action: 'view' }),
            })
              .then(res => res.json())
              .then(data => {
                if (data.views) setViewCount(data.views)
                if (data.linkClicks) setLinkClickCount(data.linkClicks)
              })
              .catch(() => { /* silently fail */ })
            observer.disconnect()
          }
        })
      },
      { threshold: 0.5 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [post.uri])

  // Track link clicks
  const trackLinkClick = () => {
    fetch('/api/views', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postUri: post.uri, action: 'link_click' }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.linkClicks) setLinkClickCount(data.linkClicks)
      })
      .catch(() => { /* silently fail */ })
  }

  // Check if following the author (only if authenticated and not own post)
  useEffect(() => {
    if (isAuthenticated && !isOwnPost && user?.did !== post.author.did) {
      getProfile(post.author.handle).then(profile => {
        if (profile) {
          setIsFollowing(!!profile.viewer?.following)
        }
      }).catch(() => {
        // Silently fail - just don't show follow button
      })
    }
  }, [isAuthenticated, isOwnPost, post.author.handle, post.author.did, user?.did, getProfile])

  const handleFollow = async () => {
    if (!isAuthenticated) {
      login()
      return
    }
    setIsFollowLoading(true)
    try {
      await followUser(post.author.did)
      setIsFollowing(true)
    } catch (error) {
      console.error("Failed to follow:", error)
    } finally {
      setIsFollowLoading(false)
    }
  }

  // Check if this is a repost
  const isRepostReason = post.reason?.$type === 'app.bsky.feed.defs#reasonRepost'

  // ... imports remain the same ...
    return (
      <>
        <Card ref={cardRef} className="border-border hover:bg-accent/50 transition-colors rounded-none sm:rounded-lg border-x-0 sm:border-x">
          <CardHeader className="grid grid-cols-[auto_1fr_auto] gap-2 px-3 sm:px-4 pt-3 pb-2">
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

            <div className="flex min-w-0 flex-col gap-0.5">
              <div className="flex items-center gap-1.5">
              <span className="font-medium leading-tight">
                {post.author.displayName || post.author.handle}
              </span>
                <VerifiedBadge handle={post.author.handle} did={post.author.did} />
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <HandleLink handle={post.author.handle} className="truncate max-w-[140px]" />
                <Link
                  href={`/profile/${post.author.handle}/post/${post.uri.split('/').pop()}`}
                  className="whitespace-nowrap hover:underline"
                >
                  {formatDistanceToNow(new Date(post.record.createdAt), { addSuffix: true })}
                </Link>
              </div>

              {/* Repost indicator */}
              {isRepostReason && post.reason?.by && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                  <Repeat2 className="h-3.5 w-3.5" />
                  <Link href={`/profile/${post.reason.by.handle}`} className="hover:underline truncate">
                    {post.reason.by.displayName || post.reason.by.handle} reposted
                  </Link>
                </div>
              )}
            </div>

            <div className="flex items-start gap-1">
              {!isOwnPost && isFollowing === false && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2.5 text-xs"
                  onClick={handleFollow}
                  disabled={isFollowLoading}
                >
                  {isFollowLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Follow"}
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                {/* DropdownMenuContent remains the same */}
                <DropdownMenuContent align="end">
                  {/* ... your existing menu items ... */}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>

          <CardContent className="px-3 sm:px-4 pt-1 pb-2">
            <div className="min-w-0">
              <div className="leading-relaxed">
                <MarkdownRenderer content={post.record.text} />
              </div>

              {/* Images – slightly tighter */}
              {post.embed?.images && post.embed.images.length > 0 && (
                <div className={cn(
                  "mt-2 grid gap-1.5",
                  post.embed.images.length === 1 && "grid-cols-1",
                  post.embed.images.length === 2 && "grid-cols-2",
                  post.embed.images.length >= 3 && "grid-cols-2 sm:grid-cols-3"
                )}>
                  {post.embed.images.map((img, idx) => (
                    <a key={idx} href={img.fullsize} target="_blank" rel="noopener noreferrer" className="block rounded-md overflow-hidden">
                      <img
                        src={img.thumb}
                        alt={img.alt || "Image"}
                        className="w-full h-auto object-cover max-h-[420px]"
                      />
                    </a>
                  ))}
                </div>
              )}

              {/* External link card – more compact */}
              {post.embed?.$type === 'app.bsky.embed.external#view' && post.embed.external && (
                <a
                  href={(post.embed.external as any).uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block mt-2"
                  onClick={trackLinkClick}
                >
                  <Card className="overflow-hidden text-sm">
                    {(post.embed.external as any).thumb && (
                      <div className="aspect-video bg-muted relative">
                        <img src={(post.embed.external as any).thumb} alt="" className="object-cover w-full h-full" />
                      </div>
                    )}
                    <CardContent className="p-2.5">
                      <p className="font-medium line-clamp-2">{(post.embed.external as any).title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{(post.embed.external as any).description}</p>
                      <p className="text-xs text-muted-foreground/80 mt-1 truncate">{(post.embed.external as any).uri}</p>
                    </CardContent>
                  </Card>
                </a>
              )}

              {/* Quoted post – tighter */}
              {post.embed?.$type === 'app.bsky.embed.record#view' && post.embed.record && (
                <Card className="mt-2 border text-sm">
                  <CardContent className="p-2.5">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={post.embed.record.author?.avatar} />
                        <AvatarFallback className="text-xs">
                          {(post.embed.record.author?.displayName || post.embed.record.author?.handle || "??").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <span className="font-medium">{post.embed.record.author?.displayName || post.embed.record.author?.handle}</span>
                        <HandleLink handle={post.embed.record.author?.handle || ""} className="text-xs ml-1.5" />
                      </div>
                    </div>
                    <p className="text-muted-foreground line-clamp-3">{post.embed.record.value?.text}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </CardContent>

          {/* ────────────────────────────────
            MOVED INTERACTIONS → CardFooter
          ──────────────────────────────── */}
          <CardFooter className="px-2 sm:px-4 py-1 border-t bg-muted/40 flex items-center justify-between gap-1 text-muted-foreground text-xs">
            <div className="flex items-center -ml-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-9 rounded-full hover:text-sky-600"
                onClick={handleReplyClick}
              >
                <MessageCircle className="h-4 w-4" />
              </Button>
              <span className="tabular-nums min-w-[2.2ch] text-center">{formatEngagement(replyCount)}</span>

              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-9 rounded-full",
                  isReposted ? "text-green-600 hover:text-green-700" : "hover:text-green-600"
                )}
                onClick={handleRepostClick}
              >
                <Repeat2 className="h-4 w-4" />
              </Button>
              <span className="tabular-nums min-w-[2.2ch] text-center">{formatEngagement(repostCount)}</span>

              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-9 rounded-full",
                  isLiked ? "text-red-600 hover:text-red-700" : "hover:text-red-600"
                )}
                onClick={handleLike}
              >
                <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
              </Button>
              <span className="tabular-nums min-w-[2.2ch] text-center">{formatEngagement(likeCount)}</span>

              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-9 rounded-full",
                  isBookmarked ? "text-blue-600" : "hover:text-blue-600"
                )}
                onClick={handleBookmark}
                title={isBookmarked ? "Remove bookmark" : "Bookmark"}
              >
                <Bookmark className={cn("h-4 w-4", isBookmarked && "fill-current")} />
              </Button>
            </div>

            <div className="flex items-center gap-1.5">
              {viewCount > 0 && (
                <div className="flex items-center gap-1 px-2 py-1 text-muted-foreground/90">
                  <Eye className="h-3.5 w-3.5" />
                  <span className="tabular-nums">{formatEngagement(viewCount)}</span>
                </div>
              )}

              {(replyCount + repostCount + likeCount + viewCount) > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2.5 gap-1.5 text-muted-foreground hover:text-primary"
                  onClick={() => setIsAnalyticsOpen(true)}
                >
                  <BarChart3 className="h-3.5 w-3.5" />
                  <span className="tabular-nums font-medium">
                  {formatEngagement(replyCount + repostCount + likeCount)}
                </span>
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>
      </>
    )
  }
