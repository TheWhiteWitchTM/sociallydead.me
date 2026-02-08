'use client';

import { useBluesky } from "@/lib/bluesky-context";
import { useEffect, useState } from "react";
import { SociallyDeadRecord, SociallyDeadRepo } from "@/lib/sociallydead-me";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Bug, RefreshCw, PlusCircle, ListIcon, Trash2 } from "lucide-react";

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

	// Fetch main record (rkey: self)
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

	// Upsert default record
	const upsertDefault = async () => {
		if (!repo) return;
		setLoading(true);
		setError(null);
		setStatus("Upserting default record...");

		const defaultData: Partial<SociallyDeadRecord> = {
			version: 2,
			mood: "joined sociallydead.me",
			verification: false,
			highlights: [],
			articles: [],
			props: {},
		};

		try {
			const { uri, cid } = await repo.upsert(defaultData);
			setStatus(`Success! URI: ${uri} | CID: ${cid.slice(0, 12)}...`);
			console.log("Upsert success:", { uri, cid });

			await fetchRecord();
			await fetchList();
		} catch (err: any) {
			const msg = err.message || "Upsert failed";
			setError(msg);
			setStatus("Upsert failed");
			console.error("Upsert error:", err);
		} finally {
			setLoading(false);
		}
	};

	// Delete current record
	const deleteRecord = async () => {
		if (!repo) return;
		if (!confirm("Are you sure you want to delete the current record?\nThis cannot be undone!")) {
			return;
		}

		setLoading(true);
		setError(null);
		setStatus("Deleting record...");

		try {
			await repo.delete();
			setStatus("Record deleted successfully");
			setRecord(null);
			await fetchList();
		} catch (err: any) {
			const msg = err.message || "Delete failed";
			setError(msg);
			setStatus("Delete failed");
			console.error("Delete error:", err);
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
					<CardTitle className="flex items-center gap-2">
						<Bug className="h-6 w-6 text-red-500" />
						PDS Debug
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

					<Card className="mb-6 border-destructive/50 bg-destructive/5">
						<CardHeader className="pb-2">
							<CardTitle className="text-base text-destructive flex items-center gap-2">
								<Trash2 className="h-4 w-4" />
								Danger Zone
							</CardTitle>
						</CardHeader>
						<CardContent>
							<Alert variant="destructive" className="mb-4">
								<AlertTitle>Warning</AlertTitle>
								<AlertDescription>
									The <strong>Delete Record</strong> button will permanently remove the current record at rkey "self".
									<br />
									This cannot be undone and may affect your SociallyDead app functionality.
								</AlertDescription>
							</Alert>

							<div className="flex flex-wrap gap-4">
								<Button
									onClick={upsertDefault}
									disabled={loading || !repo}
									variant={noRecord ? "default" : "secondary"}
								>
									<PlusCircle className="mr-2 h-4 w-4" />
									{noRecord ? "Create Default Record" : "Update Default Record"}
								</Button>

								<Button
									onClick={deleteRecord}
									disabled={loading || !repo || !record}
									variant="destructive"
								>
									<Trash2 className="mr-2 h-4 w-4" />
									Delete Record
								</Button>

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
							</div>
						</CardContent>
					</Card>

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
							<AlertDescription>
								Nothing exists at rkey "self" yet.
								<br />
								Use "Create Default Record" to initialize your SociallyDead data.
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