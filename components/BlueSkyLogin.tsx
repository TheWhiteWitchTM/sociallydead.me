// components/BlueskyLogin.tsx
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AtpAgent, AtpSessionData } from '@atproto/api';

// ── Context & Provider ───────────────────────────────────────────────────────

interface BlueskyContextType {
	agent: AtpAgent | null;
	isAuthenticated: boolean;
	user: { did: string; handle: string; displayName?: string; avatar?: string } | null;
	login: (identifier: string, password: string) => Promise<void>;
	logout: () => void;
}

const BlueskyContext = createContext<BlueskyContextType | undefined>(undefined);

export function BlueskyProvider({ children }: { children: ReactNode }) {
	const [agent, setAgent] = useState<AtpAgent | null>(null);
	const [user, setUser] = useState<BlueskyContextType['user']>(null);
	const [isAuthenticated, setIsAuthenticated] = useState(false);

	useEffect(() => {
		const saved = localStorage.getItem('bluesky_session');
		if (saved) {
			try {
				const data = JSON.parse(saved) as AtpSessionData;
				const ag = new AtpAgent({
					service: 'https://bsky.social',
					persistSession: (evt: string, sess?: AtpSessionData) => {
						if (evt === 'create' || evt === 'update') {
							if (sess) localStorage.setItem('bluesky_session', JSON.stringify(sess));
						} else if (evt === 'expire') {
							localStorage.removeItem('bluesky_session');
						}
					},
				});
				ag.resumeSession(data);
				setAgent(ag);
				setIsAuthenticated(true);
				ag.app.bsky.actor.getProfile({ actor: ag.assertDid })
					.then(({ data }) => setUser({
						did: ag.assertDid,
						handle: data.handle,
						displayName: data.displayName,
						avatar: data.avatar,
					}))
					.catch(console.error);
			} catch (err) {
				console.error(err);
				localStorage.removeItem('bluesky_session');
			}
		}
	}, []);

	const login = async (identifier: string, password: string) => {
		const newAgent = new AtpAgent({
			service: 'https://bsky.social',
			persistSession: (evt: string, sess?: AtpSessionData) => {
				if (evt === 'create' || evt === 'update') {
					if (sess) localStorage.setItem('bluesky_session', JSON.stringify(sess));
				} else if (evt === 'expire') {
					localStorage.removeItem('bluesky_session');
				}
			},
		});
		await newAgent.login({ identifier, password });
		setAgent(newAgent);
		setIsAuthenticated(true);
		newAgent.app.bsky.actor.getProfile({ actor: newAgent.assertDid })
			.then(({ data }) => setUser({
				did: newAgent.assertDid,
				handle: data.handle,
				displayName: data.displayName,
				avatar: data.avatar,
			}))
			.catch(console.error);
	};

	const logout = () => {
		localStorage.removeItem('bluesky_session');
		setAgent(null);
		setIsAuthenticated(false);
		setUser(null);
	};

	return (
		<BlueskyContext.Provider value={{ agent, isAuthenticated, user, login, logout }}>
			{children}
		</BlueskyContext.Provider>
	);
}

export function useBluesky() {
	const ctx = useContext(BlueskyContext);
	if (!ctx) throw new Error('useBluesky must be used inside BlueskyProvider');
	return ctx;
}

// ── Sidebar-fit BlueskyLogin component ──────────────────────────────────────

export function BlueskyLogin() {
	const { isAuthenticated, user, login, logout } = useBluesky();
	const [handle, setHandle] = useState('');
	const [appPassword, setAppPassword] = useState('');
	const [error, setError] = useState('');

	const onSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');
		try {
			await login(handle.trim(), appPassword.trim());
		} catch (err: any) {
			setError(err?.message || 'Login failed');
		}
	};

	if (isAuthenticated && user) {
		return (
			<div style={{
				width: '260px',
				padding: '10px',
				background: '#f9f9f9',
				borderRadius: '8px',
				border: '1px solid #e0e0e0',
			}}>
				<div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
					{user.avatar && (
						<img src={user.avatar} alt="" style={{ width: '36px', height: '36px', borderRadius: '50%' }} />
					)}
					<div style={{ flex: 1, minWidth: 0 }}>
						<div style={{ fontWeight: 600, fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
							{user.displayName || user.handle}
						</div>
						<div style={{ fontSize: '12px', color: '#666' }}>@{user.handle}</div>
					</div>
				</div>
				<button
					onClick={logout}
					style={{
						width: '100%',
						padding: '6px',
						background: '#e63946',
						color: 'white',
						border: 'none',
						borderRadius: '6px',
						fontSize: '13px',
						cursor: 'pointer',
					}}
				>
					Sign out
				</button>
			</div>
		);
	}

	return (
		<div style={{
			width: '260px',
			padding: '10px',
			background: '#fff',
			borderRadius: '8px',
			border: '1px solid #e0e0e0',
			boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
		}}>
			<h3 style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: 600 }}>Bluesky</h3>
			<form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
				<input
					placeholder="handle.bsky.social"
					value={handle}
					onChange={e => setHandle(e.target.value)}
					required
					style={{ padding: '7px 9px', border: '1px solid #d0d0d0', borderRadius: '5px', fontSize: '13px' }}
				/>
				<input
					type="password"
					placeholder="app password"
					value={appPassword}
					onChange={e => setAppPassword(e.target.value)}
					required
					style={{ padding: '7px 9px', border: '1px solid #d0d0d0', borderRadius: '5px', fontSize: '13px' }}
				/>
				{error && <small style={{ color: '#e63946', lineHeight: '1.2' }}>{error}</small>}
				<button
					type="submit"
					style={{
						padding: '7px',
						background: '#1d9bf0',
						color: 'white',
						border: 'none',
						borderRadius: '5px',
						fontSize: '13px',
						fontWeight: 500,
						cursor: 'pointer',
					}}
				>
					Sign in
				</button>
			</form>
			<small style={{ display: 'block', marginTop: '6px', fontSize: '11px', color: '#666' }}>
				<a href="https://bsky.app/settings/app-passwords" target="_blank" style={{ color: '#1d9bf0' }}>
					Get app password
				</a>
			</small>
		</div>
	);
}