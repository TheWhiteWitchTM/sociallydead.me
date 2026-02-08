import { Agent } from '@atproto/api';

/**
 * Collection name – valid NSID (change only if you want something else)
 */
const COLLECTION = 'me.sociallydead.app';

/**
 * Creates a new record (fails if exists – use update for upsert)
 */
export async function createSociallyDeadRecord(
	agent: Agent,
	data: Record<string, unknown>
): Promise<{ uri: string; cid: string }> {
	const response = await agent.com.atproto.repo.createRecord({
		repo: agent.assertDid,
		collection: COLLECTION,
		rkey: 'self',
		record: {
			$type: COLLECTION,
			createdAt: new Date().toISOString(),
			...data,
		},
		validate: false,
	});

	console.log("CREATE SUCCESS:", response.data);
	return {
		uri: response.data.uri,
		cid: response.data.cid,
	};
}

/**
 * Gets the record (returns null if missing)
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
			collection: COLLECTION,
			rkey: 'self',
		});

		console.log("GET SUCCESS:", response.data);
		return {
			uri: response.data.uri,
			cid: response.data.cid,
			value: response.data.value as Record<string, unknown>,
		};
	} catch (err: any) {
		if (err?.status === 404 || err?.error === 'RecordNotFound') {
			console.log("Record not found (expected)");
			return null;
		}
		console.error("GET FAILED:", err.message, err.error, err.status);
		throw err;
	}
}

/**
 * Updates / overwrites the record cleanly (no old fields survive unless you send them)
 */
export async function updateSociallyDeadRecord(
	agent: Agent,
	updates: Record<string, unknown>
): Promise<{ uri: string; cid: string }> {
	const existing = await getSociallyDeadRecord(agent).catch(() => null);

	const newRecord = {
		$type: COLLECTION,
		createdAt: existing?.value?.createdAt || new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		...updates,  // ← only what YOU provide – no ghost fields
	};

	console.log("UPDATE – writing clean record:", newRecord);

	const response = await agent.com.atproto.repo.putRecord({
		repo: agent.assertDid,
		collection: COLLECTION,
		rkey: 'self',
		record: newRecord,
		validate: false,
	});

	console.log("UPDATE SUCCESS:", response.data);
	return {
		uri: response.data.uri,
		cid: response.data.cid,
	};
}

/**
 * Deletes the record (safe if missing)
 */
export async function deleteSociallyDeadRecord(agent: Agent): Promise<void> {
	try {
		await agent.com.atproto.repo.deleteRecord({
			repo: agent.assertDid,
			collection: COLLECTION,
			rkey: 'self',
		});
		console.log("DELETE SUCCESS: record removed");
	} catch (err: any) {
		if (err?.status === 404 || err?.error === 'RecordNotFound') {
			console.log("DELETE: no record existed – nothing done");
			return;
		}
		console.error("DELETE FAILED:", err.message, err.error, err.status);
		throw err;
	}
}