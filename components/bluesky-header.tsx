"use client"

import { cn } from "@/lib/utils"
import { BlueskyHeader } from "./BlueskyHeader"
import { BlueskyContent } from "./BlueskyContent"
import { BlueskyFooter } from "./BlueskyFooter"
import { formatDistanceToNow } from "date-fns"

interface BlueskyPostCardProps {
	post: any
	isReply?: boolean
	isQuoted?: boolean
	className?: string
	depth?: number
}

export function BlueskyPostCard({
	                                post,
	                                isReply = false,
	                                isQuoted = false,
	                                className = "",
	                                depth = 0,
                                }: BlueskyPostCardProps) {
	if (!post) {
		return (
			<div className="p-4 text-sm italic text-muted-foreground bg-muted/30 rounded-xl">
				Post not available
			</div>
		)
	}

	// Normalize shape (postView vs embedded record vs viewRecord)
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
	const isRepost = record.$type === "app.bsky.feed.repost" || (!record.text?.trim() && embed.record)
	const repostAuthor = isRepost ? author : null
	const mainPost = isRepost && embed.record ? embed.record : post

	const counts = {
		replies: post.replyCount ?? mainPost.replyCount ?? 0,
		reposts: post.repostCount ?? mainPost.repostCount ?? 0,
		likes: post.likeCount ?? mainPost.likeCount ?? 0,
	}

	const showFooter = !isQuoted && (counts.replies > 0 || counts.reposts > 0 || counts.likes > 0)

	return (
		<article
			className={cn(
				"bg-card border border-border rounded-xl overflow-hidden shadow-sm",
				depth > 0 && "border-dashed bg-muted/30 text-[0.94rem]",
				isQuoted && "bg-muted/50 border-muted-foreground/60",
				isReply && "border-l-4 border-l-blue-500/70 pl-5 bg-blue-50/20 dark:bg-blue-950/10",
				className
			)}
		>
			{/* Repost banner or full header */}
			{repostAuthor ? (
				<div className="px-4 py-2.5 text-xs text-muted-foreground flex items-center gap-1.5 bg-muted/50 border-b">
					<span className="font-medium">Reposted</span>
					<span>by {repostAuthor.displayName || `@${repostAuthor.handle}`}</span>
				</div>
			) : (
				<BlueskyHeader
					author={author}
					createdAt={createdAt}
					uri={uri}
					timeAgo={timeAgo}
				/>
			)}

			{/* Main content */}
			<div className="px-4 pb-3 pt-3">
				<BlueskyContent
					post={mainPost}
					isQuoted={isQuoted}
					currentDepth={depth}
					maxDepth={6}
				/>
			</div>

			{/* Nested quote / reposted content as full card */}
			{embed.record && (
				<div className="px-4 pb-4">
					<BlueskyPostCard
						post={embed.record}
						isQuoted
						depth={depth + 1}
					/>
				</div>
			)}

			{/* Footer */}
			{showFooter && (
				<BlueskyFooter counts={counts} />
			)}
		</article>
	)
}