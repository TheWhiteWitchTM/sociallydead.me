"use client"

import { useState, useEffect, useCallback } from "react"
import { useBluesky } from "@/lib/bluesky-context"

export function useHashtagSuggestions(prefix: string, limit = 10) {
	const { getAgent } = useBluesky()

	const [suggestions, setSuggestions] = useState<string[]>([])
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const fetchSuggestions = useCallback(async () => {
		const trimmed = prefix.trim()
		if (!trimmed) {
			setSuggestions([])
			setIsLoading(false)
			setError(null)
			return
		}

		const agent = getAgent()
		if (!agent) {
			setError("No agent")
			setIsLoading(false)
			return
		}

		const lower = trimmed.toLowerCase()
		setIsLoading(true)
		setError(null)

		try {
			let result: string[] | null = null

			try {
				const res = await (agent as any).app.bsky.unspecced.getTrends({})
				if (res?.data?.trends?.length || res?.data?.topics?.length) {
					const topics = [
						...(res.data.trends ?? []).map((t: any) => t.topic ?? t.name ?? ""),
						...(res.data.topics ?? []),
					].filter(Boolean) as string[]

					result = topics
						.map(t => t.toLowerCase())
						.filter(t => t.startsWith(lower))
						.slice(0, limit)
				}
			} catch {}

			if (result && result.length) {
				setSuggestions(result)
				setIsLoading(false)
				return
			}

			try {
				const res = await (agent as any).app.bsky.unspecced.getTrendingTopics({})
				if (res?.data?.topics?.length) {
					result = (res.data.topics as string[])
						.map(t => t.toLowerCase())
						.filter(t => t.startsWith(lower))
						.slice(0, limit)
				}
			} catch {}

			if (result && result.length) {
				setSuggestions(result)
				setIsLoading(false)
				return
			}

			const res = await agent.app.bsky.feed.searchPosts({
				q: `#${lower}*`,
				limit: 80,
				sort: "latest",
			})

			const tags = new Set<string>()
			for (const post of res.data.posts ?? []) {
				const text = (post.record as any)?.text ?? ""
				const matches:string[] = text.match(/#([\p{L}\p{N}_]+)/giu) ?? []
				matches.forEach(m => {
					const tag = m.slice(1).toLowerCase()
					if (tag.startsWith(lower)) tags.add(tag)
				})
			}

			setSuggestions(Array.from(tags).slice(0, limit))
		} catch (err) {
			console.error("suggestHashtags failed", err)
			setError("Failed to load hashtags")
			setSuggestions([])
		} finally {
			setIsLoading(false)
		}
	}, [prefix, limit, getAgent])

	useEffect(() => {
		fetchSuggestions()
	}, [fetchSuggestions])

	return { suggestions, isLoading, error }
}