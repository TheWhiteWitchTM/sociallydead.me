// app/debug-central/page.tsx
'use client';

import { useState } from 'react';
import { Agent } from '@atproto/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Search } from 'lucide-react';

export default function CentralRepoDebug() {
	const [handleInput, setHandleInput] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [record, setRecord] = useState<any | null>(null);
	const [status, setStatus] = useState<string>('Ready');

	const handleLookup = async () => {
		if (!handleInput.trim()) {
			setError('Enter a handle');
			return;
		}

		setLoading(true);
		setError(null);
		setRecord(null);
		setStatus('Resolving handle...');

		try {
			const cleanHandle = handleInput.trim().replace(/^@/, '');

			// Public handle → DID resolution (client-safe)
			const publicAgent = new Agent({ service: 'https://bsky.social' });
			const resolve = await publicAgent.com.atproto.identity.resolveHandle({
				handle: cleanHandle,
			});
			const did = resolve.data.did;

			setStatus(`Resolved to DID: ${did} → Fetching from app repo...`);

			// Call YOUR server API route (env vars & login happen server-side)
			const res = await fetch(`/api/app-record?rkey=${encodeURIComponent(did)}`);
			const json = await res.json();

			if (!res.ok) {
				throw new Error(json.error || 'API request failed');
			}

			setRecord(json.record);
			setStatus(json.record ? 'Record found' : 'No record found in app repo');
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
			<Card>
				<CardHeader>
					<CardTitle>Central App Repo Debug</CardTitle>
					<CardDescription>
						Enter any handle to fetch the record from your app repo (rkey = resolved DID)
					</CardDescription>
				</CardHeader>

				<CardContent>
					{/* Form */}
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