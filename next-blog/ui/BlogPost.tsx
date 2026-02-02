"use client"

import * as React from 'react'
import { toast } from "sonner"
import { Button } from '@/components/ui/button'
import { StarIcon, ShareIcon, ChevronDownIcon, ChevronUpIcon } from 'lucide-react'
import { DateDisplay } from './DateDisplay'
import type { PostMeta } from '@/next-blog/types/blog'
import {NewIndicator} from "@/next-blog/ui/NewIndicator";
import {useState, useEffect, Suspense} from "react";
import Link from "next/link";
import {BlogPostMDX} from "@/next-blog/ui/BlogPostMDX";
import {ErrorBoundary} from "next/dist/client/components/error-boundary";

interface BlogPostProps {
	item: PostMeta
}

export function BlogPost({ item }: BlogPostProps) {
	const copyLink = (path: string) => {
		if (!path) return
		const url = `${window.location.origin}${path}`
		navigator.clipboard.writeText(url)
		toast.success("Link copied! 🪄", {
			description: "The link is now in your clipboard.",
			duration: 3000,
		})
	}

	const id = "post-"+item.slug
	const isLong = !!item.long
	const excerptHtml = item.excerpt || item.description || ''
	const [scroll, setScroll] = useState(false)
	const [expanded, setExpanded] = useState(!!item.expanded)

	useEffect(() => {
		if (scroll) {
			setTimeout(() => {
				window.location.hash = "#"+id
			}, 100);
		}

	}, [scroll]);

	return (
		<div
			id={id}
			key={id}
			className="component !p-2 !my-2 [scroll-margin-top: 5rem] [overflow-anchor:none] flex flex-col"
		>
			<div className="flex flex-row items-center justify-between">
				<div className="flex items-center gap-3">
					{item.featured && <StarIcon className="text-yellow-500 fill-yellow-500" />}
					<span className="text-2xl">{item.emoji || '📝'}</span>
					<h2 className="font-bold text-lg line-clamp-2">{item.title}</h2>
					<NewIndicator
						className={"ml-5 mt-1 self-start shrink-0"}
						date={item.date ?? ''}
					/>
				</div>
			</div>
			<div>
				<div className={"prose dark:prose-invert"}>
					<span
					className={expanded?"hidden":""}
					dangerouslySetInnerHTML={{ __html: excerptHtml }}
					/>
					<span className={expanded?"":"hidden"}>
						{expanded &&
							<Suspense key={id} fallback={"Loading---"}>
								<BlogPostMDX slug={item.slug}/>
							</Suspense>
						}
					</span>
				</div>
			</div>
			<div className="flex flex-col sm:flex-row justify-between items-center text-sm text-muted-foreground pt-2 border-t gap-4">
				<DateDisplay date={item.date ?? ''} />
				{isLong && (
					<Button
						variant={"ghost"}
						className={expanded?"bg-primary":"bg-red-600"}
						onClick = {exp => {
							setExpanded(!expanded)
							{expanded
									? setScroll(true)
									: setScroll(false)
							}
						}}
					>
						<Link href={"#"} id={id} scroll={true}>
							{expanded ? '↑ Show Less ↑' : '↓ Read More ↓'}
						</Link>
					</Button>
				)}
				<Button
					variant="ghost"
					size="icon"
					onClick={() => copyLink(item.path ?? '')}
					className="shrink-0"
				>
					<ShareIcon className="h-4 w-4" />
				</Button>
			</div>
			<span className={"mb-3"}/>
		</div>
	)
}