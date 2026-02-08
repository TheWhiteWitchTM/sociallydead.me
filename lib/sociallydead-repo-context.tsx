// lib/sociallydead-repo-context.tsx
'use client';

import {createContext, useContext, useMemo, ReactNode, useState, useEffect} from 'react';
import { Agent } from '@atproto/api';
import { SociallyDeadRepo } from './sociallydead-me';
import { useBluesky } from './bluesky-context'; // your existing hook

// ──────────────────────────────────────────────────────────────────────────────
// Context
// ──────────────────────────────────────────────────────────────────────────────

interface RepoContextValue {
	repo: SociallyDeadRepo | null;
	isReady: boolean;
	error: string | null;
}

const RepoContext = createContext<RepoContextValue | undefined>(undefined);

// ──────────────────────────────────────────────────────────────────────────────
// Provider
// ──────────────────────────────────────────────────────────────────────────────

interface SociallyDeadRepoProviderProps {
	children: ReactNode;
}

export function SociallyDeadRepoProvider({ children }: SociallyDeadRepoProviderProps) {
	const bluesky = useBluesky();
	const [repo, setRepo] = useState<SociallyDeadRepo | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const agent = bluesky.getAgent();

		if (!agent) {
			setError('No Bluesky agent available');
			setRepo(null);
			return;
		}

		const did = agent.did;

		if (!did) {
			setError('Authenticated agent has no DID');
			setRepo(null);
			return;
		}

		// Create repo instance once agent/DID is ready
		const sdRepo = new SociallyDeadRepo(agent);
		setRepo(sdRepo);
		setError(null);

		console.log('[RepoProvider] Repo initialized for DID:', did);
	}, [bluesky]);

	const value: RepoContextValue = useMemo(
		() => ({
			repo,
			isReady: !!repo,
			error,
		}),
		[repo, error]
	);

	return <RepoContext.Provider value={value}>{children}</RepoContext.Provider>;
}

// ──────────────────────────────────────────────────────────────────────────────
// Hook
// ──────────────────────────────────────────────────────────────────────────────

export function useRepo() {
	const context = useContext(RepoContext);
	if (context === undefined) {
		throw new Error('useRepo must be used within a SociallyDeadRepoProvider');
	}
	return context;
}