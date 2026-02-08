// /lib/sociallydead-app-repo.ts

import { AtpAgent } from '@atproto/api';

export interface SociallyDeadAppRecord {
	$type: 'me.sociallydead.app';
	version: number;
	createdAt: string;
	updatedAt?: string;
	// All other fields are free-form / dynamic
	[key: string]: any;
}

let appAgent: AtpAgent | null = null;

async function getAppAgent(): Promise<AtpAgent> {
	if (appAgent) return appAgent;

	const handle = process.env.APP_BSKY_HANDLE;
	const password = process.env.APP_BSKY_PASSWORD;

	if (!handle || !password) {
		throw new Error(
			'Missing APP_BSKY_HANDLE or APP_BSKY_PASSWORD in environment variables'
		);
	}

	console.log('[SociallyDeadAppRepo] Initializing agent for:', handle);

	const agent = new AtpAgent({ service: 'https://bsky.social' });

	try {
		await agent.login({ identifier: handle, password });
		console.log('[SociallyDeadAppRepo] Login successful. DID:', agent.session?.did);
	} catch (err) {
		console.error('[SociallyDeadAppRepo] Login failed:', err);
		throw err;
	}

	appAgent = agent;
	return agent;
}

/**
 * Create or overwrite a record at the given rkey.
 * Uses putRecord (safe overwrite).
 */
export async function upsertAppRecord(
	rkey: string,
	partialData: Omit<Partial<SociallyDeadAppRecord>, '$type' | 'createdAt' | 'updatedAt'>
): Promise<{ uri: string; cid: string }> {
	const agent = await getAppAgent();

	console.log(`[upsertAppRecord] Writing to rkey: ${rkey}`);

	const record: SociallyDeadAppRecord = {
		$type: 'me.sociallydead.app',
		version: partialData.version ?? 1,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		...partialData,
	};

	console.debug('[upsertAppRecord] Full record payload:', record);

	const resp = await agent.com.atproto.repo.putRecord({
		repo: agent.session!.did,
		collection: 'me.sociallydead.app',
		rkey,
		record,
	});

	console.log('[upsertAppRecord] Success →', {
		uri: resp.data.uri,
		cid: resp.data.cid,
	});

	return { uri: resp.data.uri, cid: resp.data.cid };
}

/**
 * Fetch a record by rkey.
 * Returns null if not found (no error thrown).
 */
export async function getAppRecord(rkey: string): Promise<SociallyDeadAppRecord | null> {
	const agent = await getAppAgent();

	console.log(`[getAppRecord] Fetching rkey: ${rkey}`);

	try {
		const resp = await agent.com.atproto.repo.getRecord({
			repo: agent.session!.did,
			collection: 'me.sociallydead.app',
			rkey,
		});

		console.debug('[getAppRecord] Found:', resp.data.value);
		return resp.data.value as SociallyDeadAppRecord;
	} catch (err: any) {
		if (err?.error === 'RecordNotFound') {
			console.log('[getAppRecord] Not found:', rkey);
			return null;
		}
		console.error('[getAppRecord] Error:', err.message || err);
		throw err;
	}
}

/**
 * Delete a record by rkey.
 */
export async function deleteAppRecord(rkey: string): Promise<void> {
	const agent = await getAppAgent();

	console.log(`[deleteAppRecord] Deleting rkey: ${rkey}`);

	await agent.com.atproto.repo.deleteRecord({
		repo: agent.session!.did,
		collection: 'me.sociallydead.app',
		rkey,
	});

	console.log('[deleteAppRecord] Deleted successfully');
}

/**
 * List all records in the collection (paginated).
 * Debug-friendly: logs count and sample rkeys.
 */
export async function listAppRecords({
	                                     limit = 50,
	                                     cursor,
                                     }: {
	limit?: number;
	cursor?: string;
} = {}): Promise<{
	records: { uri: string; cid: string; value: SociallyDeadAppRecord }[];
	cursor?: string;
}> {
	const agent = await getAppAgent();

	console.log(`[listAppRecords] Fetching up to ${limit} records (cursor: ${cursor || 'none'})`);

	const resp = await agent.com.atproto.repo.listRecords({
		repo: agent.session!.did,
		collection: 'me.sociallydead.app',
		limit,
		cursor,
	});

	const result = {
		records: resp.data.records as any,
		cursor: resp.data.cursor,
	};

	console.log(`[listAppRecords] Found ${result.records.length} records`);
	if (result.records.length > 0) {
		console.log(
			'[listAppRecords] First few rkeys:',
			result.records.slice(0, 3).map((r: any) => r.uri.split('/').pop())
		);
	}

	return result;
}