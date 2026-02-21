// components/bluesky-embed-header.tsx
"use client"

import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { VerifiedBadge } from "@/components/verified-badge"
import { HandleLink } from "@/components/handle-link"
import { cn } from "@/lib/utils"

interface BlueskyEmbedHeaderProps {
	post: any
}

export function BlueskyEmbedHeader({ post }: BlueskyEmbedHeaderProps) {
	// Guard against missing/incomplete post data
	if (!post || !post.author) {
		return (
			<div className="flex items-center gap-2 p-2 text-sm text-muted-foreground">
				<Avatar className="h-6 w-6">
					<AvatarFallback>?</AvatarFallback>
				</Avatar>
				<span>Post author not available</span>
			</div>
		)
	}

	const author = post.author
	const displayName = author.displayName || author.handle || "Unknown"

	return (
		<div className="flex items-center gap-2">
			{/* Avatar with verified badge overlay */}
			<div className="relative shrink-0">
				<Link href={`/profile/${author.handle}`}>
					<Avatar className="h-6 w-6 sm:h-7 sm:w-7">
						<AvatarImage src={author.avatar || "/placeholder.svg"} alt={displayName} />
						<AvatarFallback className="text-xs">
							{displayName.slice(0, 2).toUpperCase()}
						</AvatarFallback>
					</Avatar>
				</Link>
				<VerifiedBadge
					handle={author.handle}
					did={author.did}
					className="absolute -right-1 -bottom-1 scale-75 origin-bottom-right bg-background rounded-full border border-background"
				/>
			</div>

			{/* Name + handle */}
			<div className="flex flex-col min-w-0">
        <span className="font-medium text-sm truncate leading-tight">
          {displayName}
        </span>
				<HandleLink handle={author.handle} className="text-xs text-muted-foreground truncate" />
			</div>
		</div>
	)
}