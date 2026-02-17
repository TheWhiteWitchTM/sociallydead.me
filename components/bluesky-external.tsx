"use client"

import { useState } from "react"
import Image from "next/image"
import {
	Dialog,
	DialogContent,
	DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"

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

	// Clean domain for display
	const domain = new URL(uri).hostname.replace(/^www\./, "")

	const handleOpen = (e: React.MouseEvent) => {
		e.preventDefault()
		e.stopPropagation()
		setOpen(true)
	}

	return (
		<>
			<div>Warning External Content!</div>
			{/* Preview card in feed */}
			<button
				type="button"
				onClick={handleOpen}
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
					{title && (
						<h4 className="font-medium line-clamp-2 text-base leading-tight">
							{title}
						</h4>
					)}
					{description && (
						<p className="text-sm text-muted-foreground line-clamp-2">
							{description}
						</p>
					)}
					<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
						<ExternalLink className="h-3.5 w-3.5" />
						<span className="truncate">{domain}</span>
					</div>
				</div>
			</button>

			{/* Fullscreen dialog with embedded content */}
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="max-w-screen h-screen max-h-screen w-screen border-0 bg-background p-0 sm:rounded-none">
					<div className="relative flex h-full w-full flex-col">
						{/* Header bar */}
						<div className="flex items-center justify-between border-b bg-card px-4 py-3">
							<div className="min-w-0">
								{title && (
									<h3 className="font-medium truncate">{title}</h3>
								)}
								<p className="text-xs text-muted-foreground truncate">
									{domain}
								</p>
							</div>

							<div className="flex items-center gap-2">
								{/* Optional: open in new tab button */}
								<Button
									variant="ghost"
									size="icon"
									asChild
									onClick={(e) => e.stopPropagation()}
								>
									<a href={uri} target="_blank" rel="noopener noreferrer">
										<ExternalLink className="h-5 w-5" />
										<span className="sr-only">Open in new tab</span>
									</a>
								</Button>

								<DialogClose asChild>
									<Button variant="ghost" size="icon">
										<X className="h-5 w-5" />
										<span className="sr-only">Close</span>
									</Button>
								</DialogClose>
							</div>
						</div>

						{/* Main content: iframe */}
						<div className="flex-1 relative">
							<iframe
								src={uri}
								className="absolute inset-0 w-full h-full border-0"
								allow="autoplay; fullscreen; picture-in-picture"
								sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-popups-to-escape-sandbox"
								title={title || "External content"}
								loading="lazy"
							/>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</>
	)
}