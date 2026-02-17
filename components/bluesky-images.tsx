"use client"

import Image from "next/image"
import { useState } from "react"
import {
	Dialog,
	DialogContent,
	DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface BlueskyImage {
	thumb: string          // thumbnail URL (smaller/preview)
	fullsize: string       // high-res full image URL
	alt: string            // accessibility text
	// You can add width/height if available from embed.aspectRatio
}

interface BlueskyImagesProps {
	images: BlueskyImage[]
	className?: string
}

export function BlueskyImages({ images, className }: BlueskyImagesProps) {
	const [open, setOpen] = useState(false)
	const [selectedImage, setSelectedImage] = useState<BlueskyImage | null>(null)

	if (!images?.length) return null

	const count = images.length

	// Responsive grid classes like Bluesky / common patterns
	const gridClasses = cn(
		"mt-3 grid gap-2",
		count === 1 && "grid-cols-1",
		count === 2 && "grid-cols-2",
		count === 3 && "grid-cols-2 sm:grid-cols-3",
		count >= 4 && "grid-cols-2 sm:grid-cols-3 md:grid-cols-4",
	)

	const handleOpen = (img: BlueskyImage) => {
		setSelectedImage(img)
		setOpen(true)
	}

	return (
		<>
			<div className={cn(gridClasses, className)}>
				{images.map((img, idx) => (
					<button
						key={idx}
						type="button"
						onClick={() => handleOpen(img)}
						className="group relative overflow-hidden rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
					>
						<div className="aspect-[4/3] sm:aspect-square overflow-hidden bg-muted">
							<Image
								src={img.thumb}
								alt={img.alt || "Post image"}
								fill
								className="object-cover transition-transform duration-300 group-hover:scale-105"
								sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
								priority={idx === 0} // Load first image eagerly
							/>
						</div>
						{img.alt && (
							<span className="sr-only">{img.alt}</span>
						)}
					</button>
				))}
			</div>

			{/* Fullscreen dialog */}
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="max-w-screen h-screen max-h-screen w-screen border-0 bg-black/95 p-0 sm:rounded-none">
					<div className="relative flex h-full w-full items-center justify-center">
						{selectedImage && (
							<Image
								src={selectedImage.fullsize}
								alt={selectedImage.alt || "Full size post image"}
								fill
								className="object-contain"
								sizes="100vw"
								priority
								quality={90}
							/>
						)}

						{/* Close button - top right */}
						<DialogClose asChild>
							<Button
								variant="ghost"
								size="icon"
								className="absolute right-4 top-4 z-50 rounded-full bg-black/50 text-white hover:bg-black/70"
							>
								<X className="h-6 w-6" />
								<span className="sr-only">Close</span>
							</Button>
						</DialogClose>
					</div>
				</DialogContent>
			</Dialog>
		</>
	)
}