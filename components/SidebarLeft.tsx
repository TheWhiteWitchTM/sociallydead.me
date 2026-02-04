// app/layout.tsx  (or wherever your root component lives)
import type { Metadata } from 'next';
import { BlueskyProvider, BlueskyLogin } from '@/components/BlueSkyLogin'; // adjust path

export const metadata: Metadata = {
	title: 'Your App - Bluesky Integrated',
	description: 'Simple Bluesky login with app password',
};

export default function ({
	                                   children,
                                   }: {
	children: React.ReactNode;
}) {
	return (
		<>
		<BlueskyProvider>
			<header style={{ padding: '16px', background: '#f0f0f0' }}>
				<h1>My App</h1>
				<BlueskyLogin />  {/* ← shows login form or avatar + name + logout */}
			</header>
			<main style={{ padding: '20px' }}>
				{children}
			</main>
		</BlueskyProvider>
		</>
	);
}