"use client"

import { JSX, useState } from "react"
import Link from "next/link"
import { MarkdownRenderer } from "@/components/markdown-renderer"
import { BlueskyExternal } from "@/components/bluesky/bluesky-external"

type RichTextProps = {
	record: any
}

export const BlueskyRichText = ({ record }: RichTextProps) => {
	const [showExternal, setShowExternal] = useState<string | null>(null)

	if (!record?.text) return null

	const fullText = record.text ?? ""
	const facets = Array.isArray(record.facets) ? record.facets : []

	// No facets → full Markdown (keep as-is)
	if (facets.length === 0) {
		return <MarkdownRenderer content={fullText} />
	}

	// Sort facets by byteStart
	const sortedFacets = [...facets].sort((a, b) => a.index.byteStart - b.index.byteStart)

	const segments: JSX.Element[] = []
	let lastByteEnd = 0
	let key = 0

	// UTF-8 safe slicing
	const decoder = new TextDecoder("utf-8")
	const utf8Bytes = new TextEncoder().encode(fullText)

	for (const facet of sortedFacets) {
		const { byteStart, byteEnd } = facet.index
		const feature = facet.features?.[0]

		// Plain text before facet – force inline, no block breaks
		if (byteStart > lastByteEnd) {
			const plainBytes = utf8Bytes.subarray(lastByteEnd, byteStart)
			const plainText = decoder.decode(plainBytes).trimEnd() // avoid trailing space issues
			segments.push(
				<span
					key={key++}
					className="inline"
					dangerouslySetInnerHTML={{ __html: plainText }} // ← bypass MarkdownRenderer for plain segments
				/>
			)
		}

		// Facet slice
		const facetBytes = utf8Bytes.subarray(byteStart, byteEnd)
		const facetText = decoder.decode(facetBytes)

		if (feature?.$type === "app.bsky.richtext.facet#mention") {
			const handle = feature.handle || facetText.slice(1)
			segments.push(
				<Link
					key={key++}
					href={`/profile/${handle}`}
					className="text-red-600 hover:text-red-700 hover:underline font-medium inline"
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
					className="text-red-600 hover:text-red-700 hover:underline cursor-pointer inline"
				>
					{facetText}
				</a>
			)
		} else if (feature?.$type === "app.bsky.richtext.facet#tag") {
			const tag = feature.tag || facetText.slice(1)
			segments.push(
				<Link
					key={key++}
					href={`/feed/${encodeURIComponent(tag)}`}
					className="text-red-600 hover:text-red-700 hover:underline inline"
				>
					#{tag}
				</Link>
			)
		} else {
			// Unknown → inline markdown
			segments.push(
				<span key={key++} className="inline">
          <MarkdownRenderer content={facetText} />
        </span>
			)
		}

		lastByteEnd = byteEnd
	}

	// Trailing text – same inline treatment
	if (lastByteEnd < utf8Bytes.length) {
		const tailBytes = utf8Bytes.subarray(lastByteEnd)
		const tailText = decoder.decode(tailBytes).trimStart()
		segments.push(
			<span
				key={key++}
				className="inline"
				dangerouslySetInnerHTML={{ __html: tailText }}
			/>
		)
	}

	return (
		<>
      <span className="inline whitespace-pre-wrap break-words">
        {segments}
      </span>

			{showExternal && (
				<BlueskyExternal
					uri={showExternal}
					onClose={() => setShowExternal(null)}
				/>
			)}
		</>
	)
}