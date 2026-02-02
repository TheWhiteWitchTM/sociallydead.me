// @/components/emoji-legacy/blog/BlogCategory.tsx

import * as React from 'react';
import { toast } from "sonner";  // ← this is the new import
import { Button } from '@/components/ui/button';
import { StarIcon, ShareIcon } from 'lucide-react';
import { DateDisplay } from './DateDisplay';
import type {CategoryMetaBase} from '@/next-blog/types/blog';
import Link from "next/link";
import {NewIndicator} from "@/next-blog/ui/NewIndicator";
import {Card} from "@/emoji-ui/ui/Card";

interface BlogCategoryProps {
	item: CategoryMetaBase;
}

export function BlogCategory({ item }: BlogCategoryProps) {
	const copyLink = (path: string) => {
		if (!path) return;

		const url = `${window.location.origin}${path}`;
		navigator.clipboard.writeText(url);

		toast.success("Link copied! 🪄", {
			description: "The link is now in your clipboard.",
			duration: 3000,
			// You can add more options: position: "bottom-center", action: { label: "Undo", onClick: ... }
		});
	};

	return (
		<Card className="component flex flex-col">
			<Link
				href={item.path}
				className="

    block               // makes it full-width like a div
    no-underline        // text-decoration: none
    text-inherit        // color inherits from parent (no blue/purple)
    visited:text-inherit // same for visited state
    hover:text-inherit  // prevent color change on hover
    focus-visible:outline-none"
			>
			<div className="w-full flex flex-row items-center justify-between">
				<div className="flex items-center gap-1">
					{item.featured && <StarIcon className="h-5 w-5 text-yellow-500 fill-yellow-500" />}
					<span className="text-2xl">{item.emoji}</span>
					<h2 className="font-bold text-lg line-clamp-2">{item.title}</h2>
					<NewIndicator
						className={"ml-5 mt-1 self-start shrink-0"}
						date={item.latest ?? ''}
					/>
				</div>
			</div>
			<div className="flex-grow">
				<p className="text-muted-foreground line-clamp-3">
					{item.description}
				</p>
			</div>
			</Link>
			<div className="flex justify-between items-center text-sm text-muted-foreground pt-1">
				<DateDisplay date={item.date ?? ''} />
				<Button
					variant="ghost"
					size="icon"
					onClick={(e) => {
						e.stopPropagation()
						copyLink(item.path ?? '')
					}}
					className="shrink-0"
				>
					<ShareIcon className="h-4 w-4" />
				</Button>
			</div>
		</Card>
	);
}