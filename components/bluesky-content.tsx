"use client"

import { useState } from "react"
import Link from "next/link"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { BlueskyImages } from "@/components/bluesky-images"
import { BlueskyVideo } from "@/components/bluesky-video"
import { BlueskyExternal } from "@/components/bluesky-external"
import { cn } from "@/lib/utils"
import {X} from "lucide-react";
import {Dialog, DialogContent} from "./ui/dialog"
import {Button} from "./ui/button"

interface BlueskyContentProps {
	post: any
	className?: string
	isQuoted?: boolean
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
	const [externalOpen, setExternalOpen] = useState(false)
	const [externalUri, setExternalUri] = useState("")

	if (currentDepth > maxDepth) {
		return (
			<div className="p-3 text-sm italic text-muted-foreground border border-border rounded-lg bg-muted/30">
				Quote chain too deep — stopped rendering
			</div>
		)
	}

	if (!post || !post.record) {
		return (
			<div className="p-3 text-sm italic text-muted-foreground">
				Post content not available
			</div>
		)
	}

	const handleExternalClick = (uri: string) => {
		setExternalUri(uri)
		setExternalOpen(true)
	}

	return (
		<Link
			href={`/profile/${post.author?.handle || 'unknown'}/post/${post.uri?.split('/').pop() || ''}`}
			className={cn("block cursor-pointer hover:bg-accent/30 transition-colors rounded-lg p-2 -m-2", className)}
		>
			<div className="space-y-3">
				{/* Text */}
				{post.record?.text && (
					<ReactMarkdown
						remarkPlugins={[remarkGfm]}
						components={{
							a: ({ href, children, ...props }) => {
								// Handle @username
								if (href?.startsWith('@')) {
									const handle = href.slice(1)
									return (
										<Link href={`/profile/${handle}`} className="text-blue-500 hover:underline" {...props}>
											{children}
										</Link>
									)
								}

								// Handle #hashtag
								if (href?.startsWith('#')) {
									const tag = href.slice(1)
									return (
										<Link href={`/feed/${tag}`} className="text-blue-500 hover:underline" {...props}>
											{children}
										</Link>
									)
								}

								// External link → open in dialog
								return (
									<a
										href="#"
										onClick={(e) => {
											e.preventDefault()
											if (href) handleExternalClick(href)
										}}
										className="text-blue-500 hover:underline"
										{...props}
									>
										{children}
									</a>
								)
							},
						}}
					>
						{post.record.text}
					</ReactMarkdown>
				)}

				{/* Images */}
				{post.embed?.images && (
					<BlueskyImages
						images={post.embed.images.map((img: any) => ({
							thumb: img.thumb,
							fullsize: img.fullsize,
							alt: img.alt ?? "",
						}))}
					/>
				)}

				{/* Video */}
				{post.embed?.playlist && (
					<BlueskyVideo
						playlist={post.embed.playlist}
						thumbnail={post.embed.thumbnail}
						alt={post.embed.alt}
						aspectRatio={post.embed.aspectRatio}
					/>
				)}

				{/* External */}
				{post.embed?.external && (
					<BlueskyExternal
						uri={post.embed.external.uri}
						title={post.embed.external.title}
						description={post.embed.external.description}
						thumb={post.embed.external.thumb}
					/>
				)}

				{/* Quoted post */}
				{post.embed?.record && (
					<div className={cn(
						"mt-3 border border-border rounded-xl overflow-hidden bg-muted/30",
						isQuoted && "bg-muted/20"
					)}>
						<div className="p-3">
							<BlueskyContent
								post={post.embed.record}
								isQuoted={true}
								currentDepth={currentDepth + 1}
								maxDepth={maxDepth}
							/>
						</div>

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

			{/* External link iframe dialog */}
			<Dialog open={externalOpen} onOpenChange={setExternalOpen}>
				<DialogContent className="max-w-screen h-screen max-h-screen w-screen border-0 bg-background p-0 sm:rounded-none">
					<div className="relative flex h-full w-full flex-col">
						<div className="flex items-center justify-between border-b bg-card px-4 py-3">
							<div className="min-w-0">
								<h3 className="font-medium truncate">{externalUri}</h3>
							</div>
							<Button variant="ghost" size="icon" onClick={() => setExternalOpen(false)}>
								<X className="h-5 w-5" />
							</Button>
						</div>
						<div className="flex-1 relative">
							<iframe
								src={externalUri}
								className="absolute inset-0 w-full h-full border-0"
								allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
								sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
								title="External content"
								loading="lazy"
							/>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</Link>
	)
}