"use client"

import { useState } from "react"
import Image from "next/image"
import { ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"
import { BlueskyExternalBrowser } from "./bluesky-external-browser"

interface BlueskyExternalProps {
	uri: string
	title?: string
	description?: string
	thumb?: string
	className?: string
}

export function BlueskyExternal({
	                                uri,
	                                title,
	                                description,
	                                thumb,
	                                className = "",
                                }: BlueskyExternalProps) {
	const [open, setOpen] = useState(false)
	const domain = new URL(uri).hostname.replace(/^www\./, "")

	return (
		<>
			{/* Preview card */}
			<button
				type="button"
				onClick={() => setOpen(true)}
				className={cn(
					"mt-3 block w-full overflow-hidden rounded-xl border border-border bg-card text-left transition-colors hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-primary",
					className
				)}
			>
				{thumb && (
					<div className="relative aspect-video w-full overflow-hidden bg-muted">
						<Image
							src={thumb}
							alt={title || "Link preview"}
							fill
							className="object-cover"
							sizes="(max-width: 640px) 100vw, 500px"
						/>
					</div>
				)}

				<div className="p-3 space-y-1">
					{title && <h4 className="font-medium line-clamp-2 text-base leading-tight">{title}</h4>}
					{description && <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>}
					<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
						<ExternalLink className="h-3.5 w-3.5" />
						<span className="truncate">{domain}</span>
					</div>
				</div>
			</button>

			{/* Shared modal */}
			<BlueskyExternalBrowser
				uri={uri}
				title={title}
				open={open}
				onOpenChange={setOpen}
			/>
		</>
	)
}