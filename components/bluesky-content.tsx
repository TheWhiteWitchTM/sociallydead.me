"use client"

import { BlueskyImages } from "@/components/bluesky-images"
import { BlueskyVideo } from "@/components/bluesky-video"
import { BlueskyExternal } from "@/components/bluesky-external"
import { MarkdownRenderer } from "@/components/markdown-renderer"
import { cn } from "@/lib/utils"

interface BlueskyContentProps {
	post: any
	className?: string
	isQuoted?: boolean           // only used for styling adjustment if needed
	currentDepth?: number
	maxDepth?: number
}

export function BlueskyContent({
	                               post,
	                               className = "",
	                               isQuoted = false,
	                               currentDepth = 0,
	                               maxDepth = 3,
                               }: BlueskyContentProps) {
	if (currentDepth > maxDepth) {
		return (
			<div className="p-3 text-sm text-muted-foreground italic border border-border rounded-lg bg-muted/30">
				Quote chain too deep
			</div>
		)
	}

	return (
		<div className={cn("space-y-3", className)}>
			{/* Just the text — nothing else */}
			{post.record?.text && (
				<div className="prose dark:prose-invert max-w-none">
					<MarkdownRenderer content={post.record.text} />
				</div>
			)}

			{/* Direct media (images / video / external) */}
			{post.embed && (
				<div className="mt-2 space-y-3">
					{post.embed.images && (
						<BlueskyImages
							images={post.embed.images.map((img: any) => ({
								thumb: img.thumb,
								fullsize: img.fullsize,
								alt: img.alt ?? "",
							}))}
						/>
					)}

					{post.embed.playlist && (
						<BlueskyVideo
							playlist={post.embed.playlist}
							thumbnail={post.embed.thumbnail}
							alt={post.embed.alt}
							aspectRatio={post.embed.aspectRatio}
						/>
					)}

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
			{post.embed?.record && (
				<div className={cn(
					"mt-3 border border-border rounded-xl overflow-hidden bg-muted/30",
					isQuoted && "bg-muted/20 text-sm"
				)}>
					<div className="p-3">
						{/* Recursive content — only content, no author/timestamp again */}
						<BlueskyContent
							post={post.embed.record}
							isQuoted={true}
							currentDepth={currentDepth + 1}
							maxDepth={maxDepth}
						/>
					</div>

					{/* Attached media on the quote (recordWithMedia) */}
					{post.embed.$type?.includes("recordWithMedia") && post.embed.media && (
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