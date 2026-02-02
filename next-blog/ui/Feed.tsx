"use client"

import * as React from 'react'
import { BlogHeader } from './BlogHeader'
import { BlogPost } from './BlogPost'
import type { PostMeta } from '@/next-blog/types/blog'
import {postsMeta} from "@/next-blog/meta/posts-meta";
import {Suspense} from "react";

interface FeedProps {
	category?: string
}

export function Feed({ category }: FeedProps) {
	const posts = postsMeta;
	const [filtered, setFiltered] = React.useState<PostMeta[]>(posts)

	const postsInScope = React.useMemo(() => {
		if (!category) return posts
		return posts.filter(p => p.category?.toLowerCase() === category.toLowerCase())
	}, [posts, category])

	return (
		<div className="w-full">
			<BlogHeader
				items={postsInScope}
				onFiltered={setFiltered}
			/>

			<div className="flex flex-col gap-2 max-w-4xl mx-auto w-full">
				{filtered.length === 0 ? (
					<div className="text-center text-muted-foreground py-16">
						No posts found {category ? `in category "${category}"` : ''} matching your filters...
					</div>
				) : (
					filtered.map(post => (
						<Suspense key={post.slug} fallback={"Loading---"}>
							<BlogPost key={post.slug} item={post} />
						</Suspense>
					))
				)}
			</div>
		</div>
	)
}