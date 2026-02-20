"use client"

import { RichText as ATRichText } from "@atproto/api"
import { useState } from "react"
import Link from "next/link"
import { MarkdownRenderer } from "@/components/markdown-renderer"
import { BlueskyExternal } from "@/components/bluesky-external"

type RichTextProps = {
	record: any
}

export const BlueskyRichText = ({ record }: RichTextProps) => {
	const [showExternal, setShowExternal] = useState<string | null>(null)

	if (!record?.text) return null

	const text = record.text ?? ""
	const facets = record.facets ?? []

	// If no facets, render full text with Markdown
	if (!facets.length) {
		return <MarkdownRenderer content={text} />
	}

	// Use official RichText for correct byte handling and segmentation
	const rt = new ATRichText({ text, facets })

	const segments: JSX.Element[] = []
	let key = 0

	for (const segment of rt.segments) {
		if (segment.isMention()) {
			const handle = segment.mention?.handle ?? segment.text.slice(1)
			segments.push(
				<Link
					key={key++}
					href={`/profile/${handle}`}
					className="text-blue-600 hover:underline font-medium"
				>
					@{handle}
				</Link>
			)
		} else if (segment.isLink()) {
			const uri = segment.link?.uri ?? segment.text
			segments.push(
				<a
					key={key++}
					href="#"
					onClick={(e) => {
						e.preventDefault()
						setShowExternal(uri)  // Open the browser component (modal/preview)
					}}
					className="text-blue-600 hover:underline"
				>
					{segment.text}
				</a>
			)
		} else if (segment.isTag()) {
			const tag = segment.tag?.tag ?? segment.text.slice(1)
			segments.push(
				<Link
					key={key++}
					href={`/feed/${encodeURIComponent(tag)}`}
					className="text-blue-600 hover:underline"
				>
					#{tag}
				</Link>
			)
		} else {
			// Plain text segment – apply Markdown if needed (optimized: only if text might contain MD)
			segments.push(
				<MarkdownRenderer key={key++} content={segment.text} />
			)
		}
	}

	return (
		<>
			{segments}
			{showExternal && (
				<BlueskyExternal
					uri={showExternal}
					onClose={() => setShowExternal(null)}  // Assume BlueskyExternal has onClose prop
				/>
			)}
		</>
	)
}