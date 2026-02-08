// app/not-found.tsx
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function NotFound() {
	const pathname = usePathname();

	return (
		<div style={{ textAlign: 'center', padding: '4rem' }}>
			<h1>404 - Not Found</h1>
			<p>Sorry, the page <strong>{pathname}</strong> could not be found.</p>
			<p>Check the URL or go back to the <Link href="/">homepage</Link>.</p>
		</div>
	);
}