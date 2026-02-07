import { Agent } from '@atproto/api';

/**
 * Creates a new "sociallydead" record if it doesn't exist.
 * Returns the URI and CID of the created record.
 */
export async function createSociallyDeadRecord(
	agent: Agent,
	data: Record<string, unknown> // Your custom settings object
): Promise<{ uri: string; cid: string }> {
	const response = await agent.com.atproto.repo.createRecord({
		repo: agent.assertDid,
		collection: 'me.sociallydead.status',  // ← FIXED: valid NSID
		rkey: 'self',
		record: {
			$type: 'me.sociallydead.status',     // ← must match collection exactly
			createdAt: new Date().toISOString(),
			...data,
		},
		// validate: false,  // Uncomment only if you want to skip schema checks (not needed here)
	});

	return {
		uri: response.data.uri,
		cid: response.data.cid,
	};
}

/**
 * Gets the current "sociallydead" record (or null if missing).
 */
export async function getSociallyDeadRecord(
	agent: Agent
): Promise<{
	uri: string;
	cid: string;
	value: Record<string, unknown>;
} | null> {
	try {
		const response = await agent.com.atproto.repo.getRecord({
			repo: agent.assertDid,
			collection: 'me.sociallydead.status',  // ← FIXED
			rkey: 'self',
		});

		return {
			uri: response.data.uri,
			cid: response.data.cid,
			value: response.data.value as Record<string, unknown>,
		};
	} catch (err: any) {
		if (err?.status === 404 || err?.error === 'RecordNotFound') {
			return null;
		}
		throw err;
	}
}

/**
 * Updates (or creates) the "sociallydead" record.
 * Merges updates on top of existing data.
 */
export async function updateSociallyDeadRecord(
	agent: Agent,
	updates: Record<string, unknown>
): Promise<{ uri: string; cid: string }> {
	const existing = await getSociallyDeadRecord(agent);

	const newRecord = {
		$type: 'me.sociallydead.status',  // your collection
		createdAt: existing?.value?.createdAt || new Date().toISOString(), // preserve original create time
		updatedAt: new Date().toISOString(),
		...updates,  // only your new fields — NO spreading old value!
	};

	const response = await agent.com.atproto.repo.putRecord({
		repo: agent.assertDid,
		collection: 'me.sociallydead.status',
		rkey: 'self',
		record: newRecord,
		validate: false,  // keep this
	});

	return {
		uri: response.data.uri,
		cid: response.data.cid,
	};
}