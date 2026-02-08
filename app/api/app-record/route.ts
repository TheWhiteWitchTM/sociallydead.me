// app/api/app-record/route.ts
import { NextResponse } from 'next/server';
import { getAppRecord } from '@/lib/sociallydead-app-repo';

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const rkey = searchParams.get('rkey');

	if (!rkey) {
		return NextResponse.json({ error: 'Missing rkey parameter' }, { status: 400 });
	}

	try {
		const record = await getAppRecord(rkey);
		return NextResponse.json({ record });
	} catch (err: any) {
		console.error('[API /app-record] Error:', err);
		return NextResponse.json(
			{ error: err.message || 'Failed to fetch record' },
			{ status: 500 }
		);
	}
}