// useBlueskySuggestions.tsx
"use client"

import { useBluesky } from "@/lib/bluesky-context"

interface HandleSuggestion {
	handle: string
	displayName?: string
	avatar?: string
	did: string
}

export async function suggestHandles(
	prefix: string,
	limit: number = 8
): Promise<HandleSuggestion[]> {
	if (!prefix.trim()) return []

	// Inner async IIFE — hook is called ONLY when this function is actually invoked from client React code
	return (async () => {
		const { getAgent } = useBluesky()   // ← safe here if caller is in render/hook phase
		const agent = getAgent()
		if (!agent) {
			console.warn("[suggestHandles] No agent — likely called too early or not logged in")
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
	})()
}

// Exactly the same pattern for suggestHashtags
export async function suggestHashtags(
	prefix: string,
	limit: number = 10
): Promise<string[]> {
	if (!prefix.trim()) return []

	return (async () => {
		const { getAgent } = useBluesky()
		const agent = getAgent()
		if (!agent) {
			console.warn("[suggestHashtags] No agent")
			return []
		}

		const lowerPrefix = prefix.toLowerCase().trim()

		try {
			// your full original logic here (trends → trendingTopics → searchPosts fallback)
			// ... paste it unchanged, just using the agent from above ...

			// example snippet:
			const trendsRes = await (agent as any).app.bsky.unspecced.getTrends({}).catch(() => null)
			if (trendsRes?.data?.trends?.length || trendsRes?.data?.topics?.length) {
				// ... your filtering ...
			}
			// ... rest of fallbacks ...

			return [] // fallback empty
		} catch (err) {
			console.error("[suggestHashtags] Failed:", err)
			return []
		}
	})()
}