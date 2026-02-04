// components/BlueSkyLogin.tsx
'use client';

import { ReactNode, useState, useEffect, useRef } from 'react';
import { BrowserOAuthClient } from '@atproto/oauth-client-browser';

const CLIENT_METADATA_URL = 'https://your-domain.com/client-metadata.json'; // ← YOUR REAL URL HERE

const getRedirectUri = () =>
	typeof window !== 'undefined' && window.location.hostname === 'localhost'
		? 'http://127.0.0.1:3000/auth/callback'
		: 'https://your-domain.com/auth/callback';

const SCOPE = 'atproto transition:generic';

interface Props {
	children: ReactNode;
}

export default function BlueSkyLogin({ children }: Props) {
	const [isSignedIn, setIsSignedIn] = useState(false);
	const [loading, setLoading] = useState(true);
	const clientRef = useRef<BrowserOAuthClient | null>(null);

	useEffect(() => {
		const initAuth = async () => {
			try {
				const client = new BrowserOAuthClient({
					clientMetadata: {
						client_id: CLIENT_METADATA_URL,
						redirect_uris: [getRedirectUri()],
						grant_types: ['authorization_code'],
						response_types: ['code'],
						scope: SCOPE,
						application_type: 'web',
						token_endpoint_auth_method: 'none',
						dpop_bound_access_tokens: true,
					},
				});

				clientRef.current = client;

				// Restore/check last session (this is the correct method)
				const result = await client.init();

				setIsSignedIn(!!result?.session);
			} catch (err) {
				console.error('Auth init failed:', err);
			} finally {
				setLoading(false);
			}
		};

		initAuth();
	}, []);

	const handleLogin = async () => {
		const client = clientRef.current;
		if (!client) return alert('Auth not ready');

		try {
			const handle = prompt('Enter Bluesky handle (no @)', 'example.bsky.social')?.trim();
			if (!handle) return;

			await client.authorize(handle, {
				scope: SCOPE,
				redirect_uri: getRedirectUri(),
				state: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
			});
			// authorize() redirects automatically — promise doesn't resolve
		} catch (err) {
			console.error('Authorize error:', err);
			alert('Login failed');
		}
	};

	const handleLogout = () => {
		// No revoke method — clear flag & reload (lib detects invalid on next init)
		localStorage.removeItem('atproto_signed_in'); // optional fallback
		setIsSignedIn(false);
		window.location.href = '/';
	};

	if (loading) return <div>Checking login...</div>;

	if (isSignedIn) {
		return (
			<>
				{children}
				<button
					onClick={handleLogout}
					style={{ margin: '1rem 0', padding: '8px 16px', background: '#ff3b30', color: 'white', border: 'none', borderRadius: '6px' }}
				>
					Logout
				</button>
			</>
		);
	}

	return (
		<button
			onClick={handleLogin}
			style={{ padding: '10px 20px', background: '#0066ff', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px' }}
		>
			Login with Bluesky
		</button>
	);
}