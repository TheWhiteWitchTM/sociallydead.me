"use client"

import {Bug } from "lucide-react";
import {useBluesky} from "@/lib/bluesky-context";
import {getSociallyDeadRecord} from "@/lib/sociallydead-me";

export default function Debug() {
	const blueSky = useBluesky();
	const agent = blueSky.agent;
	const user = blueSky.user
	let record = null;
	if (agent) {
		record = getSociallyDeadRecord(agent).then((res) => {return res?.value})
	}
	const out = JSON.stringify(record)
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
				<p>
					{record ? "Record found" : "No record found!"}
					{record &&
						<>
						<h2>sociallydead.me record:</h2>
						{out}
						</>
					}
				</p>
			</div>
		</div>
	)
}