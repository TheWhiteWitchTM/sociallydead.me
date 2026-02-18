"use client"

import { useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"
import { Dialog, DialogContent } from "./ui/dialog"
import { Button } from "./ui/button"
import { BlueskyImages } from "@/components/bluesky-images"
import { BlueskyVideo } from "@/components/bluesky-video"
import { BlueskyExternal } from "@/components/bluesky-external"

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

	if (!post) {
		return (
			<div className="p-3 text-sm italic text-muted-foreground">
				Post content not available
			</div>
		)
	}

	// Normalize for top-level postView vs embedded viewRecord
	const record = post.record || post.value
	const embed = post.embed || (post.embeds && post.embeds.length > 0 ? post.embeds[0] : undefined)
	const author = post.author
	const uri = post.uri

	if (!record) {
		return (
			<div className="p-3 text-sm italic text-muted-foreground">
				Post content not available
			</div>
		)
	}

	// Special handling if this is a raw repost record (unlikely, but covers if passed directly)
	if (record.$type === "app.bsky.feed.repost") {
		return (
			<div className="p-3 text-sm italic text-muted-foreground">
				Repost content not loaded
			</div>
		)
	}

	const handleExternalClick = (uri: string) => {
		setExternalUri(uri)
		setExternalOpen(true)
	}

	const text = record.text ?? ""
	const facets = record.facets ?? []

	// Determine if this looks like a pure repost (no text + embed record) - for display purposes
	const isPureRepost = !text.trim() && embed?.$type?.includes("record")

	// The embedded post (quote or repost target)
	const embeddedPost = embed?.record

	// ── Rich text rendering with facets ──
	const renderRichText = () => {
		if (!text) return null

		if (!facets.length) {
			return <div className="whitespace-pre-wrap break-words">{text}</div>
		}

		const segments: JSX.Element[] = []
		let lastByteEnd = 0

		// Sort facets by byteStart
		const sortedFacets = [...facets].sort((a, b) => a.index.byteStart - b.index.byteStart)

		for (const facet of sortedFacets) {
			const { byteStart, byteEnd } = facet.index
			const feature = facet.features?.[0]

			// Text before facet
			if (byteStart > lastByteEnd) {
				segments.push(
					<span key={lastByteEnd} className="whitespace-pre-wrap">
            {text.slice(lastByteEnd, byteStart)}
          </span>
				)
			}

			const slice = text.slice(byteStart, byteEnd)

			if (feature?.$type === "app.bsky.richtext.facet#mention") {
				const handle = feature.handle || slice.slice(1)
				segments.push(
					<Link
						key={byteStart}
						href={`/profile/${handle}`}
						className="text-blue-600 hover:underline font-medium"
					>
						@{handle}
					</Link>
				)
			} else if (feature?.$type === "app.bsky.richtext.facet#link") {
				const uri = feature.uri || slice
				segments.push(
					<a
						key={byteStart}
						href="#"
						onClick={(e) => {
							e.preventDefault()
							if (uri) handleExternalClick(uri)
						}}
						className="text-blue-600 hover:underline"
					>
						{slice}
					</a>
				)
			} else if (feature?.$type === "app.bsky.richtext.facet#tag") {
				const tag = feature.tag || slice.slice(1)
				segments.push(
					<Link
						key={byteStart}
						href={`/feed/${encodeURIComponent(tag)}`}
						className="text-blue-600 hover:underline"
					>
						#{tag}
					</Link>
				)
			} else {
				// fallback
				segments.push(<span key={byteStart}>{slice}</span>)
			}

			lastByteEnd = byteEnd
		}

		// Trailing text
		if (lastByteEnd < text.length) {
			segments.push(
				<span key={lastByteEnd} className="whitespace-pre-wrap">
          {text.slice(lastByteEnd)}
        </span>
			)
		}

		return <div className="whitespace-pre-wrap break-words">{segments}</div>
	}

	return (
		<Link
			href={`/profile/${author?.handle || "unknown"}/post/${uri?.split("/").pop() || ""}`}
			className={cn(
				"block cursor-pointer hover:bg-accent/30 transition-colors rounded-lg p-2 -m-2",
				className
			)}
		>
			<div className="space-y-3">
				{/* Repost label if pure repost-like */}
				{isPureRepost && (
					<div className="text-xs text-muted-foreground font-medium">
						Reposted
					</div>
				)}

				{/* Main text (with facets) */}
				{renderRichText()}

				{/* Images */}
				{embed?.images && (
					<BlueskyImages
						images={embed.images.map((img: any) => ({
							thumb: img.thumb,
							fullsize: img.fullsize,
							alt: img.alt ?? "",
						}))}
					/>
				)}

				{/* Video */}
				{embed?.video && (
					<BlueskyVideo
						playlist={embed.video.playlist}
						thumbnail={embed.video.thumbnail}
						alt={embed.video.alt}
						aspectRatio={embed.video.aspectRatio}
					/>
				)}

				{/* External card */}
				{embed?.external && (
					<BlueskyExternal
						uri={embed.external.uri}
						title={embed.external.title}
						description={embed.external.description}
						thumb={embed.external.thumb}
					/>
				)}

				{/* Quoted / Embedded content */}
				{embeddedPost && (
					<div
						className={cn(
							"mt-3 border border-border rounded-xl overflow-hidden bg-muted/30",
							isQuoted && "bg-muted/20"
						)}
					>
						<div className="p-3">
							{/* Quote label if has text */}
							{!isPureRepost && text.trim() && (
								<div className="text-xs text-muted-foreground mb-2">Quote</div>
							)}

							<BlueskyContent
								post={embeddedPost}
								isQuoted={true}
								currentDepth={currentDepth + 1}
								maxDepth={maxDepth}
							/>
						</div>

						{/* Attached media in recordWithMedia */}
						{embed?.$type?.includes("recordWithMedia") && embed.media && (
							<div className="border-t border-border bg-card p-3">
								{embed.media.images && (
									<BlueskyImages
										images={embed.media.images.map((img: any) => ({
											thumb: img.thumb,
											fullsize: img.fullsize,
											alt: img.alt ?? "",
										}))}
									/>
								)}

								{embed.media.video && (
									<BlueskyVideo
										playlist={embed.media.video.playlist}
										thumbnail={embed.media.video.thumbnail}
										alt={embed.media.video.alt}
										aspectRatio={embed.media.video.aspectRatio}
									/>
								)}

								{embed.media.external && (
									<BlueskyExternal
										uri={embed.media.external.uri}
										title={embed.media.external.title}
										description={embed.media.external.description}
										thumb={embed.media.external.thumb}
									/>
								)}
							</div>
						)}
					</div>
				)}
			</div>

			{/* External link dialog */}
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