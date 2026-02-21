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

	const agent = useBluesky().agent
	if (!agent) throw new Error("No agent")

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
}

export async function suggestHashtags(
	prefix: string,
	limit: number = 10
): Promise<string[]> {
	if (!prefix.trim()) return []

	const lowerPrefix = prefix.toLowerCase().trim()
	const agent = useBluesky().agent
	if (!agent) throw new Error("No agent")

	try {
		// Attempt richer trends endpoint first
		const trendsRes = await (agent as any).app.bsky.unspecced.getTrends({}).catch(
			() => null
		)

		if (trendsRes?.data?.trends?.length || trendsRes?.data?.topics?.length) {
			const topics = (trendsRes.data.trends ?? [])
				.map((t: any) => t.topic ?? t.name ?? "")
				.concat(trendsRes.data.topics ?? [])
				.filter(Boolean)

			return topics
				.map((t: string) => t.toLowerCase())
				.filter((t: string) => t.startsWith(lowerPrefix))
				.slice(0, limit)
		}

		// Fallback to lightweight trending topics
		const topicsRes = await (agent as any).app.bsky.unspecced.getTrendingTopics(
			{}
		).catch(() => null)

		if (topicsRes?.data?.topics?.length) {
			return (topicsRes.data.topics as string[])
				.map((t: string) => t.toLowerCase())
				.filter((t: string) => t.startsWith(lowerPrefix))
				.slice(0, limit)
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
}