"use client"

import { useEffect, useRef } from "react"
import Hls from "hls.js"

interface BlueskyVideoProps {
	playlist: string
	thumbnail?: string
	alt?: string
	aspectRatio?: {
		width: number
		height: number
	}
	className?: string
}

export function BlueskyVideo({
	                             playlist,
	                             thumbnail,
	                             alt,
	                             aspectRatio,
	                             className = "",
                             }: BlueskyVideoProps) {
	const videoRef = useRef<HTMLVideoElement>(null)

	useEffect(() => {
		const video = videoRef.current
		if (!video) return

		let hls: Hls | null = null

		if (Hls.isSupported()) {
			hls = new Hls({
				enableWorker: true,
				lowLatencyMode: false,
				backBufferLength: 90,
				maxBufferLength: 60,
				maxMaxBufferLength: 120,
			})

			hls.loadSource(playlist)
			hls.attachMedia(video)

			hls.on(Hls.Events.ERROR, (event, data) => {
				if (data.fatal) {
					switch (data.type) {
						case Hls.ErrorTypes.NETWORK_ERROR:
							hls?.startLoad()
							break
						case Hls.ErrorTypes.MEDIA_ERROR:
							hls?.recoverMediaError()
							break
					}
				}
			})
		} else if (video.canPlayType("application/vnd.apple.mpegurl")) {
			video.src = playlist
		}

		return () => {
			if (hls) hls.destroy()
		}
	}, [playlist])

	const style = aspectRatio
		? {
			aspectRatio: `${aspectRatio.width} / ${aspectRatio.height}`,
		}
		: undefined

	return (
		<div
			className={`rounded-xl overflow-hidden border border-border bg-black relative ${className}`}
			style={style}
		>
			<video
				ref={videoRef}
				controls
				preload="metadata"
				playsInline
				className="w-full h-auto max-h-[500px] object-contain"
				poster={thumbnail}
			>
				<source src={playlist} type="application/x-mpegURL" />
				Your browser does not support video playback.
			</video>

			{alt && (
				<p className="text-xs text-muted-foreground mt-1 px-2 pb-2 absolute bottom-0 left-0 right-0 bg-black/60">
					{alt}
				</p>
			)}
		</div>
	)
}