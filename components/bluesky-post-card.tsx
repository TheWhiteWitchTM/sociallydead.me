"use client"

import { cn } from "@/lib/utils"
import { Repeat } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

import { BlueskyHeader } from "@/components/bluesky-header"
import { BlueskyContent } from "@/components/bluesky-content"
import { BlueskyFooter } from "@/components/bluesky-footer"

interface BlueskyPostCardProps {
	post: any
	className?: string
	isQuoted?: boolean
	isReply?: boolean
	depth?: number
	isOwnPost?: boolean
	isPinned?: boolean
	showReplyContext?: boolean
}

export function BlueskyPostCard({
	                                post,
	                                className = "",
	                                isQuoted = false,
	                                isReply = false,
	                                depth = 0,
	                                isOwnPost = false,
	                                isPinned = false,
	                                showReplyContext = true,
                                }: BlueskyPostCardProps) {
	if (!post) {
		return (
			<div className="p-4 text-sm italic text-muted-foreground bg-muted/30 rounded-xl">
				Post not available
			</div>
		)
	}

	const record = post.record ?? post.value
	if (!record) {
		return (
			<div className="p-4 text-sm italic text-muted-foreground bg-muted/30 rounded-xl">
				Missing record
			</div>
		)
	}

	const author = post.author
	const uri = post.uri ?? ""
	const createdAt = record.createdAt ? new Date(record.createdAt) : new Date()
	const timeAgo = formatDistanceToNow(createdAt, { addSuffix: true })

	const embed = post.embed ?? {}
	const isRepostReason = post.reason?.$type === "app.bsky.feed.defs#reasonRepost"
	const repostAuthor = isRepostReason ? post.reason.by : null

	const mainPost = isRepostReason && post.post ? post.post : post

	// For now we use placeholder values — later you'll connect the hook
	const replyCount = mainPost.replyCount ?? 0
	const repostCount = mainPost.repostCount ?? 0
	const likeCount = mainPost.likeCount ?? 0
	const isLiked = !!mainPost.viewer?.like
	const isReposted = !!mainPost.viewer?.repost
	const isBookmarked = false // placeholder

	return (
		<article
			className={cn(
				"bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:bg-accent/50 transition-colors",
				depth > 0 && "border-dashed bg-muted/20 text-[0.94rem]",
				isQuoted && "bg-muted/50 border-muted-foreground/60",
				isReply && "border-l-4 border-l-blue-500/70 pl-5 bg-blue-50/20 dark:bg-blue-950/10",
				className
			)}
		>
			{/* Repost banner or full header */}
			{repostAuthor ? (
				<div className="px-4 py-2.5 text-xs text-muted-foreground flex items-center gap-1.5 bg-muted/50 border-b">
					<Repeat className="h-4 w-4" />
					<span>
            Reposted by <strong>{repostAuthor.displayName || `@${repostAuthor.handle}`}</strong>
          </span>
				</div>
			) : (
				<BlueskyHeader
					post={mainPost}
					isOwnPost={isOwnPost}
					isPinned={isPinned}
					showReplyContext={showReplyContext}
					// pass down whatever props your current BlueskyHeader expects
				/>
			)}

			{/* Content area */}
			<div className="px-4 py-3">
				<BlueskyContent post={mainPost} className="mt-2" />
			</div>

			{/* Recursive nested quote / reposted post */}
			{embed.record && (
				<div className="px-4 pb-4">
					<BlueskyPostCard
						post={embed.record}
						isQuoted={true}
						depth={depth + 1}
						// inherit props if needed
						isOwnPost={isOwnPost}
						isPinned={isPinned}
						showReplyContext={showReplyContext}
					/>
				</div>
			)}

			{/* Footer */}
			<BlueskyFooter
				replyCount={replyCount}
				repostCount={repostCount}
				likeCount={likeCount}
				isLiked={isLiked}
				isReposted={isReposted}
				isBookmarked={isBookmarked}
				// handlers will be connected later from the hook
				onLike={() => console.log("Like placeholder")}
				onRepostClick={() => console.log("Repost placeholder")}
				onReplyClick={() => console.log("Reply placeholder")}
				onBookmark={() => console.log("Bookmark placeholder")}
				onAnalyticsClick={() => console.log("Analytics placeholder")}
			/>
		</article>
	)
}