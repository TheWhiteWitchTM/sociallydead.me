import { Agent } from '@atproto/api';

const COLLECTION = 'me.sociallydead.app';

export async function createSociallyDeadRecord(
	agent: Agent,
	data: Record<string, unknown>
): Promise<{ uri: string; cid: string }> {
	console.log('[create] Preparing record:', {
		$type: COLLECTION,
		createdAt: new Date().toISOString(),
		...data
	});

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

	console.log('[create] Success →', response.data);
	return {
		uri: response.data.uri,
		cid: response.data.cid,
	};
}

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

		console.log('[get] Success → value:', response.data.value);
		return {
			uri: response.data.uri,
			cid: response.data.cid,
			value: response.data.value as Record<string, unknown>,
		};
	} catch (err: any) {
		if (err?.status === 404 || err?.error === 'RecordNotFound') {
			console.log('[get] Not found (normal)');
			return null;
		}
		console.error('[get] Error:', err.message, err.status, err.error);
		throw err;
	}
}

export async function updateSociallyDeadRecord(
	agent: Agent,
	updates: Record<string, unknown>
): Promise<{ uri: string; cid: string }> {
	const existing = await getSociallyDeadRecord(agent).catch(() => null);

	const newRecord = {
		$type: COLLECTION,
		createdAt: existing?.value?.createdAt || new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		...updates,                    // ← ONLY what you pass — no old garbage
	};

	console.log('[update] Preparing clean overwrite:', newRecord);

	const response = await agent.com.atproto.repo.putRecord({
		repo: agent.assertDid,
		collection: COLLECTION,
		rkey: 'self',
		record: newRecord,
		validate: false,
	});

	console.log('[update] Success →', response.data);
	return {
		uri: response.data.uri,
		cid: response.data.cid,
	};
}

export async function deleteSociallyDeadRecord(agent: Agent): Promise<void> {
	try {
		await agent.com.atproto.repo.deleteRecord({
			repo: agent.assertDid,
			collection: COLLECTION,
			rkey: 'self',
		});
		console.log('[delete] Success — record removed');
	} catch (err: any) {
		if (err?.status === 404 || err?.error === 'RecordNotFound') {
			console.log('[delete] Nothing to delete (did not exist)');
			return;
		}
		console.error('[delete] Error:', err.message, err.status, err.error);
		throw err;
	}
}
/**
 * Updates ONLY one (or more) specific property/properties in the sociallydead record.
 * - Fetches current record
 * - Merges only the provided changes
 * - Overwrites the record
 * - Returns new URI and CID
 *
 * Example:
 * await setSociallyDeadProperty(agent, { verified: true });
 * await setSociallyDeadProperty(agent, { mood: "very dead", verified: false });
 */
export async function setSociallyDeadProperty(
	agent: Agent,
	changes: Record<string, unknown>  // e.g. { verified: true }
): Promise<{ uri: string; cid: string }> {
	const existing = await getSociallyDeadRecord(agent);

	if (!existing) {
		// If no record exists → create with the change + minimal defaults
		console.log("[setProperty] No existing record → creating with changes");
		const initialData = {
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			mood: "joined sociallydead.me",
			verification: false,
			...changes,
		};
		return createSociallyDeadRecord(agent, initialData);
	}

	// Merge only the changes on top of current value
	const updatedValue = {
		...existing.value,
		...changes,
		updatedAt: new Date().toISOString(), // always update timestamp
	};

	console.log("[setProperty] Updating only these fields:", changes);
	console.log("[setProperty] New full value:", updatedValue);

	const response = await agent.com.atproto.repo.putRecord({
		repo: agent.assertDid,
		collection: COLLECTION,
		rkey: 'self',
		record: {
			$type: COLLECTION,
			createdAt: existing.value.createdAt || new Date().toISOString(),
			...updatedValue,
		},
		validate: false,
	});

	console.log("[setProperty] Success → new CID:", response.data.cid);
	return {
		uri: response.data.uri,
		cid: response.data.cid,
	};
}
