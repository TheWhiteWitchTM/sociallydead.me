"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { Heart, MessageCircle, Repeat2, MoreHorizontal, Pencil, Trash2, Quote, Flag, Share, ExternalLink, Sparkles, Loader2, BookmarkPlus, Bookmark, Copy, Pin, PinOff, Star, UserPlus, BarChart3, Eye, MousePointerClick } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
      video?: {
        ref: { $link: string }
        mimeType: string
        alt?: string
      }
      external?: {
        uri: string
        title?: string
        description?: string
        thumb?: string
      }
      media?: {
        $type: string
        images?: Array<{
          thumb: string
          fullsize: string
          alt: string
        }>
        video?: {
          ref: { $link: string }
          mimeType: string
          alt?: string
        }
        external?: {
          uri: string
          title?: string
          description?: string
          thumb?: string
        }
      }
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

export function PostCard({post, isOwnPost, isPinned, onPostUpdated, showReplyContext = true }: PostCardProps) {
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
    // NEW: use the blob helpers
    getImageUrl,
    getVideoSourceUrl,
  } = useBluesky()

  const isBookmarked = checkIsBookmarked(post.uri)
  const [isLiked, setIsLiked] = useState(!!post.viewer?.like)
  const [isReposted, setIsReposted] = useState(!!post.viewer?.repost)
  const [likeCount, setLikeCount] = useState(post.likeCount)
  const [repostCount, setRepostCount] = useState(post.repostCount)
  const [replyCount, setReplyCount] = useState(post.replyCount)
  const [likeUri, setLikeUri] = useState(post.viewer?.like)
  const [repostUri, setRepostUri] = useState(post.viewer?.repost)

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isReplyDialogOpen, setIsReplyDialogOpen] = useState(false)
  const [isQuoteDialogOpen, setIsQuoteDialogOpen] = useState(false)
  const [isRepostDialogOpen, setIsRepostDialogOpen] = useState(false)
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false)

  const [editText, setEditText] = useState(post.record.text)
  const [replyText, setReplyText] = useState("")
  const [quoteText, setQuoteText] = useState("")

  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false)

  const [replyMediaFiles, setReplyMediaFiles] = useState<MediaFile[]>([])
  const [replyLinkCard, setReplyLinkCard] = useState<LinkCardData | null>(null)

  const [quoteMediaFiles, setQuoteMediaFiles] = useState<MediaFile[]>([])
  const [quoteLinkCard, setQuoteLinkCard] = useState<LinkCardData | null>(null)

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
    } catch {}
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

  useEffect(() => {
    const el = cardRef.current
    if (!el || hasTrackedView.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasTrackedView.current) {
            hasTrackedView.current = true
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
              .catch(() => {})
            observer.disconnect()
          }
        })
      },
      { threshold: 0.5 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [post.uri])

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
      .catch(() => {})
  }

  useEffect(() => {
    if (isAuthenticated && !isOwnPost && user?.did !== post.author.did) {
      getProfile(post.author.handle).then(profile => {
        if (profile) {
          setIsFollowing(!!profile.viewer?.following)
        }
      }).catch(() => {})
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

  const isRepostReason = post.reason?.$type === 'app.bsky.feed.defs#reasonRepost'

  return (
    <>
      <div ref={cardRef} className="hover:bg-accent/50 transition-colors border-b-2 border-b-red-600">
        <div className="grid grid-cols-[auto_1fr_auto] gap-2">
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

          <div className="flex flex-col gap-0">
            <div>
              {post.author.displayName}
              <VerifiedBadge handle={post.author.handle} did={post.author.did} className="pt-1" />
            </div>
            <div>
              <HandleLink handle={post.author.handle} className="text-sm truncate max-w-[120px] sm:max-w-none" />
            </div>
            <div className="flex flex-row gap-2">
              <Link
                href={`/profile/${post.author.handle}/post/${post.uri.split('/').pop()}`}
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

          <div className="flex flex-row gap-1">
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
            <div className="flex items-start justify-between gap-1">
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
                      <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)} className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </>
                  )}
                  {!isOwnPost && isAuthenticated && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setIsReportDialogOpen(true)} className="text-destructive">
                        <Flag className="mr-2 h-4 w-4" />
                        Report Post
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        <div className="p-1 sm:p-1">
          <div className="flex gap-1 sm:gap-1">
            <div className="flex-1 min-w-0 overflow-hidden">
              <MarkdownRenderer content={post.record.text} />

              {post.embed && (
                <>
                  {/* Images – use getImageUrl for safety (though your thumbs/fullsize likely already work) */}
                  {post.embed.images && post.embed.images.length > 0 && (
                    <div className={cn(
                      "mt-3 grid gap-2",
                      post.embed.images.length === 1 && "grid-cols-1",
                      post.embed.images.length === 2 && "grid-cols-2",
                      post.embed.images.length >= 3 && "grid-cols-2"
                    )}>
                      {post.embed.images.map((img, idx) => (
                        <a
                          key={idx}
                          href={img.fullsize}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="relative rounded-lg overflow-hidden"
                        >
                          <img
                            src={getImageUrl(img.thumb, post.author.did)}
                            alt={img.alt || "Image"}
                            className="w-full h-auto max-h-80 object-cover rounded-lg"
                            loading="lazy"
                          />
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Direct video embed */}
                  {post.embed.$type === 'app.bsky.embed.video#view' && post.embed.video?.ref?.$link && (
                    <div className="mt-3">
                      VIDEO!
                      <video
                        controls
                        className="w-full rounded-lg"
                        preload="metadata"
                        crossOrigin="anonymous"
                        onError={(e) => console.error("Direct video failed:", e)}
                      >
                        <source
                          src={getVideoSourceUrl(post.embed.video, post.author.did)}
                          type={post.embed.video.mimeType || "video/mp4"}
                        />
                        Your browser does not support the video tag.
                      </video>
                      {post.embed.video.alt && (
                        <p className="text-xs text-muted-foreground mt-1">{post.embed.video.alt}</p>
                      )}
                    </div>
                  )}

                  {/* External link card */}
                  {post.embed.$type === 'app.bsky.embed.external#view' && post.embed.external && (
                    <a
                      href={post.embed.external.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block mt-3"
                      onClick={trackLinkClick}
                    >
                      <div className="overflow-hidden hover:bg-accent/50 transition-colors">
                        {post.embed.external.thumb && (
                          <div className="aspect-video relative">
                            <img
                              src={getImageUrl(post.embed.external.thumb, post.author.did)}
                              alt=""
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>
                        )}
                        <div className="p-1">
                          <p className="font-medium line-clamp-2">{post.embed.external.title}</p>
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{post.embed.external.description}</p>
                          <p className="text-xs text-muted-foreground mt-2 truncate">{post.embed.external.uri}</p>
                        </div>
                      </div>
                    </a>
                  )}

                  {/* Simple quoted post (no media) */}
                  {post.embed.$type === 'app.bsky.embed.record#view' && post.embed.record && post.embed.record.author && (
                    <div className="mt-1 border-border">
                      <div className="p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="grid grid-cols-[auto_1fr] gap-2">
                            <div>
                              <UserHoverCard handle={post.embed.record.author.handle}>
                                <Link href={`/profile/${post.embed.record.author.handle}`} className="shrink-0 relative">
                                  <Avatar className="h-9 w-9 sm:h-10 sm:w-10 cursor-pointer hover:opacity-80 transition-opacity">
                                    <AvatarImage src={post.embed.record.author.avatar || "/placeholder.svg"} alt="" />
                                    <AvatarFallback className="text-sm">
                                      {(post.embed.record.author.displayName || post.embed.record.author.handle).slice(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <VerifiedBadge
                                    handle={post.embed.record.author.handle}
                                    did={post.embed.record.author.did}
                                    className="absolute left-5 top-7 rounded-full"
                                  />
                                </Link>
                              </UserHoverCard>
                            </div>
                            <div className="flex flex-col gap-0">
                              <div>
                                {post.embed.record.author.displayName}
                                <VerifiedBadge handle={post.embed.record.author.handle} did={post.embed.record.author.did} className="pt-1" />
                              </div>
                              <div>
                                <HandleLink handle={post.embed.record.author.handle} className="text-sm truncate max-w-[120px] sm:max-w-none" />
                              </div>
                            </div>
                          </div>
                        </div>
                        <MarkdownRenderer content={post.embed.record.value?.text} />
                      </div>
                    </div>
                  )}

                  {/* Quote + attached media (quote + image/video/external) */}
                  {post.embed.$type === 'app.bsky.embed.recordWithMedia#view' && post.embed.record && post.embed.media && (
                    <>
                      {/* Attached images */}
                      {post.embed.media.images && post.embed.media.images.length > 0 && (
                        <div className={cn(
                          "mt-3 grid gap-2",
                          post.embed.media.images.length === 1 && "grid-cols-1",
                          post.embed.media.images.length === 2 && "grid-cols-2",
                          post.embed.media.images.length >= 3 && "grid-cols-2"
                        )}>
                          {post.embed.media.images.map((img, idx) => (
                            <a
                              key={idx}
                              href={img.fullsize}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="relative rounded-lg overflow-hidden"
                            >
                              <img
                                src={getImageUrl(img.thumb, post.author.did)}
                                alt={img.alt || "Attached image"}
                                className="w-full h-auto max-h-80 object-cover rounded-lg"
                                loading="lazy"
                              />
                            </a>
                          ))}
                        </div>
                      )}

                      {/* Attached video */}
                      {post.embed.media.$type === 'app.bsky.embed.video#view' && post.embed.media.video?.ref?.$link && (
                        <div className="mt-3">
                          VIDEO
                          <video
                            controls
                            className="w-full rounded-lg"
                            preload="metadata"
                            crossOrigin="anonymous"
                            onError={(e) => console.error("Quoted video failed:", e)}
                          >
                            <source
                              src={getVideoSourceUrl(post.embed.media.video, post.author.did)}
                              type={post.embed.media.video.mimeType || "video/mp4"}
                            />
                            Your browser does not support the video tag.
                          </video>
                          {post.embed.media.video.alt && (
                            <p className="text-xs text-muted-foreground mt-1">{post.embed.media.video.alt}</p>
                          )}
                        </div>
                      )}

                      {/* Attached external */}
                      {post.embed.media.$type === 'app.bsky.embed.external#view' && post.embed.media.external && (
                        <a
                          href={post.embed.media.external.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block mt-3"
                          onClick={trackLinkClick}
                        >
                          <div className="overflow-hidden hover:bg-accent/50 transition-colors">
                            {post.embed.media.external.thumb && (
                              <div className="aspect-video relative">
                                <img
                                  src={getImageUrl(post.embed.media.external.thumb, post.author.did)}
                                  alt=""
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                />
                              </div>
                            )}
                            <div className="p-1">
                              <p className="font-medium line-clamp-2">{post.embed.media.external.title}</p>
                              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{post.embed.media.external.description}</p>
                              <p className="text-xs text-muted-foreground mt-2 truncate">{post.embed.media.external.uri}</p>
                            </div>
                          </div>
                        </a>
                      )}

                      {/* Quoted text */}
                      <div className="mt-3 border-border">
                        <div className="p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="grid grid-cols-[auto_1fr] gap-2">
                              <div>
                                <UserHoverCard handle={post.embed.record.author.handle}>
                                  <Link href={`/profile/${post.embed.record.author.handle}`} className="shrink-0 relative">
                                    <Avatar className="h-9 w-9 sm:h-10 sm:w-10 cursor-pointer hover:opacity-80 transition-opacity">
                                      <AvatarImage src={post.embed.record.author.avatar || "/placeholder.svg"} alt="" />
                                      <AvatarFallback className="text-sm">
                                        {(post.embed.record.author.displayName || post.embed.record.author.handle).slice(0, 2).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <VerifiedBadge
                                      handle={post.embed.record.author.handle}
                                      did={post.embed.record.author.did}
                                      className="absolute left-5 top-7 rounded-full"
                                    />
                                  </Link>
                                </UserHoverCard>
                              </div>
                              <div className="flex flex-col gap-0">
                                <div>
                                  {post.embed.record.author.displayName}
                                  <VerifiedBadge handle={post.embed.record.author.handle} did={post.embed.record.author.did} className="pt-1" />
                                </div>
                                <div>
                                  <HandleLink handle={post.embed.record.author.handle} className="text-sm truncate max-w-[120px] sm:max-w-none" />
                                </div>
                              </div>
                            </div>
                          </div>
                          <MarkdownRenderer content={post.embed.record.value?.text} />
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}

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
                  <span className="flex items-center gap-1 h-8 px-2 text-muted-foreground ml-auto" title={`${viewCount} views`}>
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
      </div>

      {/* Reply Dialog */}
      <Dialog open={isReplyDialogOpen} onOpenChange={(open) => {
        setIsReplyDialogOpen(open)
        if (!open) {
          setReplyMediaFiles([])
          setReplyLinkCard(null)
        }
      }}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Reply to Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <div className="relative flex flex-row">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={post.author.avatar || "/placeholder.svg"} />
                    <AvatarFallback className="text-xs">
                      {(post.author.displayName || post.author.handle).slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                    <VerifiedBadge
                      handle={post.author.handle}
                      did={post.author.did}
                      className="absolute -right-1 -bottom-1 scale-50 origin-bottom-right bg-background rounded-full"
                    />
                  </Avatar>
                </div>
                <span className="font-medium text-sm">{post.author.displayName || post.author.handle}</span>
                <HandleLink handle={post.author.handle} className="text-sm" />
              </div>
              <p className="text-sm text-muted-foreground line-clamp-3">{post.record.text}</p>
            </div>

            <ComposeInput
              postType={"reply"}
              text={replyText}
              onTextChange={setReplyText}
              mediaFiles={replyMediaFiles}
              onMediaFilesChange={setReplyMediaFiles}
              linkCard={replyLinkCard}
              onLinkCardChange={setReplyLinkCard}
              placeholder="Write your reply..."
              minHeight="min-h-24"
              onCancel={() =>setIsReplyDialogOpen(false)}
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
            <Button
              variant="outline"
              className="justify-start h-12"
              onClick={handleRepost}
            >
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
          setQuoteMediaFiles([])
          setQuoteLinkCard(null)
        }
      }}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Quote Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <ComposeInput
              postType={"quote"}
              text={quoteText}
              onTextChange={setQuoteText}
              mediaFiles={quoteMediaFiles}
              onMediaFilesChange={setQuoteMediaFiles}
              linkCard={quoteLinkCard}
              onLinkCardChange={setQuoteLinkCard}
              placeholder="Add your thoughts..."
              minHeight="min-h-24"
              onCancel={() => setIsQuoteDialogOpen(false)}
              onSubmit={handleQuote}
              compact
              autoFocus
            />

            <Card className="border-border">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="relative">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={post.author.avatar || "/placeholder.svg"} />
                      <AvatarFallback className="text-xs">
                        {(post.author.displayName || post.author.handle).slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <VerifiedBadge
                      handle={post.author.handle}
                      did={post.author.did}
                      className="absolute -right-1 -bottom-1 scale-50 origin-bottom-right bg-background rounded-full"
                    />
                  </div>
                  <span className="font-medium text-sm">{post.author.displayName || post.author.handle}</span>
                  <HandleLink handle={post.author.handle} className="text-sm" />
                </div>
                <div className="bg-yellow-100 p-2 text-sm text-yellow-800">
                  <strong>Embed debug:</strong><br />
                  embed exists? {!!post.embed}<br />
                  $type: {post.embed?.$type || '—'}<br />
                  has video? {!!post.embed?.video}<br />
                  has media video? {!!post.embed?.media?.video}<br />
                  raw embed: <pre>{JSON.stringify(post.embed, null, 2)}</pre>
                </div>
                <div className="bg-yellow-100 p-2 text-sm text-yellow-800">
                  <strong>Embed debug:</strong><br />
                  embed exists? {!!post.embed}<br />
                  $type: {post.embed?.$type || '—'}<br />
                  has video? {!!post.embed?.video}<br />
                  has media video? {!!post.embed?.media?.video}<br />
                  raw embed: <pre>{JSON.stringify(post.embed, null, 2)}</pre>
                </div>
                <MarkdownRenderer content={post.record.text}/>
              </CardContent>
            </Card>
          </div>
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
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-sky-500/10">
                    <Eye className="h-4 w-4 text-sky-500" />
                  </div>
                  <div>
                    <span className="text-sm font-medium">Views</span>
                    <p className="text-xs text-muted-foreground">SociallyDead only</p>
                  </div>
                </div>
                <span className="text-lg font-bold tabular-nums">{viewCount.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-amber-500/10">
                    <MousePointerClick className="h-4 w-4 text-amber-500" />
                  </div>
                  <div>
                    <span className="text-sm font-medium">Link Clicks</span>
                    <p className="text-xs text-muted-foreground">SociallyDead only</p>
                  </div>
                </div>
                <span className="text-lg font-bold tabular-nums">{linkClickCount.toLocaleString()}</span>
              </div>
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
                <span className="text-lg font-bold tabular-nums">{(replyCount + repostCount + likeCount).toLocaleString()}</span>
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
                      title={`Replies: ${((replyCount / (replyCount + repostCount + likeCount)) * 100).toFixed(1)}%`}
                    />
                  )}
                  {repostCount > 0 && (
                    <div
                      className="h-full bg-green-500 transition-all"
                      style={{ width: `${(repostCount / (replyCount + repostCount + likeCount)) * 100}%` }}
                      title={`Reposts: ${((repostCount / (replyCount + repostCount + likeCount)) * 100).toFixed(1)}%`}
                    />
                  )}
                  {likeCount > 0 && (
                    <div
                      className="h-full bg-red-500 transition-all"
                      style={{ width: `${(likeCount / (replyCount + repostCount + likeCount)) * 100}%` }}
                      title={`Likes: ${((likeCount / (replyCount + repostCount + likeCount)) * 100).toFixed(1)}%`}
                    />
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

      {/* Report, Edit, Delete, Fact-Check dialogs – unchanged, omitted here for brevity */}
      {/* ... paste your original dialogs here if needed ... */}

    </>
  )
}