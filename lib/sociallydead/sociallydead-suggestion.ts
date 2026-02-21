// @/lib/sociallydead/sociallydead-suggestion.ts

import { getSociallyDeadAgent } from './sociallydead-agent';

interface HandleSuggestion {
	handle: string;
	displayName?: string;
	avatar?: string;
	did: string;
}

export async function suggestHandles(
	prefix: string,
	limit: number = 8
): Promise<HandleSuggestion[]> {
	if (!prefix.trim()) return [];

	try {
		const agent = await getSociallyDeadAgent();

		const res = await agent.searchActorsTypeahead({
			term: prefix.trim(),
			limit: Math.min(limit, 30),
		});

		// res.data.actors is Actor[] but we map to safe shape
		return (res.data.actors ?? []).map((actor: any) => ({
			handle: actor.handle ?? '',
			displayName: actor.displayName,
			avatar: actor.avatar,
			did: actor.did ?? '',
		}));
	} catch (err) {
		console.error('[suggestHandles] Failed:', err);
		return [];
	}
}

export async function suggestHashtags(
	prefix: string,
	limit: number = 10
): Promise<string[]> {
	if (!prefix.trim()) return [];

	const lowerPrefix = prefix.toLowerCase().trim();

	try {
		const agent = await getSociallyDeadAgent();

		// unspecced endpoints are not typed → use any + guard
		const trendsRes = await (agent as any).app.bsky.unspecced.getTrends({}).catch(() => null);

		if (trendsRes?.data?.topics?.length) {
			return (trendsRes.data.topics as any[])
				.map((t: any) => (t.topic ?? '').toLowerCase())
				.filter((t: string) => t.startsWith(lowerPrefix))
				.slice(0, limit);
		}

		// fallback: search recent posts
		const searchRes = await agent.app.bsky.feed.searchPosts({
			q: `#${lowerPrefix}`,
			limit: 50,
		}).catch(() => null);

		if (searchRes?.data?.posts?.length) {
			const tags = new Set<string>();

			for (const post of searchRes.data.posts) {
				const text = (post.record as any)?.text || '';
				const matches = text.match(/#([a-zA-Z0-9_]+)/gi) || [];
				matches.forEach((m: string) => {
					const tag = m.slice(1).toLowerCase();
					if (tag.startsWith(lowerPrefix)) tags.add(tag);
				});
			}

			return Array.from(tags).slice(0, limit);
		}

		return [];
	} catch (err) {
		console.error('[suggestHashtags] Failed:', err);
		return [];
	}
}