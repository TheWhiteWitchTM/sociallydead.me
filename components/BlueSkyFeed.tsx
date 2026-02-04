'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { BskyAgent } from '@atproto/api';
import BlueSkyPost from './BlueSkyPost';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface BlueSkyFeedProps {
	feedUri?: string;              // ← the only way to specify a feed now
	authorHandle?: string;
	limit?: number;
	filter?: 'posts_with_replies' | 'posts_no_replies' | 'posts_with_media' | 'posts_and_author_threads' | 'posts_with_video';
	skipOldPinned?: boolean;
	englishOnly?: boolean;
}

const PUBLIC_SERVICE = 'https://public.api.bsky.app';
const INITIAL_LIMIT = 20;
// You can change or remove this fallback completely
const FALLBACK_URI = 'at://did:plc:kkf4naxqmweop7dv4l2iqqf5/app.bsky.feed.generator/verified-news';

const BlueSkyFeed: React.FC<BlueSkyFeedProps> = ({
	                                                 feedUri,
	                                                 authorHandle,
	                                                 limit = INITIAL_LIMIT,
	                                                 filter = 'posts_with_replies',
	                                                 skipOldPinned = true,
	                                                 englishOnly = true,
                                                 }) => {
	const isAuthorMode = !feedUri && !!authorHandle;
	const effectiveFeedUri = feedUri || (!isAuthorMode ? FALLBACK_URI : undefined);

	const [posts, setPosts] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [loadingMore, setLoadingMore] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [cursor, setCursor] = useState<string | undefined>(undefined);
	const [hasMore, setHasMore] = useState(true);

	const loadContent = useCallback(
		async (nextCursor?: string) => {
			if (!effectiveFeedUri && !isAuthorMode) {
				setError('Provide feedUri or authorHandle.');
				setLoading(false);
				return;
			}

			try {
				const agent = new BskyAgent({ service: PUBLIC_SERVICE });
				let response: any;

				if (isAuthorMode) {
					const params: any = { actor: authorHandle, limit, filter };
					if (nextCursor) params.cursor = nextCursor;
					response = await agent.app.bsky.feed.getAuthorFeed(params);
				} else {
					const params: any = { feed: effectiveFeedUri, limit };
					if (nextCursor) params.cursor = nextCursor;
					response = await agent.app.bsky.feed.getFeed(params);
				}

				let newPosts = response.data.feed.map((item: any) => item.post);

				if (skipOldPinned && !isAuthorMode) {
					const now = new Date();
					const cutoffDays = 7;
					const cutoffDate = new Date(now.getTime() - cutoffDays * 24 * 60 * 60 * 1000);
					newPosts = newPosts.filter((post: any) => {
						const createdAt = post.record?.createdAt || post.createdAt;
						return !createdAt || new Date(createdAt) >= cutoffDate;
					});
				}

				if (englishOnly && !isAuthorMode) {
					newPosts = newPosts.filter((post: any) => {
						const langs = post.record?.langs || [];
						const hasEnglish = langs.some((l: string) => l.toLowerCase().startsWith('en'));
						const noNonEnglish = !langs.some((l: string) => !l.toLowerCase().startsWith('en') && l !== '');
						return (langs.length === 0 || hasEnglish) && noNonEnglish;
					});
				}

				setPosts((prev) => (nextCursor ? [...prev, ...newPosts] : newPosts));
				setCursor(response.data.cursor);
				setHasMore(!!response.data.cursor);
				setError(null);
			} catch (err: any) {
				console.error('Bluesky error:', err);
				setError(`Load failed: ${err?.message || err?.status || 'unknown'}`);
			} finally {
				setLoading(false);
				setLoadingMore(false);
			}
		},
		[effectiveFeedUri, authorHandle, limit, filter, isAuthorMode, skipOldPinned, englishOnly]
	);

	useEffect(() => {
		setLoading(true);
		loadContent();
	}, [loadContent]);

	const observerRef = useRef<IntersectionObserver | null>(null);
	const lastElementRef = useCallback(
		(node: HTMLElement | null) => {
			if (loadingMore || !hasMore) return;
			if (observerRef.current) observerRef.current.disconnect();
			observerRef.current = new IntersectionObserver((entries) => {
				if (entries[0].isIntersecting && hasMore && !loadingMore) {
					setLoadingMore(true);
					loadContent(cursor);
				}
			});
			if (node) observerRef.current.observe(node);
		},
		[hasMore, loadingMore, cursor, loadContent]
	);

	useEffect(() => () => observerRef.current?.disconnect(), []);

	if (loading) return <div className="space-y-6 p-4 max-w-4xl mx-auto">{Array(6).fill(0).map((_,i) => <Skeleton key={i} className="h-72 w-full rounded-xl" />)}</div>;

	return (
		<div className="space-y-6 p-4 max-w-4xl mx-auto">
			{error ? (
				<Alert variant="destructive">
					<AlertTitle>Error</AlertTitle>
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			) : posts.length === 0 ? (
				<p className="text-center text-muted-foreground my-12">No posts after filters (try englishOnly=false or different feedUri)</p>
			) : (
				<>
					{posts.map((post, idx) => (
						<div key={post.uri} ref={idx === posts.length - 1 ? lastElementRef : null}>
							<BlueSkyPost post={post} />
						</div>
					))}
					{loadingMore && Array(3).fill(0).map((_,i) => <Skeleton key={`more-${i}`} className="h-72 w-full rounded-xl" />)}
					{!hasMore && <p className="text-center text-muted-foreground py-8">End of feed.</p>}
				</>
			)}
		</div>
	);
};

export default BlueSkyFeed;