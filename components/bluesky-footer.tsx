"use client"

import { MessageCircle, Repeat2, Heart, Bookmark, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useBluesky } from "@/lib/bluesky-context"
import { cn } from "@/lib/utils"

function formatEngagement(count: number): string {
	if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
	if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
	return count.toString()
}

interface BlueskyFooterProps {
	post: any
	replyCount: number
	repostCount: number
	likeCount: number
	isLiked: boolean
	isReposted: boolean
	isBookmarked: boolean
	onLike: () => void
	onRepostClick: () => void
	onReplyClick: () => void
	onBookmark: () => void
	onAnalyticsClick: () => void
}

export function BlueskyFooter({
	                              post,
	                              replyCount,
	                              repostCount,
	                              likeCount,
	                              isLiked,
	                              isReposted,
	                              isBookmarked,
	                              onLike,
	                              onRepostClick,
	                              onReplyClick,
	                              onBookmark,
	                              onAnalyticsClick,
                              }: BlueskyFooterProps) {
	const { isAuthenticated } = useBluesky()

	return (
		<div className="flex items-center -ml-2 mt-2 text-red-600">
			{/* Reply */}
			<Button
				variant="ghost"
				size="sm"
				className="gap-1 px-2 hover:bg-red-500/10"
				onClick={onReplyClick}
				disabled={!isAuthenticated}
			>
				<MessageCircle className="h-4 w-4" />
				<span className="text-xs sm:text-sm tabular-nums font-medium">
                    {replyCount}
                </span>
			</Button>

			{/* Repost */}
			<Button
				variant="ghost"
				size="sm"
				className={cn("gap-1 px-2 hover:bg-red-500/10", isReposted && "text-red-600")}
				onClick={onRepostClick}
				disabled={!isAuthenticated}
			>
				<Repeat2 className="h-4 w-4" />
				<span className="text-xs sm:text-sm tabular-nums font-medium">
                    {repostCount}
                </span>
			</Button>

			{/* Like */}
			<Button
				variant="ghost"
				size="sm"
				className={cn("gap-1 px-2 hover:bg-red-500/10", isLiked && "text-red-600")}
				onClick={onLike}
				disabled={!isAuthenticated}
			>
				<Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
				<span className="text-xs sm:text-sm tabular-nums font-medium">
                    {likeCount}
                </span>
			</Button>

			{/* Bookmark */}
			<Button
				variant="ghost"
				size="sm"
				className={cn("gap-1 px-2 hover:bg-red-500/10", isBookmarked && "text-red-600")}
				onClick={onBookmark}
				disabled={!isAuthenticated}
				title={isBookmarked ? "Remove bookmark" : "Bookmark"}
			>
				<Bookmark className={cn("h-4 w-4", isBookmarked && "fill-current")} />
			</Button>

			{/* Analytics - always available */}
			{(replyCount + repostCount + likeCount) > 0 && (
				<Button
					variant="ghost"
					size="sm"
					className="gap-1 px-2 ml-auto hover:bg-red-500/10"
					onClick={onAnalyticsClick}
				>
					<BarChart3 className="h-3.5 w-3.5" />
					<span className="text-xs tabular-nums font-medium">
                        {formatEngagement(replyCount + repostCount + likeCount)}
                    </span>
				</Button>
			)}
		</div>
	)
}