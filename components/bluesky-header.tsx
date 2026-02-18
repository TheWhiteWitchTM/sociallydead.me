"use client"

import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import {
	MoreHorizontal,
	Pencil,
	Trash2,
	Flag,
	Share,
	ExternalLink,
	Sparkles,
	Bookmark,
	Copy,
	Pin,
	PinOff,
	Star,
	UserPlus,
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

import { cn } from "@/lib/utils"
import { UserHoverCard } from "@/components/user-hover-card"
import { VerifiedBadge } from "@/components/verified-badge"
import { HandleLink } from "@/components/handle-link"

interface BlueskyHeaderProps {
	post: any
	isOwnPost?: boolean
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
	currentDepth?: number
}

export function BlueskyHeader({
	                              post,
	                              isOwnPost = false,
	                              isPinned = false,
	                              showReplyContext = true,
	                              isFollowLoading = false,
	                              onFollow = () => {},
	                              onBookmark = () => {},
	                              onCopyText = () => {},
	                              onShare = () => {},
	                              onOpenBluesky = () => {},
	                              onPinToggle = () => {},
	                              onHighlight = () => {},
	                              onEdit = () => {},
	                              onDelete = () => {},
	                              onReport = () => {},
	                              onFactCheck = () => {},
	                              currentDepth = 0,
                              }: BlueskyHeaderProps) {
	const author = post.author
	const createdAt = post.record?.createdAt ? new Date(post.record.createdAt) : new Date()
	const timeAgo = formatDistanceToNow(createdAt, { addSuffix: true })

	const hasWebsite = author?.domain || author?.links?.website // adjust based on your author shape

	const avatarSize = currentDepth > 0 ? 36 : 48
	const textSize = currentDepth > 0 ? "text-sm" : "text-base"

	if (!author) return null

	return (
		<header className={cn("flex items-start gap-3 px-4 pt-4 pb-2", currentDepth > 0 && "pt-3 pb-1")}>
			<UserHoverCard handle={author.handle}>
				<Avatar className={cn(`h-${avatarSize/4} w-${avatarSize/4}`)}>
					<AvatarImage src={author.avatar} alt={author.displayName || author.handle} />
					<AvatarFallback>{(author.displayName || author.handle).slice(0, 2).toUpperCase()}</AvatarFallback>
				</Avatar>
			</UserHoverCard>

			<div className="min-w-0 flex-1">
				<div className="flex items-center gap-2">
					<Link
						href={`/profile/${author.handle}`}
						className={cn("font-semibold hover:underline truncate", textSize)}
					>
						{author.displayName || author.handle || "Unknown"}
					</Link>
					{author.verified && <VerifiedBadge />}
					<HandleLink handle={author.handle} className={cn("text-muted-foreground truncate", textSize)} />
				</div>

				<div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
					{timeAgo}
					{post.uri && (
						<Link
							href={`/profile/${author.handle}/post/${post.uri.split("/").pop()}`}
							className="hover:text-foreground ml-1"
						>
							<ExternalLink className="h-3.5 w-3.5" />
						</Link>
					)}
				</div>

				{showReplyContext && post.record?.reply && (
					<div className="text-xs text-muted-foreground mt-1">
						Replying to @{post.record.reply.handle}
					</div>
				)}

				{hasWebsite && (
					<Button variant="ghost" size="sm" onClick={() => window.open(hasWebsite, "_blank")} className="mt-1 p-0 text-blue-500 hover:text-blue-600">
						<ExternalLink className="h-4 w-4 mr-1" />
						Visit website
					</Button>
				)}

				{isPinned && (
					<div className="text-xs text-amber-600 mt-1 flex items-center gap-1">
						<Pin className="h-3 w-3" />
						Pinned post
					</div>
				)}
			</div>

			{/* Follow button */}
			<Button
				variant="outline"
				size="sm"
				onClick={onFollow}
				disabled={isFollowLoading}
				className="mt-1"
			>
				{isFollowLoading ? "Following..." : "Follow"}
			</Button>

			{/* Dropdown menu with all options */}
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="ghost" size="icon" className="mt-1">
						<MoreHorizontal className="h-4 w-4" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					{isOwnPost && (
						<>
							<DropdownMenuItem onClick={onEdit}>
								<Pencil className="h-4 w-4 mr-2" />
								Edit post
							</DropdownMenuItem>
							<DropdownMenuItem onClick={onDelete} className="text-destructive">
								<Trash2 className="h-4 w-4 mr-2" />
								Delete post
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem onClick={onPinToggle}>
								{isPinned ? (
									<>
										<PinOff className="h-4 w-4 mr-2" />
										Unpin post
									</>
								) : (
									<>
										<Pin className="h-4 w-4 mr-2" />
										Pin post
									</>
								)}
							</DropdownMenuItem>
						</>
					)}
					<DropdownMenuItem onClick={onHighlight}>
						<Star className="h-4 w-4 mr-2" />
						Highlight
					</DropdownMenuItem>
					<DropdownMenuItem onClick={onBookmark}>
						<Bookmark className="h-4 w-4 mr-2" />
						Bookmark
					</DropdownMenuItem>
					<DropdownMenuItem onClick={onCopyText}>
						<Copy className="h-4 w-4 mr-2" />
						Copy text
					</DropdownMenuItem>
					<DropdownMenuItem onClick={onShare}>
						<Share className="h-4 w-4 mr-2" />
						Share
					</DropdownMenuItem>
					<DropdownMenuItem onClick={onOpenBluesky}>
						<ExternalLink className="h-4 w-4 mr-2" />
						Open on Bluesky
					</DropdownMenuItem>
					<DropdownMenuSeparator />
					<DropdownMenuItem onClick={onReport} className="text-destructive">
						<Flag className="h-4 w-4 mr-2" />
						Report post
					</DropdownMenuItem>
					<DropdownMenuItem onClick={onFactCheck}>
						<Sparkles className="h-4 w-4 mr-2" />
						Fact-check
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</header>
	)
}