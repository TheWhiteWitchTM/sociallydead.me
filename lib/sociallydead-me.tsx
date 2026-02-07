import { Agent } from '@atproto/api';

/**
 * Creates a new "sociallydead.me" record if it doesn't exist.
 * Returns the URI and CID of the created record.
 */
export async function createSociallyDeadRecord(
	agent: Agent,
	data: Record<string, unknown> // Your custom settings object
): Promise<{ uri: string; cid: string }> {
	const response = await agent.com.atproto.repo.createRecord({
		repo: agent.assertDid, // or agent.session?.did if you prefer
		collection: 'sociallydead.me',
		rkey: 'self',
		record: {
			$type: 'sociallydead.me', // Optional but recommended for your custom type
			createdAt: new Date().toISOString(),
			...data, // Spread your settings here
		},
		// validate: true, // Optional: enforce Lexicon validation if you define one
	});

	return {
		uri: response.data.uri,
		cid: response.data.cid,
	};
}

/**
 * Gets the current "sociallydead.me" record (or null if it doesn't exist).
 * Returns the parsed record data + metadata.
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
			collection: 'sociallydead.me',
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
		throw err; // Rethrow other errors (network, auth, etc.)
	}
}

/**
 * Updates (or creates if missing) the "sociallydead.me" record.
 * - Fetches current value first (if exists)
 * - Merges new data on top
 * - Uses putRecord to upsert
 * Returns the new URI and CID.
 */
export async function updateSociallyDeadRecord(
	agent: Agent,
	updates: Record<string, unknown> // Partial updates to merge
): Promise<{ uri: string; cid: string }> {
	// Get current record (or start fresh)
	const existing = await getSociallyDeadRecord(agent);

	const newRecord = {
		$type: 'sociallydead.me',
		createdAt: existing?.value.createdAt || new Date().toISOString(), // Preserve original createdAt if possible
		updatedAt: new Date().toISOString(),
		...(existing?.value || {}), // Old data
		...updates, // New/override data
	};

	const response = await agent.com.atproto.repo.putRecord({
		repo: agent.assertDid,
		collection: 'sociallydead.me',
		rkey: 'self',
		record: newRecord,
		// validate: true, // Optional
	});

	return {
		uri: response.data.uri,
		cid: response.data.cid,
	};
}