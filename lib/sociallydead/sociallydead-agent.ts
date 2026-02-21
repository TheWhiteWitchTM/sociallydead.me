import { AtpAgent } from '@atproto/api';

let appAgent: AtpAgent | null = null;

export const getSociallyDeadAgent = async () => {
	return null;
}


export const getSociallyDeadAgent2 = async () => {
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