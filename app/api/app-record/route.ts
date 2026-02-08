import { NextResponse } from 'next/server';
import {
	getAppRecord,
	upsertAppRecord,
	deleteAppRecord,
} from '@/lib/sociallydead-app-repo';

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const rkey = searchParams.get('rkey');

	if (!rkey) {
		return NextResponse.json({ error: 'Missing rkey query parameter' }, { status: 400 });
	}

	console.log(`[API GET] Fetching rkey: ${rkey}`);

	try {
		const record = await getAppRecord(rkey);
		return NextResponse.json({
			success: true,
			found: !!record,
			record: record || null,
		});
	} catch (err: any) {
		console.error('[API GET] Error:', err.message || err);
		return NextResponse.json(
			{ success: false, error: err.message || 'Fetch failed' },
			{ status: 500 }
		);
	}
}

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { rkey, data } = body;

		if (!rkey || !data || typeof data !== 'object') {
			return NextResponse.json({ success: false, error: 'Missing or invalid rkey/data' }, { status: 400 });
		}

		console.log(`[API POST] Creating record at rkey: ${rkey}`);

		const result = await upsertAppRecord(rkey, data);

		return NextResponse.json({
			success: true,
			action: 'created',
			uri: result.uri,
			cid: result.cid,
		}, { status: 201 });
	} catch (err: any) {
		console.error('[API POST] Error:', err.message || err);
		return NextResponse.json(
			{ success: false, error: err.message || 'Create failed' },
			{ status: 500 }
		);
	}
}

export async function PUT(request: Request) {
	try {
		const body = await request.json();
		const { rkey, data } = body;

		if (!rkey || !data || typeof data !== 'object') {
			return NextResponse.json({ success: false, error: 'Missing or invalid rkey/data' }, { status: 400 });
		}

		console.log(`[API PUT] Updating record at rkey: ${rkey}`);

		const result = await upsertAppRecord(rkey, data);

		return NextResponse.json({
			success: true,
			action: 'updated',
			uri: result.uri,
			cid: result.cid,
		});
	} catch (err: any) {
		console.error('[API PUT] Error:', err.message || err);
		return NextResponse.json(
			{ success: false, error: err.message || 'Update failed' },
			{ status: 500 }
		);
	}
}

export async function DELETE(request: Request) {
	try {
		const body = await request.json();
		const { rkey } = body;

		if (!rkey) {
			return NextResponse.json({ success: false, error: 'Missing rkey' }, { status: 400 });
		}

		console.log(`[API DELETE] Deleting rkey: ${rkey}`);

		await deleteAppRecord(rkey);

		return NextResponse.json({
			success: true,
			action: 'deleted',
			rkey,
		});
	} catch (err: any) {
		console.error('[API DELETE] Error:', err.message || err);
		return NextResponse.json(
			{ success: false, error: err.message || 'Delete failed' },
			{ status: 500 }
		);
	}
}