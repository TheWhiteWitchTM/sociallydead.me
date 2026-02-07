"use client"

import { useEffect, useState } from "react";
import { Bug } from "lucide-react";
import { useBluesky } from "@/lib/bluesky-context";
import { Agent } from "@atproto/api";
import { createSociallyDeadRecord, getSociallyDeadRecord } from "@/lib/sociallydead-me";

export default function Debug() {
	const { getAgent } = useBluesky();
	const [agent, setAgent] = useState<Agent | undefined>(undefined);
	const [recordStatus, setRecordStatus] = useState<string>("Loading...");

	useEffect(() => {
		const agent = getAgent();
		if (!agent) {
			setRecordStatus("No agent available");
			return;
		}

		setAgent(agent);

		const init = async () => {
			try {
				const rec = await getSociallyDeadRecord(agent);

				console.log("GET RECORD FULL RESPONSE:", rec); // ← check this in console!

				if (rec?.value && Object.keys(rec.value).length > 0) {
					setRecordStatus("DATA FOUND! → " + JSON.stringify(rec.value));
				} else {
					// Value empty → force create/overwrite with clean data
					setRecordStatus("No useful data → creating fresh record...");
					const freshData = {
						createdAt: new Date().toISOString(),
						mood: "socially dead since " + new Date().toLocaleString(),
						test: "this should appear",
					};

					const created = await createSociallyDeadRecord(agent, freshData);
					console.log("CREATE SUCCESS:", created);

					// Optional: re-fetch to confirm
					const freshRec = await getSociallyDeadRecord(agent);
					setRecordStatus("Record set! Value now: " + JSON.stringify(freshRec?.value));
				}
			} catch (err: any) {
				console.error("FULL ERROR:", err);
				setRecordStatus("Error: " + (err.message || "Unknown failure"));
			}
		};

		init();
	}, []); // add deps if needed, e.g. [getAgent]

	return (
		<div className="min-h-screen">
			<header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
				<div className="flex h-14 items-center justify-between px-4">
					<div className="flex items-center gap-2">
						<Bug className="h-5 w-5" />
						<h1 className="text-xl font-bold">Debug</h1>
					</div>
				</div>
			</header>
			<main className="p-4">
				<h2>Agent DID: {agent?.assertDid || "Not loaded"}</h2>
				<p className="font-mono whitespace-pre-wrap">{recordStatus}</p>
				<p className="text-sm text-muted-foreground mt-4">
					Open browser console (F12) to see full logs / response objects.
				</p>
			</main>
		</div>
	);
}