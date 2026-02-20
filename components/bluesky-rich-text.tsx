"use client"

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

	const fullText = record.text ?? ""
	const facets = Array.isArray(record.facets) ? record.facets : []

	// No facets? Just render full Markdown
	if (facets.length === 0) {
		return <MarkdownRenderer content={fullText} />
	}

	// Sort facets by byteStart (required for correct order)
	const sortedFacets = [...facets].sort((a, b) => a.index.byteStart - b.index.byteStart)

	const segments: JSX.Element[] = []
	let lastByteEnd = 0
	let key = 0

	// Helper: decode UTF-8 bytes safely to string slice
	const decoder = new TextDecoder("utf-8")

	// Convert full text to Uint8Array once (for correct byte slicing)
	const utf8Bytes = new TextEncoder().encode(fullText)

	for (const facet of sortedFacets) {
		const { byteStart, byteEnd } = facet.index
		const feature = facet.features?.[0]

		// Plain text before this facet
		if (byteStart > lastByteEnd) {
			const plainBytes = utf8Bytes.subarray(lastByteEnd, byteStart)
			const plainText = decoder.decode(plainBytes)
			segments.push(
				<MarkdownRenderer key={key++} content={plainText} />
			)
		}

		// The facet slice itself
		const facetBytes = utf8Bytes.subarray(byteStart, byteEnd)
		const facetText = decoder.decode(facetBytes)

		if (feature?.$type === "app.bsky.richtext.facet#mention") {
			const handle = feature.handle || facetText.slice(1)
			segments.push(
				<Link
					key={key++}
					href={`/profile/${handle}`}
					className="text-blue-600 hover:underline font-medium"
				>
					@{handle}
				</Link>
			)
		} else if (feature?.$type === "app.bsky.richtext.facet#link") {
			const uri = feature.uri || facetText.trim()
			segments.push(
				<a
					key={key++}
					href="#"
					onClick={(e) => {
						e.preventDefault()
						if (uri) setShowExternal(uri)
					}}
					className="text-blue-600 hover:underline cursor-pointer"
				>
					<MarkdownRenderer content={facetText} />
				</a>
			)
		} else if (feature?.$type === "app.bsky.richtext.facet#tag") {
			const tag = feature.tag || facetText.slice(1)
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
			// Unknown facet type → treat as plain Markdown
			segments.push(
				<MarkdownRenderer key={key++} content={facetText} />
			)
		}

		lastByteEnd = byteEnd
	}

	// Don't forget the tail after last facet!
	if (lastByteEnd < utf8Bytes.length) {
		const tailBytes = utf8Bytes.subarray(lastByteEnd)
		const tailText = decoder.decode(tailBytes)
		segments.push(
			<MarkdownRenderer key={key++} content={tailText} />
		)
	}

	return (
		<>
			{segments}
			{showExternal && (
				<BlueskyExternal
					uri={showExternal}
					onClose={() => setShowExternal(null)} // Make sure your BlueskyExternal accepts onClose
				/>
			)}
		</>
	)
}