"use client"

import { useState } from "react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { Heart, MessageCircle, Repeat2, MoreHorizontal, Pencil, Trash2, Quote, Flag, Share, ExternalLink, Sparkles, Loader2, BookmarkPlus, Bookmark, Copy } from "lucide-react"
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
import { MarkdownRenderer } from "@/components/markdown-renderer"
import { UserHoverCard } from "@/components/user-hover-card"
import { useBluesky } from "@/lib/bluesky-context"
import { cn } from "@/lib/utils"

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
  onPostUpdated?: () => void
  showReplyContext?: boolean
}

export function PostCard({ post, isOwnPost, onPostUpdated, showReplyContext = true }: PostCardProps) {
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
    isAuthenticated,
    login,
  } = useBluesky()
  
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
  const [reportReason, setReportReason] = useState("spam")
  const [reportDetails, setReportDetails] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isFactCheckOpen, setIsFactCheckOpen] = useState(false)
  const [factCheckResult, setFactCheckResult] = useState<string | null>(null)
  const [isFactChecking, setIsFactChecking] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)

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
        await likePost(post.uri, post.cid)
        setIsLiked(true)
        setLikeCount((c) => c + 1)
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
        await repost(post.uri, post.cid)
        setIsReposted(true)
        setRepostCount((c) => c + 1)
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
    if (!replyText.trim()) return
    setIsLoading(true)
    try {
      await createPost(replyText, { reply: { uri: post.uri, cid: post.cid } })
      setReplyText("")
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

  const handleBookmark = () => {
    // Store in localStorage for bookmarks
    const bookmarks = JSON.parse(localStorage.getItem('bookmarked_posts') || '[]')
    if (isBookmarked) {
      const filtered = bookmarks.filter((b: string) => b !== post.uri)
      localStorage.setItem('bookmarked_posts', JSON.stringify(filtered))
      setIsBookmarked(false)
    } else {
      bookmarks.push(post.uri)
      localStorage.setItem('bookmarked_posts', JSON.stringify(bookmarks))
      setIsBookmarked(true)
    }
  }

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(post.record.text)
    } catch {
      // Fallback - do nothing
    }
  }

  // Check if bookmarked on mount
  useState(() => {
    const bookmarks = JSON.parse(localStorage.getItem('bookmarked_posts') || '[]')
    setIsBookmarked(bookmarks.includes(post.uri))
  })

  // Check if this is a repost
  const isRepostReason = post.reason?.$type === 'app.bsky.feed.defs#reasonRepost'

  return (
    <>
      <Card className="border-border hover:bg-accent/50 transition-colors">
        <CardContent className="p-3 sm:p-4">
          {/* Repost indicator */}
          {isRepostReason && post.reason?.by && (
            <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
              <Repeat2 className="h-4 w-4 shrink-0" />
              <Link href={`/profile/${post.reason.by.handle}`} className="hover:underline truncate">
                {post.reason.by.displayName || post.reason.by.handle} reposted
              </Link>
            </div>
          )}

          <div className="flex gap-2 sm:gap-3">
            <UserHoverCard handle={post.author.handle}>
              <Link href={`/profile/${post.author.handle}`} className="shrink-0">
                <Avatar className="h-9 w-9 sm:h-10 sm:w-10 cursor-pointer hover:opacity-80 transition-opacity">
                  <AvatarImage src={post.author.avatar || "/placeholder.svg"} alt={post.author.displayName || post.author.handle} />
                  <AvatarFallback className="text-sm">
                    {(post.author.displayName || post.author.handle).slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Link>
            </UserHoverCard>
            
            <div className="flex-1 min-w-0 overflow-hidden">
              <div className="flex items-start justify-between gap-1">
                <div className="flex flex-wrap items-center gap-x-1 min-w-0 leading-tight">
                  <UserHoverCard handle={post.author.handle}>
                    <Link href={`/profile/${post.author.handle}`} className="font-semibold hover:underline break-all">
                      {post.author.displayName || post.author.handle}
                    </Link>
                  </UserHoverCard>
                  <span className="text-muted-foreground text-sm truncate max-w-[120px] sm:max-w-none">
                    @{post.author.handle}
                  </span>
                  <span className="text-muted-foreground hidden sm:inline">·</span>
                  <Link 
                    href={`/post/${post.author.handle}/${post.uri.split('/').pop()}`}
                    className="text-muted-foreground text-xs sm:text-sm whitespace-nowrap hover:underline"
                  >
                    {formatDistanceToNow(new Date(post.record.createdAt), { addSuffix: true })}
                  </Link>
                </div>
                
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
                    <DropdownMenuItem onClick={handleBookmark}>
                      {isBookmarked ? (
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

              {/* Reply context */}
              {showReplyContext && post.record.reply && (
                <div className="text-sm text-muted-foreground mb-1">
                  Replying to a thread
                </div>
              )}
              
              <div className="mt-2">
                <MarkdownRenderer content={post.record.text} />
              </div>

              {/* Embedded Images */}
              {post.embed?.images && post.embed.images.length > 0 && (
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
                        src={img.thumb} 
                        alt={img.alt || "Image"} 
                        className="w-full h-auto max-h-80 object-cover rounded-lg"
                      />
                    </a>
                  ))}
                </div>
              )}

              {/* Quoted Post */}
              {post.embed?.$type === 'app.bsky.embed.record#view' && post.embed.record && (
                <Card className="mt-3 border-border">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={post.embed.record.author.avatar || "/placeholder.svg"} />
                        <AvatarFallback className="text-xs">
                          {(post.embed.record.author.displayName || post.embed.record.author.handle).slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-sm">
                        {post.embed.record.author.displayName || post.embed.record.author.handle}
                      </span>
                      <span className="text-muted-foreground text-sm">
                        @{post.embed.record.author.handle}
                      </span>
                    </div>
                    <p className="text-sm">{post.embed.record.value.text}</p>
                  </CardContent>
                </Card>
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
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reply Dialog */}
      <Dialog open={isReplyDialogOpen} onOpenChange={setIsReplyDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Reply to Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Original post preview */}
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={post.author.avatar || "/placeholder.svg"} />
                  <AvatarFallback className="text-xs">
                    {(post.author.displayName || post.author.handle).slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium text-sm">{post.author.displayName || post.author.handle}</span>
                <span className="text-muted-foreground text-sm">@{post.author.handle}</span>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-3">{post.record.text}</p>
            </div>
            
            <Textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="min-h-32"
              placeholder="Write your reply..."
              maxLength={300}
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">
                {replyText.length}/300
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReplyDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleReply} disabled={isLoading || !replyText.trim()}>
              {isLoading ? "Posting..." : "Reply"}
            </Button>
          </DialogFooter>
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
      <Dialog open={isQuoteDialogOpen} onOpenChange={setIsQuoteDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Quote Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={quoteText}
              onChange={(e) => setQuoteText(e.target.value)}
              className="min-h-24"
              placeholder="Add your thoughts..."
              maxLength={300}
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">
                {quoteText.length}/300
              </span>
            </div>
            
            {/* Quoted post preview */}
            <Card className="border-border">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={post.author.avatar || "/placeholder.svg"} />
                    <AvatarFallback className="text-xs">
                      {(post.author.displayName || post.author.handle).slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-sm">{post.author.displayName || post.author.handle}</span>
                  <span className="text-muted-foreground text-sm">@{post.author.handle}</span>
                </div>
                <p className="text-sm line-clamp-3">{post.record.text}</p>
              </CardContent>
            </Card>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsQuoteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleQuote} disabled={isLoading || !quoteText.trim()}>
              {isLoading ? "Posting..." : "Quote"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report Dialog */}
      <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Report Post</DialogTitle>
            <DialogDescription>
              Help us understand what&apos;s wrong with this post.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <RadioGroup value={reportReason} onValueChange={setReportReason}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="spam" id="spam" />
                <Label htmlFor="spam">Spam or misleading</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="abuse" id="abuse" />
                <Label htmlFor="abuse">Harassment or abuse</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="hate" id="hate" />
                <Label htmlFor="hate">Hate speech</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="violence" id="violence" />
                <Label htmlFor="violence">Violence or threats</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="other" id="other" />
                <Label htmlFor="other">Other</Label>
              </div>
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
            <DialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
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

      {/* AI Fact-Check Dialog */}
      <Dialog open={isFactCheckOpen} onOpenChange={setIsFactCheckOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Fact-Check
            </DialogTitle>
            <DialogDescription>
              AI-powered analysis of the claims in this post
            </DialogDescription>
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
    </>
  )
}
