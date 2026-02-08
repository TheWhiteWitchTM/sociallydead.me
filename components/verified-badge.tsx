'use client';

import { useState, useEffect } from 'react';
import { Agent } from '@atproto/api';

type UserBadgesProps = {
	handle: string;                     // e.g. "thewhitewitchtm.sociallydead.me" or "@handle"
	isBlueskyVerified: boolean;
	isDomainVerified: boolean;
	isSociallyDeadDomain: boolean;
};

export function UserBadges({
	                           handle,
	                           isBlueskyVerified,
	                           isDomainVerified,
	                           isSociallyDeadDomain,
                           }: UserBadgesProps) {
	const [isSdVerified, setIsSdVerified] = useState<boolean | null>(null);

	const cleanHandle = handle.replace(/^@/, '');

	useEffect(() => {
		if (!cleanHandle) {
			setIsSdVerified(false);
			return;
		}

		let mounted = true;

		const publicAgent = new Agent({ service: 'https://bsky.social' });

		const check = async () => {
			try {
				// Resolve handle to DID (public)
				const resolve = await publicAgent.com.atproto.identity.resolveHandle({
					handle: cleanHandle,
				});
				const did = resolve.data.did;

				// Fetch the custom record (public read)
				const recordResp = await publicAgent.com.atproto.repo.getRecord({
					repo: did,
					collection: 'me.sociallydead.app',
					rkey: 'self',
				});

				const record = recordResp.data.value as any;
				const verified = record?.verification === true;

				if (mounted) setIsSdVerified(verified);
			} catch {
				if (mounted) setIsSdVerified(false);
			}
		};

		check();

		return () => {
			mounted = false;
		};
	}, [cleanHandle]);

	// Precedence: Bluesky > Gold > Green > Blue (only if none above)
	const showBlueBadge =
		isSdVerified === true &&
		!isBlueskyVerified &&
		!isSociallyDeadDomain &&
		!isDomainVerified;

	return (
		<div className="flex items-center gap-1.5 flex-wrap">
			{/* Your existing badges unchanged */}
			{isBlueskyVerified && (
				<span className="bg-blue-500 text-white text-xs font-medium px-2.5 py-0.5 rounded-full">
          Verified
        </span>
			)}

			{isSociallyDeadDomain && (
				<span className="bg-yellow-500 text-black text-xs font-medium px-2.5 py-0.5 rounded-full">
          Gold
        </span>
			)}

			{isDomainVerified && (
				<span className="bg-green-500 text-white text-xs font-medium px-2.5 py-0.5 rounded-full">
          Domain
        </span>
			)}

			{/* Blue SociallyDead badge – only when no higher precedence */}
			{showBlueBadge && (
				<span className="bg-indigo-600 text-white text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center gap-1">
          SD Verified
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        </span>
			)}

			{/* Tiny loading indicator while checking */}
			{isSdVerified === null && (
				<span className="text-xs text-muted-foreground">·</span>
			)}
		</div>
	);
}