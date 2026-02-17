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
    author?: {  // Made optional to prevent crashes
      did?: string
      handle?: string
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
        author?: {
          did?: string
          handle?: string
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
        did?: string
        handle?: string
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

  // ... all your handlers remain unchanged ...

  const isRepostReason = post.reason?.$type === 'app.bsky.feed.defs#reasonRepost'

  // Guard against missing author data (prevents crash)
  if (!post.author?.did || !post.author?.handle) {
    return (
      <div className="p-4 border border-destructive/50 rounded-md bg-destructive/5">
        <p className="text-sm text-destructive">Post author data incomplete — cannot display properly</p>
      </div>
    )
  }

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
                  {/* ... your dropdown items unchanged ... */}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        <div className="p-1 sm:p-1">
          <div className="flex gap-1 sm:gap-1">
            <div className="flex-1 min-w-0 overflow-hidden">
              <MarkdownRenderer content={post.record.text} />
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-300 rounded text-sm text-yellow-900">
                <strong>Video Detection Debug – remove later</strong><br />
                • Embed exists: {!!post.embed}<br />
                • Embed $type: {post.embed?.$type || 'missing'}<br />
                • Direct video ref: {post.embed?.video?.ref?.$link ? 'yes' : 'no'}<br />
                • Media video ref: {post.embed?.media?.video?.ref?.$link ? 'yes' : 'no'}<br />
                • Author DID: {post.author?.did || 'missing'}<br />
                <details className="mt-2">
                  <summary>Raw embed JSON (click to expand)</summary>
                  <pre className="bg-white p-2 rounded mt-1 text-xs overflow-auto max-h-60">
      {JSON.stringify(post.embed, null, 2)}
    </pre>
                </details>
              </div>
              {post.embed && (
                <>
                  {/* Images */}
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

                  {/* Direct video */}
                  {post.embed.$type === 'app.bsky.embed.video#view' && post.embed.video?.ref?.$link && post.author?.did && (
                    <div className="mt-3">
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
                      {post.embed.video.alt && <p className="text-xs text-muted-foreground mt-1">{post.embed.video.alt}</p>}
                    </div>
                  )}

                  {/* External link */}
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

                  {/* Quoted post */}
                  {post.embed.$type === 'app.bsky.embed.record#view' && post.embed.record && post.embed.record.author && (
                    <div className="mt-1 border-border">
                      <div className="p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="grid grid-cols-[auto_1fr] gap-2">
                            <div>
                              <UserHoverCard handle={post.embed.record.author.handle || ""}>
                                <Link href={`/profile/${post.embed.record.author.handle || ""}`} className="shrink-0 relative">
                                  <Avatar className="h-9 w-9 sm:h-10 sm:w-10 cursor-pointer hover:opacity-80 transition-opacity">
                                    <AvatarImage src={post.embed.record.author.avatar || "/placeholder.svg"} alt="" />
                                    <AvatarFallback className="text-sm">
                                      {(post.embed.record.author.displayName || post.embed.record.author.handle || "").slice(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <VerifiedBadge
                                    handle={post.embed.record.author.handle || ""}
                                    did={post.embed.record.author.did || ""}
                                    className="absolute left-5 top-7 rounded-full"
                                  />
                                </Link>
                              </UserHoverCard>
                            </div>
                            <div className="flex flex-col gap-0">
                              <div>
                                {post.embed.record.author.displayName}
                                <VerifiedBadge handle={post.embed.record.author.handle || ""} did={post.embed.record.author.did || ""} className="pt-1" />
                              </div>
                              <div>
                                <HandleLink handle={post.embed.record.author.handle || ""} className="text-sm truncate max-w-[120px] sm:max-w-none" />
                              </div>
                            </div>
                          </div>
                        </div>
                        <MarkdownRenderer content={post.embed.record.value?.text} />
                      </div>
                    </div>
                  )}

                  {/* Quote + media */}
                  {post.embed.$type === 'app.bsky.embed.recordWithMedia#view' && post.embed.record && post.embed.media && (
                    <>
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

                      {post.embed.media.$type === 'app.bsky.embed.video#view' && post.embed.media.video?.ref?.$link && post.author?.did && (
                        <div className="mt-3">
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
                          {post.embed.media.video.alt && <p className="text-xs text-muted-foreground mt-1">{post.embed.media.video.alt}</p>}
                        </div>
                      )}

                      {/* ... external and quoted text unchanged ... */}
                    </>
                  )}
                </>
              )}

              {/* ... engagement bar unchanged ... */}
            </div>
          </div>
        </div>
      </div>

      {/* All dialogs unchanged */}
      {/* ... paste your original dialogs here ... */}
    </>
  )
}