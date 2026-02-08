'use client';

import { useState } from 'react';
import { getAppRecord } from '@/lib/sociallydead-app-repo';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, CheckCircle2, XCircle } from 'lucide-react';

export default function CentralRepoDebugPage() {
	const [handleInput, setHandleInput] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [record, setRecord] = useState<any | null>(null);
	const [status, setStatus] = useState<string>('Checking agent...');
	const [agentConnected, setAgentConnected] = useState<boolean | null>(null);

	// Quick check if agent can log in
	const checkAgent = async () => {
		try {
			setAgentConnected(true);
			setStatus('Agent connected and authenticated');
		} catch (err: any) {
			setAgentConnected(false);
			setStatus('Agent connection failed');
			setError(err.message || 'Failed to initialize app agent');
		}
	};

	useState(() => {
		checkAgent();
	}, []);

	const handleFetch = async () => {
		if (!handleInput.trim()) {
			setError('Enter a handle');
			return;
		}

		setLoading(true);
		setError(null);
		setRecord(null);
		setStatus('Resolving handle and fetching record...');

		try {
			const cleanHandle = handleInput.trim().replace(/^@/, '');

			// Step 1: Resolve handle to DID (public, no auth)
			const publicAgent = new (await import('@atproto/api')).Agent({ service: 'https://bsky.social' });
			const resolve = await publicAgent.com.atproto.identity.resolveHandle({ handle: cleanHandle });
			const did = resolve.data.did;

			setStatus(`Resolved to DID: ${did} → Fetching record...`);

			// Step 2: Fetch from app repo using rkey = user DID
			const rec = await getAppRecord(did);
			setRecord(rec);

			if (rec) {
				setStatus(`Record found for ${cleanHandle}`);
			} else {
				setStatus(`No record found for ${cleanHandle}`);
			}
		} catch (err: any) {
			const msg = err.message || 'Fetch failed';
			setError(msg);
			setStatus('Error during lookup');
			console.error('Debug fetch error:', err);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="container mx-auto p-6 max-w-4xl">
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						Central Repo Debug (App-Owned Records)
					</CardTitle>
					<CardDescription>
						Enter any handle to fetch the corresponding record from the app repo (rkey = user DID)
					</CardDescription>
				</CardHeader>

				<CardContent>
					{/* Agent Connection Status */}
					<div className="mb-6 flex items-center gap-2">
						{agentConnected === null && (
							<Loader2 className="h-4 w-4 animate-spin" />
						)}
						{agentConnected === true && (
							<CheckCircle2 className="h-5 w-5 text-green-600" />
						)}
						{agentConnected === false && (
							<XCircle className="h-5 w-5 text-red-600" />
						)}
						<span className="font-medium">{status}</span>
						{agentConnected === false && (
							<Button variant="outline" size="sm" onClick={checkAgent}>
								Retry Agent
							</Button>
						)}
					</div>

					{/* Input & Button */}
					<div className="flex gap-3 mb-6">
						<Input
							placeholder="@handle.bsky.social or handle.bsky.social"
							value={handleInput}
							onChange={(e) => setHandleInput(e.target.value)}
							onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
							disabled={loading}
						/>
						<Button onClick={handleFetch} disabled={loading || !handleInput.trim()}>
							{loading ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Fetching...
								</>
							) : (
								<>
									<Search className="mr-2 h-4 w-4" />
									Fetch Record
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
						<div className="border rounded-md p-4 bg-muted/50">
							<h3 className="font-semibold mb-2">Record for {handleInput.trim()}</h3>
							<pre className="text-sm overflow-auto max-h-96 p-3 bg-background rounded border">
                {JSON.stringify(record, null, 2)}
              </pre>
						</div>
					)}

					{record === null && !loading && !error && handleInput && (
						<p className="text-muted-foreground italic">
							No record found (or fetch not attempted yet)
						</p>
					)}
				</CardContent>
			</Card>
		</div>
	);
}