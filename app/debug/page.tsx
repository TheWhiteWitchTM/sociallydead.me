'use client';

import { useState, useEffect } from 'react';
import { Agent } from '@atproto/api';
import { getAppRecord } from '@/lib/sociallydead-app-repo'; // your library
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, CheckCircle2, XCircle } from 'lucide-react';

export default function CentralRepoDebug() {
	const [handleInput, setHandleInput] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [record, setRecord] = useState<any | null>(null);
	const [status, setStatus] = useState<string>('Checking app agent...');
	const [agentReady, setAgentReady] = useState<boolean | null>(null);

	// Check agent readiness on mount
	useEffect(() => {
		const check = async () => {
			try {
				// Just trigger init to see if it logs in
				await getAppRecord('test-dummy-rkey'); // dummy rkey — will likely 404, but agent initializes
				setAgentReady(true);
				setStatus('App agent connected and authenticated');
			} catch (err: any) {
				setAgentReady(false);
				setStatus('App agent not connected');
				setError(err.message || 'Agent initialization failed');
			}
		};
		check();
	}, []);

	const handleLookup = async () => {
		if (!handleInput.trim()) {
			setError('Please enter a handle');
			return;
		}

		setLoading(true);
		setError(null);
		setRecord(null);
		setStatus('Resolving handle → Fetching record...');

		try {
			const cleanHandle = handleInput.trim().replace(/^@/, '');

			// Public resolve (no auth needed)
			const publicAgent = new Agent({ service: 'https://bsky.social' });
			const resolve = await publicAgent.com.atproto.identity.resolveHandle({
				handle: cleanHandle,
			});
			const did = resolve.data.did;

			setStatus(`Resolved to DID: ${did} → Checking app repo...`);

			// Fetch from YOUR app's repo with rkey = user's DID
			const rec = await getAppRecord(did);

			setRecord(rec);
			setStatus(rec ? 'Record found' : 'No record found in app repo');
		} catch (err: any) {
			const msg = err.message || 'Lookup failed';
			setError(msg);
			setStatus('Error');
			console.error('[Debug Lookup] Error:', err);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="container mx-auto p-6 max-w-4xl">
			<Card className="mb-8">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						Central App Repo Debug
					</CardTitle>
					<CardDescription>
						Enter any handle to fetch the record from your app's repo (rkey = resolved DID)
					</CardDescription>
				</CardHeader>

				<CardContent>
					{/* Agent Status */}
					<div className="mb-6 flex items-center gap-3">
						{agentReady === null && <Loader2 className="h-5 w-5 animate-spin" />}
						{agentReady === true && <CheckCircle2 className="h-5 w-5 text-green-600" />}
						{agentReady === false && <XCircle className="h-5 w-5 text-red-600" />}
						<span className="font-medium text-lg">{status}</span>
						{agentReady === false && (
							<Button variant="outline" size="sm" onClick={() => window.location.reload()}>
								Retry Connection
							</Button>
						)}
					</div>

					{/* Lookup Form */}
					<div className="flex gap-3 mb-6">
						<Input
							placeholder="@handle.bsky.social or handle.bsky.social"
							value={handleInput}
							onChange={(e) => setHandleInput(e.target.value)}
							onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
							disabled={loading}
						/>
						<Button
							onClick={handleLookup}
							disabled={loading || !handleInput.trim()}
						>
							{loading ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Looking up...
								</>
							) : (
								<>
									<Search className="mr-2 h-4 w-4" />
									Lookup
								</>
							)}
						</Button>
					</div>

					{/* Error */}
					{error && (
						<Alert variant="destructive" className="mb-6">
							<AlertTitle>Error</AlertTitle>
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					)}

					{/* Result */}
					{record !== null && (
						<Card className="bg-muted/50">
							<CardHeader className="pb-2">
								<CardTitle className="text-lg">
									Record for {handleInput.trim()}
								</CardTitle>
							</CardHeader>
							<CardContent>
                <pre className="text-sm overflow-auto max-h-96 p-4 bg-background rounded border font-mono whitespace-pre-wrap">
                  {JSON.stringify(record, null, 2)}
                </pre>
							</CardContent>
						</Card>
					)}

					{record === null && !loading && !error && handleInput.trim() && (
						<Alert className="mt-4">
							<AlertTitle>No record found</AlertTitle>
							<AlertDescription>
								No data exists in the app repo for rkey = resolved DID of {handleInput.trim()}
							</AlertDescription>
						</Alert>
					)}
				</CardContent>
			</Card>
		</div>
	);
}