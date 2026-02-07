"use client"

import {useEffect, useState} from "react";
import {Bug} from "lucide-react";
import {useBluesky} from "@/lib/bluesky-context";
import {getSociallyDeadRecord} from "@/lib/sociallydead-me";
import {Agent} from "@atproto/api";

export default function Debug() {
	const [state, setState] = useState("Loading!");
	const [agent, setAgent] = useState<Agent | undefined>(undefined)
	const [record, setRecord] = useState("No record!");
	const [created, setCreated] = useState("Not created!");

	const {getAgent} = useBluesky()

	async function debugInfo () {
		const agent = getAgent();
		let recordString = "No data";
		if (agent) {
			const record = await getSociallyDeadRecord(agent);
			recordString = JSON.stringify(record);
		}

		return(
			<div>
				<p>
					<h2>Agent: {agent?.did}</h2>
				</p>
				<p>
					<h3>Record</h3>
					{recordString}
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