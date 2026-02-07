"use client"

import {Bug } from "lucide-react";
import {useBluesky} from "@/lib/bluesky-context";
import {createSociallyDeadRecord, getSociallyDeadRecord} from "@/lib/sociallydead-me";

export default function Debug() {
	const blueSky = useBluesky();
	const agent = blueSky.agent;
	const user = blueSky.user
	let record = null;
	let create = null;
	if (agent) {
		const json = {
			lexicon: 1,
			label: "user",
			joined: new Date(),
			visits: 1,
			payment: false,
			props: [],
			highlights: [],
			articles: [],
		}
		create = createSociallyDeadRecord(agent,json)
			.then((res) => {return res?.cid})
			.catch((err) => {return "Error setting record!"})
		record = getSociallyDeadRecord(agent)
			.then((res) => {return res?.value})
			.catch((err) => {return "Error getting record!"})
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
					{create &&
						<>
							Created: {create}
						</>
					}
				</p>
			</div>
		</div>
	)
}