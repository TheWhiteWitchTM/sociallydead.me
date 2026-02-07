"use client"

import { useEffect, useState } from "react";
import { Bug } from "lucide-react";
import { useBluesky } from "@/lib/bluesky-context";
import { Agent } from "@atproto/api";
import { createSociallyDeadRecord, getSociallyDeadRecord, updateSociallyDeadRecord } from "@/lib/sociallydead-me";

export default function Debug() {
	const { getAgent } = useBluesky();
	const [agent, setAgent] = useState<Agent | undefined>(undefined);
	const [recordStatus, setRecordStatus] = useState<string>("Loading agent...");

	useEffect(() => {
		let isMounted = true;

		const loadAndUpdateRecord = async () => {
			try {
				let currentAgent = getAgent();
				if (!currentAgent) {
					setRecordStatus("Waiting for agent (retrying...)");
					const timer = setTimeout(() => {
						if (isMounted) loadAndUpdateRecord();
					}, 1000);
					return () => clearTimeout(timer);
				}

				if (isMounted) {
					setAgent(currentAgent);
					setRecordStatus("Agent loaded (DID: " + currentAgent.assertDid + "). Checking/Updating record...");

					let rec = await getSociallyDeadRecord(currentAgent);
					console.log("INITIAL GET RECORD:", rec);

					const freshData = {
						createdAt: rec?.value?.createdAt || new Date().toISOString(),  // preserve if exists
						updatedAt: new Date().toISOString(),
						mood: "joined sociallydead.me! (updated " + new Date().toLocaleTimeString() + ")",
						verification: false,
						test: "this update should appear now",
					};

					if (rec?.value && Object.keys(rec.value).length > 0) {
						// Update existing
						setRecordStatus("Existing record found → updating...");
						const updated = await updateSociallyDeadRecord(currentAgent, freshData);
						console.log("UPDATE SUCCESS:", updated);
					} else {
						// Create new
						setRecordStatus("No useful record → creating...");
						const created = await createSociallyDeadRecord(currentAgent, freshData);
						console.log("CREATE SUCCESS:", created);
					}

					// ALWAYS re-fetch after write to confirm
					await new Promise(r => setTimeout(r, 1500)); // small delay for PDS consistency
					rec = await getSociallyDeadRecord(currentAgent);
					console.log("FINAL GET AFTER WRITE:", rec);

					if (rec?.value && Object.keys(rec.value).length > 0) {
						setRecordStatus(`SUCCESS! Current value:\n${JSON.stringify(rec.value, null, 2)}`);
					} else {
						setRecordStatus("Update ran but value still empty/missing. Check console for logs.");
					}
				}
			} catch (err: any) {
				console.error("FULL ERROR:", err);
				setRecordStatus(`Error: ${err.message || "Failed (check console)"}`);
			}
		};

		loadAndUpdateRecord();

		return () => { isMounted = false; };
	}, []);

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
				<p className="font-mono whitespace-pre-wrap break-words max-w-full">{recordStatus}</p>
				<p className="text-sm text-muted-foreground mt-4">
					Refresh page after first run to test read-only. Check browser console (F12) for "GET RECORD", "UPDATE/CREATE SUCCESS", and "FINAL GET" logs — paste them here if value still empty.
				</p>
			</main>
		</div>
	);
}