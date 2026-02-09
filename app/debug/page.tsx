'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {Loader2, Search, Trash2, PlusCircle, Copy, Lock, Unlock, XCircle} from 'lucide-react';
import { toast } from 'sonner';
import {Agent} from "@atproto/api";

const PASSWORD = 'Kate70Bush$';

export default function CentralRepoDebug() {
	const [passwordInput, setPasswordInput] = useState('');
	const [unlocked, setUnlocked] = useState(false);
	const [handleInput, setHandleInput] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [record, setRecord] = useState<any | null>(null);
	const [status, setStatus] = useState<string>('Enter password to unlock');
	const [jsonEdit, setJsonEdit] = useState<string>('');

	// Check if unlocked in session
	useEffect(() => {
		if (typeof window !== 'undefined') {
			const saved = localStorage.getItem('debug-unlocked');
			if (saved === 'true') {
				setUnlocked(true);
				setStatus('Unlocked – enter a handle');
			}
		}
	}, []);

	const handleUnlock = () => {
		if (passwordInput === PASSWORD) {
			setUnlocked(true);
			localStorage.setItem('debug-unlocked', 'true');
			setStatus('Unlocked – enter a handle');
			setError(null);
		} else {
			setError('Wrong password');
		}
	};

	const handleLogout = () => {
		setUnlocked(false);
		localStorage.removeItem('debug-unlocked');
		setStatus('Locked – enter password');
		setError(null);
		setHandleInput('');
		setRecord(null);
		setJsonEdit('');
	};

	const handleLookup = async () => {
		if (!handleInput.trim()) {
			setError('Enter a handle');
			return;
		}

		setLoading(true);
		setError(null);
		setRecord(null);
		setJsonEdit('');
		setStatus('Resolving handle...');

		try {
			const cleanHandle = handleInput.trim().replace(/^@/, '');

			const publicAgent = new Agent({ service: 'https://bsky.social' });
			const resolve = await publicAgent.com.atproto.identity.resolveHandle({
				handle: cleanHandle,
			});
			const did = resolve.data.did;

			setStatus(`DID: ${did} → Fetching record...`);

			const res = await fetch(`/api/app-record?rkey=${encodeURIComponent(did)}`);
			const json = await res.json();

			if (!res.ok) {
				throw new Error(json.error || 'API error');
			}

			setRecord(json.record);
			if (json.record) {
				setJsonEdit(JSON.stringify(json.record, null, 2));
				setStatus('Record loaded');
			} else {
				setStatus('No record found – use Create Default below');
			}
		} catch (err: any) {
			const msg = err.message || 'Lookup failed';
			setError(msg);
			setStatus('Error');
			console.error('[Lookup] Error:', err);
		} finally {
			setLoading(false);
		}
	};

	const handleCreateDefault = async () => {
		if (!handleInput.trim()) return;

		setLoading(true);
		setError(null);

		try {
			const cleanHandle = handleInput.trim().replace(/^@/, '');
			const publicAgent = new Agent({ service: 'https://bsky.social' });
			const resolve = await publicAgent.com.atproto.identity.resolveHandle({ handle: cleanHandle });
			const did = resolve.data.did;

			const defaultData = {
				version: 1,
				verified: false,
				mood: 'default mood',
				// add more defaults as needed
			};

			setStatus('Creating default record...');

			const res = await fetch('/api/app-record', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					rkey: did,
					data: defaultData,
				}),
			});

			const json = await res.json();

			if (!res.ok) {
				throw new Error(json.error || 'Create failed');
			}

			setStatus('Default created → refreshing...');
			await handleLookup();
		} catch (err: any) {
			setError(err.message || 'Create failed');
			setStatus('Error');
		} finally {
			setLoading(false);
		}
	};

	const handleUpdate = async () => {
		if (!record || !handleInput.trim()) return;

		setLoading(true);
		setError(null);

		try {
			const cleanHandle = handleInput.trim().replace(/^@/, '');
			const publicAgent = new Agent({ service: 'https://bsky.social' });
			const resolve = await publicAgent.com.atproto.identity.resolveHandle({ handle: cleanHandle });
			const did = resolve.data.did;

			let updatedData;
			try {
				updatedData = JSON.parse(jsonEdit);
			} catch {
				throw new Error('Invalid JSON in editor');
			}

			setStatus('Updating record...');

			const res = await fetch('/api/app-record', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					rkey: did,
					data: updatedData,
				}),
			});

			const json = await res.json();

			if (!res.ok) {
				throw new Error(json.error || 'Update failed');
			}

			setStatus('Updated successfully → refreshing...');
			await handleLookup();
		} catch (err: any) {
			setError(err.message || 'Update failed');
			setStatus('Error');
		} finally {
			setLoading(false);
		}
	};

	const handleDelete = async () => {
		if (!handleInput.trim() || !confirm('Delete this record? Irreversible!')) return;

		setLoading(true);
		setError(null);

		try {
			const cleanHandle = handleInput.trim().replace(/^@/, '');
			const publicAgent = new Agent({ service: 'https://bsky.social' });
			const resolve = await publicAgent.com.atproto.identity.resolveHandle({ handle: cleanHandle });
			const did = resolve.data.did;

			setStatus('Deleting record...');

			const res = await fetch('/api/app-record', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ rkey: did }),
			});

			const json = await res.json();

			if (!res.ok) {
				throw new Error(json.error || 'Delete failed');
			}

			setStatus('Deleted successfully');
			setRecord(null);
			setJsonEdit('');
		} catch (err: any) {
			setError(err.message || 'Delete failed');
			setStatus('Error');
		} finally {
			setLoading(false);
		}
	};

	const copyJson = () => {
		if (record) {
			navigator.clipboard.writeText(JSON.stringify(record, null, 2));
			toast.success('JSON copied');
		}
	};

	if (!unlocked) {
		return (
			<div className="container mx-auto p-6 max-w-md">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Lock className="h-5 w-5" />
							Debug Access
						</CardTitle>
						<CardDescription>Enter password to continue</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							<Input
								type="password"
								placeholder="Password"
								value={passwordInput}
								onChange={(e) => setPasswordInput(e.target.value)}
								onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
							/>
							<Button onClick={handleUnlock} className="w-full">
								Unlock
							</Button>
							{error && (
								<Alert variant="destructive">
									<AlertDescription>{error}</AlertDescription>
								</Alert>
							)}
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="container mx-auto p-6 max-w-4xl">
			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<CardTitle className="flex items-center gap-2">
						Central App Repo Debug
					</CardTitle>
					<Button variant="outline" size="sm" onClick={handleLogout}>
						<XCircle className="mr-2 h-4 w-4" />
						Lock / Logout
					</Button>
				</CardHeader>

				<CardContent>
					{/* Status */}
					<div className="mb-6">
						<Badge variant="outline" className="mb-2">
							{status}
						</Badge>
					</div>

					{/* Form */}
					<div className="flex gap-3 mb-6">
						<Input
							placeholder="@handle.bsky.social or handle.bsky.social"
							value={handleInput}
							onChange={(e) => setHandleInput(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === 'Enter') {
									e.preventDefault();
									handleLookup();
								}
							}}
							disabled={loading}
						/>
						<Button onClick={handleLookup} disabled={loading || !handleInput.trim()}>
							{loading ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Loading...
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

					{/* CRUD Buttons when record loaded */}
					{record && (
						<div className="flex gap-3 mb-6">
							<Button onClick={handleDelete} variant="destructive" disabled={loading}>
								<Trash2 className="mr-2 h-4 w-4" />
								Delete Record
							</Button>
							<Button onClick={copyJson} variant="outline" disabled={loading}>
								<Copy className="mr-2 h-4 w-4" />
								Copy JSON
							</Button>
						</div>
					)}

					{/* JSON Editor for update */}
					{record && (
						<div className="mb-6">
							<label className="block text-sm font-medium mb-1">Edit JSON</label>
							<Textarea
								className="w-full h-64 font-mono text-sm"
								value={jsonEdit}
								onChange={(e) => setJsonEdit(e.target.value)}
							/>
							<Button
								onClick={handleUpdate}
								className="mt-2"
								disabled={loading}
							>
								<PlusCircle className="mr-2 h-4 w-4" />
								Save Changes (Update)
							</Button>
						</div>
					)}

					{/* Create Default if missing */}
					{record === null && !loading && !error && handleInput.trim() && (
						<div className="mt-4">
							<Alert className="mb-4">
								<AlertTitle>No record found</AlertTitle>
								<AlertDescription>
									No data exists in the app repo for this user.
								</AlertDescription>
							</Alert>
							<Button
								onClick={handleCreateDefault}
								disabled={loading}
								variant="secondary"
							>
								<PlusCircle className="mr-2 h-4 w-4" />
								Create Default Record
							</Button>
						</div>
					)}

					{/* Result JSON */}
					{record && (
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
				</CardContent>
			</Card>
		</div>
	);
}