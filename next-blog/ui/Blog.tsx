// @/components/emoji-legacy/blog/Blog.tsx

'use client'

import * as React from 'react'
import { BlogHeader } from './BlogHeader'
import { BlogCategory } from './BlogCategory'
import type { CategoryMeta } from '@/next-blog/types/blog'
import { categoriesMeta } from '@/next-blog/meta/categories-meta'

interface BlogProps {
	masonry?: boolean
}

export function Blog({ masonry = true }: BlogProps) {
	const [filtered, setFiltered] = React.useState<CategoryMeta[]>(categoriesMeta)

	return (
		<div className="w-full">
			<BlogHeader
				items={categoriesMeta}
				onFiltered={setFiltered}
			/>

			{filtered.length === 0 ? (
				<p className="text-center text-muted-foreground py-12 mt-8">
					No categories match your filters...
				</p>
			) : masonry ? (
				// Masonry style (CSS multi-column) with matching breakpoints to original
				<div
					className="
            columns-1 gap-4
            md:columns-2
            lg:columns-3
            xl:columns-4
            2xl:columns-5
            mt-8
          "
				>
					{filtered.map(cat => (
						<div
							key={cat.slug}
							className="mb-4 break-inside-avoid"
						>
							<BlogCategory item={cat} />
						</div>
					))}
				</div>
			) : (
				// Original strict grid
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 mt-8">
					{filtered.map(cat => (
						<BlogCategory key={cat.slug} item={cat} />
					))}
				</div>
			)}
		</div>
	)
}