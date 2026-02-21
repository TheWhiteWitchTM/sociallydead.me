"use client"

import { useState, useRef, useEffect } from "react"
import {
	Dialog,
	DialogContent,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X, Maximize, Minimize } from "lucide-react"
import { cn } from "@/lib/utils"

interface BlueskyExternalBrowserProps {
	uri: string
	title?: string
	open: boolean
	onOpenChange: (open: boolean) => void
}

export function BlueskyExternalBrowser({
	                                       uri,
	                                       title,
	                                       open,
	                                       onOpenChange,
                                       }: BlueskyExternalBrowserProps) {
	const [isFullscreen, setIsFullscreen] = useState(false)
	const containerRef = useRef<HTMLDivElement>(null)

	// Fullscreen listener
	useEffect(() => {
		const handleFullscreenChange = () => {
			setIsFullscreen(!!document.fullscreenElement)
		}
		document.addEventListener("fullscreenchange", handleFullscreenChange)
		return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
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

	const domain = new URL(uri).hostname.replace(/^www\./, "")

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="h-[95vh] w-[95vw] max-w-none max-h-none p-0 border-0 bg-background sm:rounded-xl overflow-hidden">
				<div ref={containerRef} className="relative flex h-full w-full flex-col">
					{/* Top-right controls */}
					<div className="absolute top-3 right-3 z-50 flex items-center gap-2 pointer-events-auto">
						<Button
							variant="secondary"
							size="icon"
							className="h-10 w-10 rounded-full bg-black/60 text-white hover:bg-black/80 backdrop-blur-sm border border-white/20 shadow-lg"
							onClick={toggleFullscreen}
						>
							{isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
							<span className="sr-only">{isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}</span>
						</Button>

						<Button
							variant="secondary"
							size="icon"
							className="h-10 w-10 rounded-full bg-black/60 text-white hover:bg-black/80 backdrop-blur-sm border border-white/20 shadow-lg"
							onClick={() => onOpenChange(false)}
						>
							<X className="h-5 w-5" />
							<span className="sr-only">Close</span>
						</Button>
					</div>

					{/* Iframe – main content */}
					<div className="flex-1 relative bg-black">
						<iframe
							src={uri}
							className="absolute inset-0 w-full h-full border-0"
							allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
							sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
							title={title || "External content"}
							loading="lazy"
							referrerPolicy="no-referrer"
						/>
					</div>

					{/* Bottom info bar */}
					<div className="absolute bottom-3 left-3 right-3 z-40 pointer-events-none">
						<div className="inline-flex max-w-[80%] items-center gap-2 rounded-lg bg-black/60 px-3 py-1.5 text-sm text-white backdrop-blur-sm">
							{title && <span className="font-medium truncate">{title}</span>}
							<span className="text-xs opacity-80 truncate">{domain}</span>
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	)
}