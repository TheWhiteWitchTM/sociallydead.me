"use client"

import {useEffect, useState} from "react";
import {Bug} from "lucide-react";
import {useBluesky} from "@/lib/bluesky-context";
import {getSociallyDeadRecord} from "@/lib/sociallydead-me";
import {Agent} from "@atproto/api";

export default function Debug() {
	const [record, setRecord] = useState("No record!");
	const {getAgent} = useBluesky()

	async function debugInfo () {
		const agent =  getAgent();
		if (agent) {
			setRecord("OK")
		}

		return(
			<div>
				<p>
					<h2>Agent: {agent?.did}</h2>
				</p>
				<p>
					<h3>Record:</h3>
					{record}
				</p>
			</div>
		)
	}

	// @ts-ignore
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
			<main>
				{getAgent()
					? debugInfo()
					: <div>No Agent!</div>
				}
			</main>
		</div>
	)
}