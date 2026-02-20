"use client"

import {MarkdownRenderer} from "@/components/markdown-renderer";
import {JSX} from "react";
import Link from "next/link";
import {BlueskyExternal} from "@/components/bluesky-external";

type RichTextRecord = {
	text?: string
	facets?: any[]
}

type RichTextProps = {
	record: RichTextRecord
}

const handleExternalClick = (uri: string) => {
	return(
		<BlueskyExternal
			uri={uri}
		/>
	)
}

export const BlueskyRichText = (
	{record}: RichTextProps,
) => {
		if (!record.text) return null

		if (!record?.facets?.length) {
			return(
				<MarkdownRenderer content={record.text}/>
			)
		}

		const text = record.text ?? ""
		const facets = record.facets ?? []

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
            <MarkdownRenderer key={lastByteEnd} content={text.slice(lastByteEnd, byteStart)}/>
				)
			}

			const slice = text.slice(byteStart, byteEnd)

			if (feature?.$type === "app.bsky.richtext.facet#mention") {
				const handle = feature.handle || slice.slice(1)
				segments.push(
					<Link
						key={byteStart}
						href={`/profile/${handle}`}
						className="text-red-600 hover:underline font-medium"
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
						className="text-red-600 hover:underline"
					>
						<MarkdownRenderer content={slice}/>
					</a>
				)
			} else if (feature?.$type === "app.bsky.richtext.facet#tag") {
				const tag = feature.tag || slice.slice(1)
				segments.push(
					<Link
						key={byteStart}
						href={`/feed/${encodeURIComponent(tag)}`}
						className="text-red-600 hover:underline"
					>
						#{tag}
					</Link>
				)
			} else {
				// fallback
				segments.push(
					<MarkdownRenderer key={byteStart} content={slice}/>
				)
			}
		}
}