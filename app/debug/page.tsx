'use client';

import { useBluesky } from "@/lib/bluesky-context";
import { useEffect, useState } from "react";
import { SociallyDeadRecord, SociallyDeadRepo } from "@/lib/sociallydead-me";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, PlusCircle, ListIcon } from "lucide-react";

export default function PDSDebugPage() {
	const bluesky = useBluesky();

	const [repo, setRepo] = useState<SociallyDeadRepo | null>(null);
	const [record, setRecord] = useState<SociallyDeadRecord | null>(null);
	const [recordsList, setRecordsList] = useState<any[]>([]);
	const [status, setStatus] = useState<string>("Waiting for agent...");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState<boolean>(false);

	// Initialize repo once agent is available
	useEffect(() => {
		const agent = bluesky.getAgent();

		if (!agent) {
			setStatus("No agent available");
			setError("Bluesky agent not found. Please sign in.");
			return;
		}

		const did = agent.did;

		if (!did) {
			setStatus("Agent authenticated but no DID found");
			setError("Could not retrieve DID from agent");
			return;
		}

		setStatus(`Agent ready – DID: ${did}`);
		const sdRepo = new SociallyDeadRepo(agent);
		setRepo(sdRepo);
	}, [bluesky]);

	// Fetch the main record (rkey: self)
	const fetchRecord = async () => {
		if (!repo) return;
		setLoading(true);
		setError(null);
		setStatus("Fetching main record...");

		try {
			const rec = await repo.get();
			setRecord(rec);
			setStatus(rec ? "Main record loaded" : "No record found at rkey 'self'");
		} catch (err: any) {
			const msg = err.message || "Fetch failed";
			setError(msg);
			setStatus("Fetch error");
			console.error("Fetch error:", err);
		} finally {
			setLoading(false);
		}
	};

	// Fetch all records in collection
	const fetchList = async () => {
		if (!repo) return;
		setLoading(true);
		setError(null);
		setStatus("Listing collection...");

		try {
			const list = await repo.list(20);
			setRecordsList(list);
			setStatus(`Collection has ${list.length} record(s)`);
		} catch (err: any) {
			const msg = err.message || "List failed";
			setError(msg);
			setStatus("List error");
			console.error("List error:", err);
		} finally {
			setLoading(false);
		}
	};

	// Create / overwrite default record
	const createDefault = async () => {
		if (!repo) return;
		setLoading(true);
		setError(null);
		setStatus("Creating default record...");

		const defaultData: Partial<SociallyDeadRecord> = {
			version: 2,
			mood: "joined sociallydead.me",
			verified: false,
			props: {},
		};

		try {
			const { uri, cid } = await repo.createOrUpdate(defaultData);
			setStatus(`Created successfully! URI: ${uri} | CID: ${cid.slice(0, 12)}...`);
			console.log("Create success:", { uri, cid });

			// Refresh both views
			await fetchRecord();
			await fetchList();
		} catch (err: any) {
			const msg = err.message || "Create failed";
			setError(msg);
			setStatus("Create failed");
			console.error("Create error:", err);
		} finally {
			setLoading(false);
		}
	};

	// Auto-refresh when repo is set
	useEffect(() => {
		if (repo) {
			fetchRecord();
			fetchList();
		}
	}, [repo]);

	const noRecord = !loading && !record && !error && !!repo;
	const hasRecords = recordsList.length > 0;

	return (
		<div className="container mx-auto p-6 max-w-4xl">
			<Card className="mb-8">
				<CardHeader>
					<CardTitle className="flex items-center justify-between">
						SociallyDead PDS Debug
						<Badge variant={repo ? "default" : "secondary"}>
							{repo ? "Connected" : "Waiting"}
						</Badge>
					</CardTitle>
					<CardDescription>Status: {status}</CardDescription>
				</CardHeader>

				<CardContent>
					{error && (
						<Alert variant="destructive" className="mb-6">
							<AlertTitle>Error</AlertTitle>
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					)}

					<div className="flex flex-wrap gap-4 mb-6">
						<Button
							onClick={fetchRecord}
							disabled={loading || !repo}
							variant="outline"
						>
							<RefreshCw className="mr-2 h-4 w-4" />
							Refresh Record
						</Button>

						<Button
							onClick={fetchList}
							disabled={loading || !repo}
							variant="outline"
						>
							<ListIcon className="mr-2 h-4 w-4" />
							List All Records
						</Button>

						<Button
							onClick={createDefault}
							disabled={loading || !repo}
							variant={noRecord ? "default" : "secondary"}
						>
							<PlusCircle className="mr-2 h-4 w-4" />
							{noRecord ? "Create Default Record" : "Overwrite Default Record"}
						</Button>
					</div>

					{loading && (
						<div className="space-y-4">
							<Skeleton className="h-8 w-full" />
							<Skeleton className="h-40 w-full" />
						</div>
					)}

					{!loading && record && (
						<div className="mb-8">
							<h3 className="text-lg font-semibold mb-3">Main Record (rkey: self)</h3>
							<pre className="bg-muted p-4 rounded-md text-sm overflow-auto max-h-80 font-mono whitespace-pre-wrap">
                {JSON.stringify(record, null, 2)}
              </pre>
						</div>
					)}

					{noRecord && (
						<Alert className="mb-6">
							<AlertTitle>No Record Found</AlertTitle>
							<AlertDescription className="space-y-2">
								<p>No data exists at rkey "self" in collection <code>me.sociallydead.app</code>.</p>
								<p>Click "Create Default Record" to initialize it.</p>
							</AlertDescription>
						</Alert>
					)}

					{hasRecords && (
						<div>
							<h3 className="text-lg font-semibold mb-3">
								All Records in me.sociallydead.app ({recordsList.length})
							</h3>
							<div className="space-y-4">
								{recordsList.map((r, index) => (
									<Card key={index} className="bg-muted/50">
										<CardContent className="pt-4">
											<p className="text-sm font-mono text-muted-foreground mb-2 break-all">
												URI: {r.uri}
											</p>
											<pre className="text-xs bg-background p-3 rounded border overflow-auto max-h-60 font-mono whitespace-pre-wrap">
                        {JSON.stringify(r.value, null, 2)}
                      </pre>
										</CardContent>
									</Card>
								))}
							</div>
						</div>
					)}

					{!hasRecords && !loading && !error && repo && !noRecord && (
						<p className="text-muted-foreground mt-4 italic">
							No records in collection yet.
						</p>
					)}
				</CardContent>
			</Card>
		</div>
	);
}