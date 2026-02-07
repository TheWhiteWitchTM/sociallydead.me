"use client"

import {Bug } from "lucide-react";
import {useBluesky} from "@/lib/bluesky-context";

export default function Debug() {
	const blueSky = useBluesky();
	const agent = blueSky.agent;
	return(
		<div className="min-h-screen">
			<header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
				<div className="flex h-14 items-center justify-between px-4">
					<div className="flex items-center gap-2">
						<Bug className="h-5 w-5" />
						<h1 className="text-xl font-bold">Debug</h1>
					</div>
				</div>
			</header>
			<div>
				{agent?.did}<br/>
			</div>
		</div>
	)
}