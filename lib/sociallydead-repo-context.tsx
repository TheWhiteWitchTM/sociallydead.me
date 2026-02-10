"use client";

import React, { createContext, useContext, ReactNode, useCallback } from 'react';
import useSWR, { useSWRConfig, mutate as globalMutate } from 'swr';

export interface SociallyDeadAppRecord {
	$type: 'me.sociallydead.app';
	version: number;
	createdAt: string;
	updatedAt?: string;
	[key: string]: any;
}

interface RepoContextType {
	getRecord: (rkey: string) => {
		record: SociallyDeadAppRecord | null | undefined;
		isLoading: boolean;
		error: any;
		mutate: (data?: any, options?: any) => Promise<any>;
	};
	createRecord: (rkey: string, data: any) => Promise<void>;
	upsertRecord: (rkey: string, data: any) => Promise<void>;
	deleteRecord: (rkey: string) => Promise<void>;
}

const RepoContext = createContext<RepoContextType | undefined>(undefined);

const fetcher = async (url: string) => {
	const res = await fetch(url);
	if (!res.ok) {
		const errorData = await res.json();
		throw new Error(errorData.error || 'Failed to fetch record');
	}
	const data = await res.json();
	return data.record;
};

export const SociallyDeadRepoProvider = ({ children }: { children: ReactNode }) => {
	const { mutate: configMutate } = useSWRConfig();

	const getRecord = useCallback((rkey: string) => {
		const { data, error, isLoading, mutate } = useSWR<SociallyDeadAppRecord | null>(
			rkey ? `/api/app-record?rkey=${encodeURIComponent(rkey)}` : null,
			fetcher
		);

		return {
			record: data,
			isLoading,
			error,
			mutate,
		};
	}, []);

	const createRecord = useCallback(async (rkey: string, data: any) => {
		const res = await fetch('/api/app-record', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ rkey, data, mode: 'create' }),
		});

		if (!res.ok) {
			const errorData = await res.json();
			throw new Error(errorData.error || 'Failed to create record');
		}

		// Revalidate the specific record
		await configMutate(`/api/app-record?rkey=${encodeURIComponent(rkey)}`);
	}, [configMutate]);

	const upsertRecord = useCallback(async (rkey: string, data: any) => {
		const res = await fetch('/api/app-record', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ rkey, data }),
		});

		if (!res.ok) {
			const errorData = await res.json();
			throw new Error(errorData.error || 'Failed to upsert record');
		}

		// Optimistically or after success, revalidate the specific record
		await configMutate(`/api/app-record?rkey=${encodeURIComponent(rkey)}`);
	}, [configMutate]);

	const deleteRecord = useCallback(async (rkey: string) => {
		const res = await fetch('/api/app-record', {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ rkey }),
		});

		if (!res.ok) {
			const errorData = await res.json();
			throw new Error(errorData.error || 'Failed to delete record');
		}

		// Revalidate/Clear the specific record from cache
		await configMutate(`/api/app-record?rkey=${encodeURIComponent(rkey)}`, null, false);
	}, [configMutate]);

	return (
		<RepoContext.Provider value={{ getRecord, createRecord, upsertRecord, deleteRecord }}>
			{children}
		</RepoContext.Provider>
	);
};

export const useSociallyDeadRepo = () => {
	const context = useContext(RepoContext);
	if (context === undefined) {
		throw new Error('useSociallyDeadRepo must be used within a SociallyDeadRepoProvider');
	}
	return context;
};
