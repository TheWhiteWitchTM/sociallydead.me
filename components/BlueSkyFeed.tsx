// components/BlueSkyFeed.tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { BskyAgent } from '@atproto/api';
import BlueSkyPost from './BlueSkyPost';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface BlueSkyFeedProps {
	authorHandle?: string; // If provided, show this user's posts instead of default news
	limit?: number;        // Posts per page/load
	filter?: 'posts_with_replies' | 'posts_no_replies' | 'posts_with_media'; // Only used for author mode
}

const PUBLIC_SERVICE = 'https://public.api.bsky.app';
const DEFAULT_NEWS_FEED_URI = 'at://did:plc:kkf4naxqmweop7dv4l2iqqf5/app.bsky.feed.generator/verified-news';
const INITIAL_LIMIT = 20;

const BlueSkyFeed: React.FC<BlueSkyFeedProps> = ({
	                                                 authorHandle,
	                                                 limit = INITIAL_LIMIT,
	                                                 filter = 'posts_with_replies',
                                                 }) => {
	const isAuthorMode = !!authorHandle;
	const [posts, setPosts] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [loadingMore, setLoadingMore] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [cursor, setCursor] = useState<string | undefined>(undefined);
	const [hasMore, setHasMore] = useState(true);

	const loadContent = useCallback(
		async (nextCursor?: string) => {
			try {
				const agent = new BskyAgent({ service: PUBLIC_SERVICE });
				let response: any;

				if (isAuthorMode) {
					const params: any = {
						actor: authorHandle,
						limit,
						filter,
					};
					if (nextCursor) params.cursor = nextCursor;
					response = await agent.app.bsky.feed.getAuthorFeed(params);
					const newPosts = response.data.feed.map((item: any) => item.post);
					setPosts((prev) => (nextCursor ? [...prev, ...newPosts] : newPosts));
					setCursor(response.data.cursor);
					setHasMore(!!response.data.cursor);
				} else {
					const params: any = { feed: DEFAULT_NEWS_FEED_URI, limit };
					if (nextCursor) params.cursor = nextCursor;
					response = await agent.app.bsky.feed.getFeed(params);
					const newPosts = response.data.feed.map((item: any) => item.post);
					setPosts((prev) => (nextCursor ? [...prev, ...newPosts] : newPosts));
					setCursor(response.data.cursor);
					setHasMore(!!response.data.cursor);
				}

				setError(null);
			} catch (err: any) {
				console.error('Bluesky fetch error:', err);
				let errMsg = isAuthorMode
					? `Failed to load posts from @${authorHandle}.`
					: 'Failed to load news feed.';

				if (err?.message?.includes('resolve handle') || err?.message?.includes('not found') || err?.status === 404) {
					errMsg = isAuthorMode
						? `Profile @${authorHandle} not found or no longer exists (deleted/invalid handle).`
						: 'News feed unavailable (URI may have changed or temporary issue).';
				} else if (err?.status === 429) {
					errMsg += ' Rate limit – try again soon.';
				} else {
					errMsg += ` Error: ${err?.message || 'Check console.'}`;
				}

				setError(errMsg);
			}
		},
		[authorHandle, limit, filter, isAuthorMode]
	);

	// Initial load
	useEffect(() => {
		setLoading(true);
		loadContent().finally(() => setLoading(false));
	}, [loadContent]);

	// Infinite scroll
	const observerRef = useRef<IntersectionObserver | null>(null);
	const lastElementRef = useCallback(
		(node: HTMLElement | null) => {
			if (loadingMore) return;
			if (observerRef.current) observerRef.current.disconnect();

			observerRef.current = new IntersectionObserver((entries) => {
				if (entries[0].isIntersecting && hasMore && !loadingMore) {
					setLoadingMore(true);
					loadContent(cursor).finally(() => setLoadingMore(false));
				}
			});

			if (node) observerRef.current.observe(node);
		},
		[hasMore, loadingMore, cursor, loadContent]
	);

	useEffect(() => {
		return () => {
			if (observerRef.current) observerRef.current.disconnect();
		};
	}, []);

	if (loading) {
		return (
			<div className="space-y-6 p-4 max-w-4xl mx-auto">
				{Array.from({ length: 6 }).map((_, i) => (
					<Skeleton key={i} className="h-72 w-full rounded-xl" />
				))}
			</div>
		);
	}

	return (
		<div className="space-y-6 p-4 max-w-4xl mx-auto">
			{error ? (
				<Alert variant="destructive" className="max-w-2xl mx-auto my-8">
					<AlertTitle>Feed load error</AlertTitle>
					<AlertDescription>{error}</AlertDescription>
					<p className="mt-2 text-sm">
						{isAuthorMode ? (
							<>Check <a href={`https://bsky.app/profile/${authorHandle}`} target="_blank" rel="noopener noreferrer" className="underline">bsky.app/profile/{authorHandle}</a> or try without authorHandle for news.</>
						) : (
							'Try refreshing or check Bluesky status.'
						)}
					</p>
				</Alert>
			) : posts.length === 0 ? (
				<p className="text-center text-muted-foreground my-12">
					{isAuthorMode
						? `No public posts from @${authorHandle} (private/empty/restricted).`
						: 'No recent news posts right now.'}
				</p>
			) : (
				<>
					{posts.map((post, index) => {
						const isLast = index === posts.length - 1;
						return (
							<div key={post.uri} ref={isLast ? lastElementRef : null}>
								<BlueSkyPost post={post} />
							</div>
						);
					})}

					{loadingMore && (
						<div className="space-y-6 pt-4">
							{Array.from({ length: 3 }).map((_, i) => (
								<Skeleton key={`more-${i}`} className="h-72 w-full rounded-xl" />
							))}
						</div>
					)}

					{!hasMore && posts.length > 0 && (
						<p className="text-center text-muted-foreground py-8">
							End of feed.
						</p>
					)}
				</>
			)}
		</div>
	);
};

export default BlueSkyFeed;