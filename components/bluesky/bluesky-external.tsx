"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import {
	Dialog,
	DialogContent,
	DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X, Maximize, Minimize, ExternalLink } from "lucide-react"
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
	const [isFullscreen, setIsFullscreen] = useState(false)
	const iframeRef = useRef<HTMLIFrameElement>(null)
	const containerRef = useRef<HTMLDivElement>(null)

	const domain = new URL(uri).hostname.replace(/^www\./, "")

	// Listen for fullscreen changes
	useEffect(() => {
		const handleFullscreenChange = () => {
			setIsFullscreen(!!document.fullscreenElement)
		}

		document.addEventListener("fullscreenchange", handleFullscreenChange)
		return () => {
			document.removeEventListener("fullscreenchange", handleFullscreenChange)
		}
	}, [])

	const toggleFullscreen = async () => {
		if (!containerRef.current) return

		try {
			if (!isFullscreen) {
				await containerRef.current.requestFullscreen()
			} else {
				await document.exitFullscreen()
			}
		} catch (err) {
			console.error("Fullscreen error:", err)
		}
	}

	return (
		<>
			{/* Preview card in feed – unchanged */}
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

			{/* Dialog with fullscreen support */}
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="h-[95vh] w-[95vw] max-w-none max-h-none p-0 border-0 bg-background sm:rounded-xl overflow-hidden">
					<div ref={containerRef} className="relative flex h-full w-full flex-col">
						{/* Controls – always visible in top-right */}
						<div className="absolute top-3 right-3 z-50 flex items-center gap-2 pointer-events-auto">
							{/* Fullscreen toggle */}
							<Button
								variant="secondary"
								size="icon"
								className="h-10 w-10 rounded-full bg-black/60 text-white hover:bg-black/80 backdrop-blur-sm border border-white/20 shadow-lg"
								onClick={toggleFullscreen}
							>
								{isFullscreen ? (
									<Minimize className="h-5 w-5" />
								) : (
									<Maximize className="h-5 w-5" />
								)}
								<span className="sr-only">
                  {isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                </span>
							</Button>

							{/* Close */}
							<DialogClose asChild>
								<Button
									variant="secondary"
									size="icon"
									className="h-10 w-10 rounded-full bg-black/60 text-white hover:bg-black/80 backdrop-blur-sm border border-white/20 shadow-lg"
								>
									<X className="h-5 w-5" />
									<span className="sr-only">Close</span>
								</Button>
							</DialogClose>
						</div>

						{/* Iframe takes full space */}
						<div className="flex-1 relative bg-black">
							<iframe
								ref={iframeRef}
								src={uri}
								className="absolute inset-0 w-full h-full border-0"
								allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
								sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
								title={title || "External content"}
								loading="lazy"
								referrerPolicy="no-referrer"
							/>
						</div>

						{/* Optional bottom info (non-intrusive) */}
						<div className="absolute bottom-3 left-3 right-3 z-40 pointer-events-none">
							<div className="inline-flex max-w-[80%] items-center gap-2 rounded-lg bg-black/60 px-3 py-1.5 text-sm text-white backdrop-blur-sm">
								{title && <span className="font-medium truncate">{title}</span>}
								<span className="text-xs opacity-80 truncate">{domain}</span>
							</div>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</>
	)
}