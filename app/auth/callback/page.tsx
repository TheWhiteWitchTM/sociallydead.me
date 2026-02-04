// app/auth/callback/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { BrowserOAuthClient } from '@atproto/oauth-client-browser';

const CLIENT_METADATA_URL = 'https://sociallydead.me/oauth/client-metadata.json';

export default function CallbackPage() {
	const router = useRouter();
	const searchParams = useSearchParams();

	useEffect(() => {
		const processCallback = async () => {
			try {
				const client = new BrowserOAuthClient({
					clientMetadata: {
						client_id: CLIENT_METADATA_URL,
						redirect_uris: [
							window.location.hostname === 'localhost'
								? 'http://127.0.0.1:3000/auth/callback'
								: 'https://sociallydead.me/auth/callback',
						],
						grant_types: ['authorization_code'],
						response_types: ['code'],
						scope: 'atproto transition:generic',
						application_type: 'web',
						token_endpoint_auth_method: 'none',
						dpop_bound_access_tokens: true,
					},
				});

				await client.callback(searchParams);

				router.replace('/');
			} catch (err) {
				console.error('Callback failed:', err);
				alert('Login processing failed – check console');
				router.replace('/');
			}
		};

		processCallback();
	}, [searchParams, router]);

	return <div>Finishing Bluesky login... one moment</div>;
}