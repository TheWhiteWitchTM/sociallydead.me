"use client"

import { BlueskyImages } from "@/components/bluesky-images"
import { BlueskyVideo } from "@/components/bluesky-video"
import { BlueskyExternal } from "@/components/bluesky-external"
import { MarkdownRenderer } from "@/components/markdown-renderer"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { VerifiedBadge } from "@/components/verified-badge"
import { HandleLink } from "@/components/handle-link"
import { UserHoverCard } from "@/components/user-hover-card"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface BlueskyContentProps {
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
		}
		embed?: any // your existing embed union type
		[key: string]: any
	}
	isQuoted?: boolean          // optional: smaller styling when nested/quoted
	className?: string
	maxDepth?: number           // prevent infinite quote recursion (default 3)
	currentDepth?: number
}

export function BlueskyContent({
	                               post,
	                               isQuoted = false,
	                               className = "",
	                               maxDepth = 3,
	                               currentDepth = 0,
                               }: BlueskyContentProps) {
	if (currentDepth > maxDepth) {
		return (
			<div className="p-3 text-sm text-muted-foreground italic border border-border rounded-lg">
				Quote chain too deep — stopped rendering
			</div>
		)
	}

	const depthClass = isQuoted ? "text-sm" : "text-base"

	return (
		<div className={cn("space-y-2", className)}>
			{/* Author line – smaller when quoted */}
			<div className="flex items-start gap-2">
				<UserHoverCard handle={post.author.handle}>
					<Link href={`/profile/${post.author.handle}`} className="shrink-0">
						<Avatar className={cn("h-8 w-8", isQuoted && "h-7 w-7")}>
							<AvatarImage src={post.author.avatar} alt={post.author.displayName || post.author.handle} />
							<AvatarFallback>
								{(post.author.displayName || post.author.handle)?.slice(0, 2).toUpperCase()}
							</AvatarFallback>
						</Avatar>
					</Link>
				</UserHoverCard>

				<div className="min-w-0 flex-1">
					<div className="flex items-center gap-1.5">
            <span className={cn("font-medium truncate", depthClass)}>
              {post.author.displayName || post.author.handle}
            </span>
						<VerifiedBadge handle={post.author.handle} did={post.author.did} />
					</div>

					<HandleLink
						handle={post.author.handle}
						className={cn("text-xs sm:text-sm text-muted-foreground", isQuoted && "text-xs")}
					/>

					<Link
						href={`/profile/${post.author.handle}/post/${post.uri.split('/').pop()}`}
						className="block text-xs text-muted-foreground hover:underline mt-0.5"
					>
						{formatDistanceToNow(new Date(post.record.createdAt), { addSuffix: true })}
					</Link>
				</div>
			</div>

			{/* Main text */}
			{post.record.text && (
				<div className={cn("prose dark:prose-invert max-w-none", depthClass)}>
					<MarkdownRenderer content={post.record.text} />
				</div>
			)}

			{/* Main media (images / video / external) */}
			{post.embed && (
				<div className="mt-2">
					{/* Images */}
					{post.embed.images && (
						<BlueskyImages
							images={post.embed.images.map((img: any) => ({
								thumb: img.thumb,
								fullsize: img.fullsize,
								alt: img.alt ?? "",
							}))}
						/>
					)}

					{/* Video */}
					{post.embed.playlist && (
						<BlueskyVideo
							playlist={post.embed.playlist}
							thumbnail={post.embed.thumbnail}
							alt={post.embed.alt}
							aspectRatio={post.embed.aspectRatio}
						/>
					)}

					{/* External */}
					{post.embed.external && (
						<BlueskyExternal
							uri={post.embed.external.uri}
							title={post.embed.external.title}
							description={post.embed.external.description}
							thumb={post.embed.external.thumb}
						/>
					)}
				</div>
			)}

			{/* Quoted post (record or recordWithMedia) */}
			{(post.embed?.$type?.includes("record#view") || post.embed?.$type?.includes("recordWithMedia#view")) &&
				post.embed.record && (
					<div
						className={cn(
							"mt-3 border border-border rounded-xl overflow-hidden bg-muted/30",
							isQuoted && "bg-muted/20"
						)}
					>
						<div className="p-3">
							<BlueskyContent
								post={post.embed.record}
								isQuoted={true}
								currentDepth={currentDepth + 1}
								maxDepth={maxDepth}
							/>
						</div>

						{/* Attached media on the quote (recordWithMedia) */}
						{post.embed.$type.includes("recordWithMedia") && post.embed.media && (
							<div className="border-t border-border bg-card p-3">
								{post.embed.media.images && (
									<BlueskyImages
										images={post.embed.media.images.map((img: any) => ({
											thumb: img.thumb,
											fullsize: img.fullsize,
											alt: img.alt ?? "",
										}))}
									/>
								)}

								{post.embed.media.playlist && (
									<BlueskyVideo
										playlist={post.embed.media.playlist}
										thumbnail={post.embed.media.thumbnail}
										alt={post.embed.media.alt}
										aspectRatio={post.embed.media.aspectRatio}
									/>
								)}

								{post.embed.media.external && (
									<BlueskyExternal
										uri={post.embed.media.external.uri}
										title={post.embed.media.external.title}
										description={post.embed.media.external.description}
										thumb={post.embed.media.external.thumb}
									/>
								)}
							</div>
						)}
					</div>
				)}
		</div>
	)
}