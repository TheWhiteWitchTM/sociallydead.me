"use client"

import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { ExternalLink } from "lucide-react"

interface BlueskyHeaderProps {
	post: any
	isOwnPost?: boolean
	isPinned?: boolean
	showReplyContext?: boolean
	// add more props if your current header uses them (onFollow, onPinToggle, etc.)
}

export function BlueskyHeader({
	                              post,
	                              isOwnPost = false,
	                              isPinned = false,
	                              showReplyContext = true,
                              }: BlueskyHeaderProps) {
	const author = post.author
	const createdAt = post.record?.createdAt ? new Date(post.record.createdAt) : new Date()
	const timeAgo = formatDistanceToNow(createdAt, { addSuffix: true })

	if (!author) return null

	return (
		<header className="flex items-start gap-3 px-4 pt-4 pb-2">
			<div className="flex-shrink-0 mt-0.5">
				{author.avatar ? (
					<Link href={`/profile/${author.handle}`}>
						<Image
							src={author.avatar}
							alt={author.displayName || author.handle}
							width={48}
							height={48}
							className="rounded-full ring-1 ring-border/50"
						/>
					</Link>
				) : (
					<div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
						?
					</div>
				)}
			</div>

			<div className="min-w-0 flex-1">
				<div className="flex items-baseline gap-2">
					<Link
						href={`/profile/${author.handle}`}
						className="font-semibold hover:underline truncate"
					>
						{author.displayName || author.handle || "Unknown"}
					</Link>
					<span className="text-sm text-muted-foreground truncate">
            @{author.handle}
          </span>
					{/* VerifiedBadge, etc. can go here if you have it */}
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

				{/* Add your reply context, pinned indicator, follow button, etc. here */}
				{showReplyContext && post.record?.reply && (
					<div className="text-xs text-muted-foreground mt-1">
						Replying to ...
					</div>
				)}
				{isPinned && (
					<div className="text-xs text-amber-600 mt-1 flex items-center gap-1">
						<Pin className="h-3 w-3" /> Pinned post
					</div>
				)}
			</div>
		</header>
	)
}