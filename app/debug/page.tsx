"use client";

import { useEffect, useState } from "react";
import { Bug } from "lucide-react";
import { useBluesky } from "@/lib/bluesky-context";
import {
	createSociallyDeadRecord,
	deleteSociallyDeadRecord,
	getSociallyDeadRecord,
} from "@/lib/sociallydead-me";

export default function Debug() {
	const { getAgent } = useBluesky();
	const [status, setStatus] = useState("Starting…");
	const [agent, setAgent] = useState<any>(null);

	useEffect(() => {
		const run = async () => {
			try {
				const ag = getAgent();
				if (!ag) {
					setStatus("No agent available yet");
					return;
				}

				setAgent(ag);
				setStatus("Agent loaded. Deleting old broken record…");

				await deleteSociallyDeadRecord(ag);

				setStatus("Old record deleted. Creating fresh clean record…");

				const freshData = {
					mood: "joined sociallydead.me",
					verification: false,
					lastUpdated: new Date().toISOString(),
					// Add whatever fields you actually want — nothing else will appear
				};

				await createSociallyDeadRecord(ag, freshData);

				const rec = await getSociallyDeadRecord(ag);

				if (rec?.value) {
					setStatus(
						"SUCCESS – current record content:\n\n" +
						JSON.stringify(rec.value, null, 2)
					);
				} else {
					setStatus("Created but got empty value back – check console");
				}
			} catch (err: any) {
				console.error("FATAL:", err);
				setStatus("Error: " + (err.message || "unknown failure"));
			}
		};

		run();
	}, []);

	return (
		<div className="min-h-screen p-6">
			<header className="border-b pb-4 mb-6">
				<div className="flex items-center gap-3">
					<Bug className="h-6 w-6" />
					<h1 className="text-2xl font-bold">Debug SociallyDead Record</h1>
				</div>
			</header>

			<div>
				<h2 className="font-semibold mb-2">Agent DID:</h2>
				<code className="bg-muted px-2 py-1 rounded">
					{agent?.assertDid || "not loaded"}
				</code>
			</div>

			<div className="mt-6">
				<h2 className="font-semibold mb-2">Record status:</h2>
				<pre className="bg-muted p-4 rounded-md whitespace-pre-wrap font-mono text-sm overflow-auto max-h-96">
          {status}
        </pre>
			</div>

			<p className="text-sm text-muted-foreground mt-6">
				Open browser console (F12) to see detailed logs.
				<br />
				The field <code>test</code> can no longer survive — delete + clean create.
			</p>
		</div>
	);
}