"use client"

import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import {
	MoreHorizontal, Repeat2, UserPlus, Loader2, Flag, Trash2, Pencil, Star, Pin, PinOff, Sparkles, BookmarkPlus,
	ExternalLink, Share, Copy
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
import { UserHoverCard } from "@/components/user-hover-card"
import { VerifiedBadge } from "@/components/verified-badge"
import { HandleLink } from "@/components/handle-link"
import { cn } from "@/lib/utils"

interface BlueskyHeaderProps {
	post: any
	isOwnPost: boolean
	isPinned?: boolean
	showReplyContext?: boolean
	isFollowLoading?: boolean
	onFollow?: () => void
	onBookmark?: () => void
	onCopyText?: () => void
	onShare?: () => void
	onOpenBluesky?: () => void
	onPinToggle?: () => void
	onHighlight?: () => void
	onEdit?: () => void
	onDelete?: () => void
	onReport?: () => void
	onFactCheck?: () => void
}

export function BlueskyHeader({
	                              post,
	                              isOwnPost,
	                              isPinned = false,
	                              showReplyContext = true,
	                              isFollowLoading = false,
	                              onFollow,
	                              onBookmark,
	                              onCopyText,
	                              onShare,
	                              onOpenBluesky,
	                              onPinToggle,
	                              onHighlight,
	                              onEdit,
	                              onDelete,
	                              onReport,
	                              onFactCheck,
                              }: BlueskyHeaderProps) {
	const isRepostReason = post.reason?.$type === 'app.bsky.feed.defs#reasonRepost'

	// Guard against missing data
	if (!post || !post.author || !post.record) {
		return (
			<div className="p-4 text-center text-muted-foreground">
				Loading post...
			</div>
		)
	}

	const domain = post.embed?.external?.uri ? new URL(post.embed.external.uri).hostname.replace(/^www\./, "") : null

	return (
		<div className="grid grid-cols-[auto_1fr_auto] gap-2">
			{/* Avatar */}
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

			{/* Name, handle + domain on same line, meta */}
			<div className="flex flex-col gap-0">
				<div className="flex items-center gap-1.5">
					<span className="font-medium">{post.author.displayName || post.author.handle}</span>
					<VerifiedBadge handle={post.author.handle} did={post.author.did} className="pt-1" />
				</div>

				<div className="flex items-center gap-2 text-sm text-muted-foreground">
					<HandleLink handle={post.author.handle} />
					{domain && (
						<>
							<span className="text-muted-foreground">·</span>
							<span className="truncate">{domain}</span>
						</>
					)}
				</div>

				<div className="flex flex-row gap-2 text-xs text-muted-foreground mt-0.5">
					<Link
						href={`/profile/${post.author.handle}/post/${post.uri.split('/').pop()}`}
						className="hover:underline"
					>
						{formatDistanceToNow(new Date(post.record.createdAt), { addSuffix: true })}
					</Link>

					{showReplyContext && post.record.reply && (
						<span className="text-muted-foreground">Replying to</span>
					)}

					{isRepostReason && post.reason?.by && (
						<div className="flex items-center gap-1.5">
							<Repeat2 className="h-4 w-4 shrink-0" />
							<Link href={`/profile/${post.reason.by.handle}`} className="hover:underline truncate">
								{post.reason.by.displayName || post.reason.by.handle} reposted
							</Link>
						</div>
					)}
				</div>
			</div>

			{/* Menu + Follow button */}
			<div className="flex items-start gap-1">
				{/* Follow button - only for authenticated, not own post */}
				{!isOwnPost && (
					<Button
						variant="outline"
						size="sm"
						className="h-6 px-2 text-xs"
						onClick={onFollow}
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
						{/* Always visible */}
						<DropdownMenuItem onClick={onCopyText}>
							<Copy className="mr-2 h-4 w-4" />
							Copy Text
						</DropdownMenuItem>

						<DropdownMenuItem onClick={onShare}>
							<Share className="mr-2 h-4 w-4" />
							Copy Link
						</DropdownMenuItem>

						<DropdownMenuItem onClick={onOpenBluesky}>
							<ExternalLink className="mr-2 h-4 w-4" />
							Open on Bluesky
						</DropdownMenuItem>

						{/* Authenticated-only */}
						{onFollow && (
							<DropdownMenuItem onClick={onFollow} disabled={isFollowLoading}>
								{isFollowLoading ? (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								) : (
									<UserPlus className="mr-2 h-4 w-4" />
								)}
								Follow
							</DropdownMenuItem>
						)}

						{onBookmark && (
							<DropdownMenuItem onClick={onBookmark}>
								<BookmarkPlus className="mr-2 h-4 w-4" />
								Bookmark
							</DropdownMenuItem>
						)}

						{onFactCheck && (
							<DropdownMenuItem onClick={onFactCheck}>
								<Sparkles className="mr-2 h-4 w-4" />
								AI Fact-Check
							</DropdownMenuItem>
						)}

						{isOwnPost && (
							<>
								<DropdownMenuSeparator />

								{isPinned ? (
									<DropdownMenuItem onClick={onPinToggle}>
										<PinOff className="mr-2 h-4 w-4" />
										Unpin from Profile
									</DropdownMenuItem>
								) : (
									<DropdownMenuItem onClick={onPinToggle}>
										<Pin className="mr-2 h-4 w-4" />
										Pin to Profile
									</DropdownMenuItem>
								)}

								{onHighlight && (
									<DropdownMenuItem onClick={onHighlight}>
										<Star className="mr-2 h-4 w-4 text-yellow-500" />
										Add to Highlights
									</DropdownMenuItem>
								)}

								{onEdit && (
									<DropdownMenuItem onClick={onEdit}>
										<Pencil className="mr-2 h-4 w-4" />
										Edit (Pseudo)
									</DropdownMenuItem>
								)}

								{onDelete && (
									<DropdownMenuItem className="text-destructive" onClick={onDelete}>
										<Trash2 className="mr-2 h-4 w-4" />
										Delete
									</DropdownMenuItem>
								)}
							</>
						)}

						{!isOwnPost && onReport && (
							<>
								<DropdownMenuSeparator />
								<DropdownMenuItem className="text-destructive" onClick={onReport}>
									<Flag className="mr-2 h-4 w-4" />
									Report Post
								</DropdownMenuItem>
							</>
						)}
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</div>
	)
}