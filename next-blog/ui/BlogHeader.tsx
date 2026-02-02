// @/components/emoji-legacy/blog/BlogHeader.tsx
// SHARED HEADER – handles ALL filtering, sorting, pinned/featured priority
// Returns filtered list to parent via onFiltered callback

'use client'

import * as React from 'react'
import { Input } from '@/components/ui/input'
import {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuCheckboxItem,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu'
import { Toggle } from '@/components/ui/toggle'
import { Button } from '@/components/ui/button'
import { ChevronDownIcon } from 'lucide-react'

interface BlogHeaderProps<T> {
	items: T[]
	onFiltered: (filtered: T[]) => void
}

export function BlogHeader<T>({
	                              items,
	                              onFiltered,
                              }: BlogHeaderProps<T>) {
	const [searchQuery, setSearchQuery] = React.useState('')
	const [selectedTags, setSelectedTags] = React.useState<Set<string>>(new Set())
	const [sortBy, setSortBy] = React.useState('newest')
	const [featuredOnly, setFeaturedOnly] = React.useState(false)

	const uniqueTags = React.useMemo(() => {
		const allTags = items.flatMap((item: any) => item.tags || [])
		return Array.from(new Set(allTags)).sort()
	}, [items])

	const toggleTag = (tag: string) => {
		setSelectedTags(prev => {
			const next = new Set(prev)
			if (next.has(tag)) next.delete(tag)
			else next.add(tag)
			return next
		})
	}

	const filteredAndSorted = React.useMemo(() => {
		let result = items.filter((item: any) => {
			if (featuredOnly && !item.featured) return false

			const q = searchQuery.toLowerCase()
			if (!(
				(item.title || '').toLowerCase().includes(q) ||
				(item.description || '').toLowerCase().includes(q) ||
				(item.tags || []).some((t: string) => t.toLowerCase().includes(q))
			)) return false

			if (selectedTags.size > 0 && !(item.tags || []).some((t: string) => selectedTags.has(t))) return false

			return true
		})

		// Pinned first → featured → user sort
		result = result.sort((a: any, b: any) => {
			if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
			if (a.featured !== b.featured) return a.featured ? -1 : 1

			if (sortBy === 'alpha') return (a.title || '').localeCompare(b.title || '')

			const timeA = new Date(a.latest || a.date || 0).getTime()
			const timeB = new Date(b.latest || b.date || 0).getTime()

			if (sortBy === 'newest') return timeB - timeA
			if (sortBy === 'oldest') return timeA - timeB

			return 0
		})

		return result
	}, [items, searchQuery, selectedTags, sortBy, featuredOnly])

	React.useEffect(() => {
		onFiltered(filteredAndSorted)
	}, [filteredAndSorted, onFiltered])

	return (
		<div className="component flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-8">
			<div className="relative flex-1 min-w-0">
				<Input
					type="search"
					placeholder="Search titles, descriptions, tags..."
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					className="pl-8 pr-4 w-full"
				/>
				<span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
          🔍
        </span>
			</div>

			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="outline" className="flex items-center gap-2 whitespace-nowrap">
						🏷️ Tags <ChevronDownIcon className="h-4 w-4" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuLabel>Select Tags</DropdownMenuLabel>
					<DropdownMenuSeparator />
					{uniqueTags.map((tag) => (
						<DropdownMenuCheckboxItem
							key={tag}
							checked={selectedTags.has(tag)}
							onCheckedChange={() => toggleTag(tag)}
						>
							{tag}
						</DropdownMenuCheckboxItem>
					))}
				</DropdownMenuContent>
			</DropdownMenu>

			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="outline" className="flex items-center gap-2 whitespace-nowrap">
						📇 Sort <ChevronDownIcon className="h-4 w-4" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuRadioGroup value={sortBy} onValueChange={setSortBy}>
						<DropdownMenuRadioItem value="alpha">Alphabetical</DropdownMenuRadioItem>
						<DropdownMenuRadioItem value="newest">Newest</DropdownMenuRadioItem>
						<DropdownMenuRadioItem value="oldest">Oldest</DropdownMenuRadioItem>
					</DropdownMenuRadioGroup>
				</DropdownMenuContent>
			</DropdownMenu>

			<Toggle
				pressed={featuredOnly}
				onPressedChange={setFeaturedOnly}
				className="flex items-center gap-2 px-4 py-2 border border-input rounded-md hover:bg-accent/50"
			>
				{featuredOnly ? (
					<span className="text-yellow-500 text-xl">⭐</span>
				) : (
					<span className="text-muted-foreground text-xl">☆</span>
				)}
				<span className="text-sm font-medium">Featured Only</span>
			</Toggle>
		</div>
	)
}