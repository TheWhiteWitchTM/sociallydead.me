"use client"

import { createContext, useContext, useMemo, useCallback } from "react"
import { useBluesky } from "@/lib/bluesky-context"

interface HandleSuggestion {
	handle: string
	displayName?: string
	avatar?: string
	did: string
}

interface SuggestionContextValue {
	suggestHandles: (prefix: string, limit?: number) => Promise<HandleSuggestion[]>
	suggestHashtags: (prefix: string, limit?: number) => Promise<string[]>
	isAgentReady: boolean
}

const SuggestionContext = createContext<SuggestionContextValue | undefined>(undefined)

export function SuggestionProvider({ children }: { children: React.ReactNode }) {
	const { getAgent } = useBluesky()
	const agent = getAgent()

	// No debounce — plain async functions
	const suggestHandles = useCallback(async (prefix: string, limit = 8): Promise<HandleSuggestion[]> => {
		if (!agent || prefix.trim().length < 1) {
			return []
		}

		try {
			const res = await agent.searchActorsTypeahead({
				term: prefix.trim(),
				limit: Math.min(limit, 100),
			})
			return (res.data.actors ?? [])
				.filter((a: any) => a.handle)
				.map((actor: any) => ({
					handle: actor.handle,
					displayName: actor.displayName ?? undefined,
					avatar: actor.avatar,
					did: actor.did,
				}))
		} catch (err) {
			console.error("[suggestHandles] Failed:", err)
			return []
		}
	}, [agent])

	const suggestHashtags = useCallback(async (prefix: string, limit = 10): Promise<string[]> => {
		if (!agent || prefix.trim().length < 1) {
			return []
		}

		const lowerPrefix = prefix.toLowerCase().trim()

		try {
			// Attempt richer trends endpoint first
			const trendsRes = await (agent as any).app.bsky.unspecced.getTrends({}).catch(() => null)

			if (trendsRes?.data?.trends?.length || trendsRes?.data?.topics?.length) {
				const topics = (trendsRes.data.trends ?? [])
					.map((t: any) => t.topic ?? t.name ?? "")
					.concat(trendsRes.data.topics ?? [])
					.filter(Boolean)

				const filtered = topics
					.map((t: string) => t.toLowerCase())
					.filter((t: string) => t.startsWith(lowerPrefix))
					.slice(0, limit)

				if (filtered.length) return filtered
			}

			// Fallback to lightweight trending topics
			const topicsRes = await (agent as any).app.bsky.unspecced.getTrendingTopics({}).catch(() => null)

			if (topicsRes?.data?.topics?.length) {
				const filtered = (topicsRes.data.topics as string[])
					.map((t: string) => t.toLowerCase())
					.filter((t: string) => t.startsWith(lowerPrefix))
					.slice(0, limit)

				if (filtered.length) return filtered
			}

			// Final fallback: search recent posts
			const searchRes = await agent.app.bsky.feed.searchPosts({
				q: `#${lowerPrefix}*`,
				limit: 80,
				sort: "latest",
			}).catch(() => null)

			if (searchRes?.data?.posts?.length) {
				const tags = new Set<string>()

				for (const post of searchRes.data.posts) {
					const text = (post.record as any)?.text || ""
					const matches = text.match(/#([\p{L}\p{N}_]+)/giu) || []
					matches.forEach((m: string) => {
						const tag = m.slice(1).toLowerCase()
						if (tag.startsWith(lowerPrefix)) tags.add(tag)
					})
				}

				return Array.from(tags).slice(0, limit)
			}

			return []
		} catch (err) {
			console.error("[suggestHashtags] Failed:", err)
			return []
		}
	}, [agent])

	const value = useMemo(
		() => ({
			suggestHandles,
			suggestHashtags,
			isAgentReady: !!agent,
		}),
		[suggestHandles, suggestHashtags, agent]
	)

	return <SuggestionContext.Provider value={value}>{children}</SuggestionContext.Provider>
}

export function useSuggestionContext() {
	const context = useContext(SuggestionContext)
	if (!context) {
		throw new Error("useSuggestionContext must be used within SuggestionProvider")
	}
	return context
}