"use client"

import { useEffect, useState } from "react";
import { Bug } from "lucide-react";
import { useBluesky } from "@/lib/bluesky-context";
import { Agent } from "@atproto/api";
import { createSociallyDeadRecord, getSociallyDeadRecord } from "@/lib/sociallydead-me";

export default function Debug() {
	const { getAgent } = useBluesky();
	const [agent, setAgent] = useState<Agent | undefined>(undefined);
	const [recordStatus, setRecordStatus] = useState<string>("Loading agent...");

	useEffect(() => {
		let isMounted = true;

		const loadAgentAndRecord = async () => {
			try {
				const currentAgent = getAgent();
				if (!currentAgent) {
					// Agent not ready yet → retry after delay (or listen for context change if possible)
					setRecordStatus("Waiting for agent...");
					const timer = setTimeout(() => {
						if (isMounted) loadAgentAndRecord(); // retry
					}, 1000); // adjust delay as needed (or use a context event if your provider emits one)
					return () => clearTimeout(timer);
				}

				if (isMounted) {
					setAgent(currentAgent);
					setRecordStatus("Agent loaded. Checking record...");

					const rec = await getSociallyDeadRecord(currentAgent);
					console.log("GET RECORD RESPONSE:", rec); // Check console for uri / cid / value!

					if (rec?.value && Object.keys(rec.value).length > 0) {
						setRecordStatus(`DATA FOUND! ${JSON.stringify(rec.value, null, 2)}`);
					} else {
						setRecordStatus("No useful data in record → creating new one...");
						const freshData = {
							createdAt: new Date().toISOString(),
							mood: "socially dead as fuck",
							test: "this should show up now",
						};

						const created = await createSociallyDeadRecord(currentAgent, freshData);
						console.log("CREATE SUCCESS:", created);

						// Re-fetch to verify
						const freshRec = await getSociallyDeadRecord(currentAgent);
						setRecordStatus(`Record created/set! Value: ${JSON.stringify(freshRec?.value, null, 2)}`);
					}
				}
			} catch (err: any) {
				console.error("ERROR IN LOAD:", err);
				setRecordStatus(`Error: ${err.message || "Failed to load/record"}`);
			}
		};

		loadAgentAndRecord();

		return () => { isMounted = false; };
	}, []); // Still empty deps – or add getAgent if it's stable

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
				<h2>Agent DID: {agent?.assertDid || "Not loaded yet"}</h2>
				<p className="font-mono whitespace-pre-wrap break-words">{recordStatus}</p>
				<p className="text-sm text-muted-foreground mt-4">
					Check browser console (F12) for full response logs. If agent never loads, check your Bluesky context/provider setup (login/session resume).
				</p>
			</main>
		</div>
	);
}