'use client'; // Client-side component for API calls/state

import { useState, useEffect } from 'react';
import { Agent } from '@atproto/api'; // Assuming you have this installed
import { SociallyDeadRepo, SociallyDeadRecord } from '@/lib/sociallydead-me'; // Adjust path if needed (e.g., /lib/sociallydead-me.ts)
import { Button } from '@/components/ui/button'; // shadcn Button
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // shadcn Card
import { Skeleton } from '@/components/ui/skeleton'; // shadcn Skeleton for loading
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {useBluesky} from "@/lib/bluesky-context"; // shadcn Alert for errors

// Placeholder: Assume you have a way to get your OAuth-authenticated Agent

export default function DebugPage() {
	const blueSky  = useBluesky()
	const [agent, setAgent] = useState<Agent | null>(null);
	const [repo, setRepo] = useState<SociallyDeadRepo | null>(null);
	const [record, setRecord] = useState<SociallyDeadRecord | null>(null);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);
	const [actionStatus, setActionStatus] = useState<string>('');

	setAgent(blueSky.agent)
	// Init repo on mount
	useEffect(() => {
		try {
			if(!agent)
				return;

			const sdRepo = new SociallyDeadRepo(agent);
			setRepo(sdRepo);
			console.log('DebugPage: Repo initialized');
		} catch (err: any) {
			const msg = err.message || 'Failed to init repo/agent';
			setError(msg);
			console.error('DebugPage: Init error:', msg);
		}
	}, [agent]);

	// Fetch record when repo is ready
	useEffect(() => {
		if (!repo) return;

		const fetchRecord = async () => {
			setLoading(true);
			setError(null);
			setActionStatus('Fetching record...');
			console.log('DebugPage: Starting fetch');

			try {
				const rec = await repo.get();
				setRecord(rec);
				if (rec) {
					setActionStatus('Record found and loaded.');
					console.log('DebugPage: Record fetched:', rec);
				} else {
					setActionStatus('No record found.');
					console.log('DebugPage: No record exists yet.');
				}
			} catch (err: any) {
				const msg = err.message || 'Fetch failed';
				setError(msg);
				setActionStatus('Fetch error.');
				console.error('DebugPage: Fetch error:', msg);
			} finally {
				setLoading(false);
			}
		};

		fetchRecord();
	}, [repo]);

	// Handle create default record
	const handleCreateDefault = async () => {
		if (!repo) {
			setError('Repo not initialized');
			return;
		}

		setLoading(true);
		setError(null);
		setActionStatus('Creating default record...');
		console.log('DebugPage: Starting create default');

		const defaultData: Partial<SociallyDeadRecord> = {
			version: 2,
			mood: 'joined sociallydead.me',
			verification: false,
			highlights: [],
			articles: [],
			props: {},
		};

		try {
			const { uri, cid } = await repo.createOrUpdate(defaultData);
			setActionStatus(`Created successfully! URI: ${uri}, CID: ${cid}`);
			console.log('DebugPage: Create success:', { uri, cid });

			// Refresh record after create
			const rec = await repo.get();
			setRecord(rec);
		} catch (err: any) {
			const msg = err.message || 'Create failed';
			setError(msg);
			setActionStatus('Create error.');
			console.error('DebugPage: Create error:', msg);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="container mx-auto p-4">
			<Card>
				<CardHeader>
					<CardTitle>SociallyDead Debug Page</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="mb-4">Status: {actionStatus}</p>

					{error && (
						<Alert variant="destructive" className="mb-4">
							<AlertTitle>Error</AlertTitle>
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					)}

					<Button onClick={handleCreateDefault} disabled={loading || !repo} className="mb-4">
						{loading ? 'Processing...' : 'Create Default Record'}
					</Button>

					<div>
						<h2 className="text-lg font-semibold mb-2">Current Record:</h2>
						{loading ? (
							<Skeleton className="h-32 w-full" />
						) : record ? (
							<pre className="bg-gray-100 p-4 rounded-md overflow-auto">
                {JSON.stringify(record, null, 2)}
              </pre>
						) : (
							<p>No record exists yet. Use the button to create one.</p>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}