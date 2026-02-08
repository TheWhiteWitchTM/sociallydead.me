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