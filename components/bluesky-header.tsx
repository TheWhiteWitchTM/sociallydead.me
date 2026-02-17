"use client"

import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import {MoreHorizontal, Repeat2, UserPlus, Loader2, BookmarkPlus, Copy, Sparkles, ExternalLink, Share, PinOff, Pin, Star, Pencil, Trash2, Flag} from "lucide-react"
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
import { useBluesky } from "@/lib/bluesky-context"
import { cn } from "@/lib/utils"

interface BlueskyHeaderProps {
	post: any
	isOwnPost: boolean
	isPinned?: boolean
	showReplyContext?: boolean
	onFactCheck: () => void
	onBookmark: () => void
	onCopyText: () => void
	onShare: () => void
	onOpenBluesky: () => void
	onPinToggle: () => void
	onHighlight: () => void
	onEdit: () => void
	onDelete: () => void
	onReport: () => void
	onFollow: () => void
	isFollowLoading: boolean
}

export function BlueskyHeader({
	                              post,
	                              isOwnPost,
	                              isPinned = false,
	                              showReplyContext = true,
	                              onFactCheck,
	                              onBookmark,
	                              onCopyText,
	                              onShare,
	                              onOpenBluesky,
	                              onPinToggle,
	                              onHighlight,
	                              onEdit,
	                              onDelete,
	                              onReport,
	                              onFollow,
	                              isFollowLoading,
                              }: BlueskyHeaderProps) {
	const { isAuthenticated } = useBluesky()
	const isRepostReason = post.reason?.$type === 'app.bsky.feed.defs#reasonRepost'

	return (
		<div className="grid grid-cols-[auto_1fr_auto] gap-2">
			{/* Avatar */}
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

			{/* Name, handle, meta */}
			<div className="flex flex-col gap-0">
				<div className="flex items-center gap-1.5">
					<span className="font-medium">{post.author?.displayName || post.author?.handle}</span>
					<VerifiedBadge handle={post.author?.handle} did={post.author?.did} className="pt-1" />
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
						<span className="text-muted-foreground">Replying to</span>
					)}

					{isRepostReason && post.reason?.by && (
						<div className="flex items-center gap-1.5">
							<Repeat2 className="h-4 w-4 shrink-0" />
							<Link href={`/profile/${post.reason.by?.handle}`} className="hover:underline truncate">
								{post.reason.by?.displayName || post.reason.by?.handle} reposted
							</Link>
						</div>
					)}
				</div>
			</div>

			{/* Menu */}
			<div className="flex items-start gap-1">
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
						<DropdownMenuItem onClick={onFactCheck}>
							<Sparkles className="mr-2 h-4 w-4" />
							AI Fact-Check
						</DropdownMenuItem>

						<DropdownMenuItem onClick={onBookmark}>
							<BookmarkPlus className="mr-2 h-4 w-4" />
							Bookmark
						</DropdownMenuItem>

						<DropdownMenuSeparator />

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

								<DropdownMenuItem onClick={onHighlight}>
									<Star className="mr-2 h-4 w-4 text-yellow-500" />
									Add to Highlights
								</DropdownMenuItem>

								<DropdownMenuItem onClick={onEdit}>
									<Pencil className="mr-2 h-4 w-4" />
									Edit
								</DropdownMenuItem>

								<DropdownMenuItem className="text-destructive" onClick={onDelete}>
									<Trash2 className="mr-2 h-4 w-4" />
									Delete
								</DropdownMenuItem>
							</>
						)}

						{!isOwnPost && (
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