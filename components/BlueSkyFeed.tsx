// components/BlueSkyFeed.tsx  (updated version)
'use client'; // If using Next.js App Router client component

import { useState, useEffect } from 'react';
import { BskyAgent } from '@atproto/api';
import BlueSkyPost from './BlueSkyPost'; // Your existing post renderer
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface BlueSkyFeedProps {
	feedUri?: string;
	limit?: number;
}

const PUBLIC_SERVICE = 'https://public.api.bsky.app';

// Stable verified news feed – confirmed active and public in 2026
const DEFAULT_NEWS_FEED_URI =
	'at://did:plc:kkf4naxqmweop7dv4l2iqqf5/app.bsky.feed.generator/verified-news';

const BlueSkyFeed: React.FC<BlueSkyFeedProps> = ({
	                                                 feedUri = DEFAULT_NEWS_FEED_URI,
	                                                 limit = 20,
                                                 }) => {
	const [posts, setPosts] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchFeed = async (uri: string, attempt = 1): Promise<void> => {
		try {
			const agent = new BskyAgent({ service: PUBLIC_SERVICE });

			const response = await agent.app.bsky.feed.getFeed({
				feed: uri,
				limit,
			});

			const fetchedPosts = response.data.feed.map((item: any) => item.post);
			setPosts(fetchedPosts);
			setError(null);
		} catch (err: any) {
			console.error('Bluesky fetch error:', err);

			if (attempt === 1 && err?.status === 429) {
				// Retry once on rate limit
				setTimeout(() => fetchFeed(uri, 2), 2000);
				return;
			}

			let errMsg = 'Failed to load Bluesky news feed.';
			if (err?.message?.includes('429')) errMsg += ' Rate limit hit – try again soon.';
			if (err?.status === 404) errMsg += ' Feed may be unavailable or URI changed.';
			setError(errMsg + ' ' + (err?.message || 'Check console for details.'));
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		setLoading(true);
		fetchFeed(feedUri);
	}, [feedUri, limit]);

	if (loading) {
		return (
			<div className="space-y-6 p-4 max-w-4xl mx-auto">
				{Array.from({ length: Math.min(limit, 6) }).map((_, i) => (
					<Skeleton key={i} className="h-72 w-full rounded-xl" />
				))}
			</div>
		);
	}

	if (error) {
		return (
			<Alert variant="destructive" className="max-w-2xl mx-auto my-8">
				<AlertTitle>Error loading news feed</AlertTitle>
				<AlertDescription>{error}</AlertDescription>
				<p className="mt-2 text-sm">
					Tip: Refresh the page, or try a different feed URI via props.
				</p>
			</Alert>
		);
	}

	if (posts.length === 0) {
		return (
			<p className="text-center text-muted-foreground my-12">
				No recent news posts found in this feed right now.
			</p>
		);
	}

	return (
		<div className="space-y-6 p-4 max-w-4xl mx-auto">
			{posts.map((post) => (
				<BlueSkyPost key={post.uri} post={post} />
			))}
		</div>
	);
};

export default BlueSkyFeed;