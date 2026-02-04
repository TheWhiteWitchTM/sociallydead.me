// app/auth/callback/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { BrowserOAuthClient } from '@atproto/oauth-client-browser';

const CLIENT_METADATA_URL = 'https://your-domain.com/client-metadata.json'; // ← must be real & hosted

export default function CallbackPage() {
	const router = useRouter();
	const searchParams = useSearchParams();

	useEffect(() => {
		const handleCallback = async () => {
			try {
				// Create client with FULL metadata (same as in login component!)
				const client = new BrowserOAuthClient({
					clientMetadata: {
						client_id: CLIENT_METADATA_URL,
						redirect_uris: [
							process.env.NODE_ENV === 'development'
								? 'http://127.0.0.1:3000/auth/callback'
								: 'https://your-real-domain.com/auth/callback',
						],
						grant_types: ['authorization_code'],
						response_types: ['code'],
						scope: 'atproto transition:generic',
						application_type: 'web',
						token_endpoint_auth_method: 'none',
						dpop_bound_access_tokens: true, // required for atproto security
					},
				});

				// Convert Next.js searchParams → URLSearchParams (what callback expects)
				const queryParams = new URLSearchParams(searchParams.toString());

				// Or pass the full current URL as string if hash is involved (rare)
				// const fullUrl = window.location.href;

				// Call callback with the params object/string
				await client.callback(queryParams);  // ← this processes code → tokens + stores session

				// Session is now stored internally (IndexedDB) — no need to manually grab tokens here
				// But for your isSignedIn check: you can query client.restoreSession() or check localStorage fallback
				// Quick & dirty: set a flag
				localStorage.setItem('atproto_signed_in', 'true');

				router.replace('/');  // redirect home (use replace to avoid back-button issues)
			} catch (err: any) {
				console.error('Callback processing failed:', err);
				alert(`Login failed: ${err.message || 'Check console for details'}`);
				router.replace('/');
			}
		};

		handleCallback();
	}, [searchParams, router]);

	return <div>Processing Bluesky login... please wait</div>;
}