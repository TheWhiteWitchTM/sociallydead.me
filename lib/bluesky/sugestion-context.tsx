// SuggestionContext.tsx  (keep most of it, just small cleanups)

"use client"

import { createContext, useContext, useMemo } from "react"
import { useBluesky } from "@/lib/bluesky-context"
import debounce from "debounce"

export interface HandleSuggestion {
	handle: string
	displayName?: string
	avatar?: string
	did: string
}

export interface SuggestionContextValue {
	suggestHandles: (prefix: string, limit?: number) => Promise<HandleSuggestion[]>
	suggestHashtags: (prefix: string, limit?: number) => Promise<string[]>
	isAgentReady: boolean
}

const SuggestionContext = createContext<SuggestionContextValue | undefined>(undefined)

export function SuggestionProvider({ children }: { children: React.ReactNode }) {
	const { getAgent } = useBluesky()
	const agent = getAgent()

	const suggestHandles = useMemo(
		() =>
			debounce(async (prefix: string, limit = 8): Promise<HandleSuggestion[]> => {
				if (!agent || prefix.trim().length < 1) return []
				try {
					const res = await agent.searchActorsTypeahead({
						term: prefix.trim(),
						limit: Math.min(limit, 100),
					})
					return (res.data.actors ?? []).map((a: any) => ({
						handle: a.handle,
						displayName: a.displayName,
						avatar: a.avatar,
						did: a.did,
					}))
				} catch (err) {
					console.error("suggestHandles failed:", err)
					return []
				}
			}, 300),
		[agent]
	)

	const suggestHashtags = useMemo(
		() =>
			debounce(async (prefix: string, limit = 10): Promise<string[]> => {
				if (!agent || prefix.trim().length < 1) return []
				const q = prefix.trim().toLowerCase()

				try {
					// Try trends first (newer ATProto endpoints)
					const trends = await agent.app.bsky.unspecced.getTrends({}).catch(() => null)
					if (trends?.data?.trends?.length) {
						const matches = trends.data.trends
							.map((t: any) => (t.topic ?? t.name ?? "").toLowerCase())
							.filter((t: string) => t.startsWith(q))
							.slice(0, limit)
						if (matches.length) return matches
					}

					// Fallback: search recent posts with #prefix*
					const res = await agent.app.bsky.feed.searchPosts({
						q: `#${q}*`,
						limit: 50,
						sort: "latest",
					})

					const tags = new Set<string>()
					for (const post of res.data.posts ?? []) {
						const txt = (post.record as any)?.text ?? ""
						const m = txt.match(/#([\p{L}\p{N}_]+)/giu) || []
						m.forEach((tag: string) => {
							const clean = tag.slice(1).toLowerCase()
							if (clean.startsWith(q)) tags.add(clean)
						})
					}
					return Array.from(tags).slice(0, limit)
				} catch (err) {
					console.error("suggestHashtags failed:", err)
					return []
				}
			}, 300),
		[agent]
	)

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

export function useSuggestions() {
	const ctx = useContext(SuggestionContext)
	if (!ctx) throw new Error("useSuggestions must be used inside SuggestionProvider")
	return ctx
}