// app/auth/client-metadata/route.ts
import { NextResponse } from 'next/server';

export const dynamic = 'force-static';

export async function GET() {
	const hostname = 'sociallydead.me';
	const metadataUrl = `https://${hostname}/auth/client-metadata`;  // no .json

	const clientMetadata = {
		client_id: metadataUrl,  // MUST match exactly
		application_type: 'web',
		client_name: 'Socially Dead',
		// ... your other fields: redirect_uris, grant_types, scope, jwks_uri, etc.
	};

	return NextResponse.json(clientMetadata, {
		headers: { 'Content-Type': 'application/json' }
	});
}