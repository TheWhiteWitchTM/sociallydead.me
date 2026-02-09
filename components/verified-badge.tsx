"use client"

import { BadgeCheck, ShieldCheck } from "lucide-react"
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip"
import useSWR from "swr"

interface VerifiedBadgeProps {
	handle: string
	did?: string
	className?: string
}

type VerificationType = "bluesky" | "gold" | "green" | "blue" | null

// Check Bluesky official verification via the public API
async function checkBlueskyVerification(did: string): Promise<boolean> {
	if (!did) return false
	try {
		const res = await fetch(
			`https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${encodeURIComponent(did)}`
		)
		if (!res.ok) return false
		const data = await res.json()
		// Bluesky official verification is in the `verification` field
		if (data.verification?.verifications?.length > 0) {
			return true
		}
		return false
	} catch {
		return false
	}
}

export function getVerificationType(handle: string): VerificationType {
	// Invalid or deleted accounts get nothing
	if (!handle || handle === "handle.invalid" || handle.endsWith(".invalid")) {
		return null
	}

	// Gold checkmark for SociallyDead users
	if (handle.endsWith(".sociallydead.me") || handle === "sociallydead.me") {
		return "gold"
	}

	// Green checkmark for domain-verified users (not using bsky.social)
	if (!handle.endsWith(".bsky.social")) {
		return "green"
	}

	// No static checkmark for regular bsky.social users
	return null
}

export function VerifiedBadge({ handle, did, className = "" }: VerifiedBadgeProps) {
	// Bail early for invalid/deleted handles
	if (!handle || handle === "handle.invalid" || handle.endsWith(".invalid")) {
		return null
	}

	const staticType = getVerificationType(handle)

	// Check Bluesky official verification (async, cached)
	const { data: isBlueskyVerified } = useSWR(
		did ? `bsky-verified:${did}` : null,
		() => checkBlueskyVerification(did!),
		{
			revalidateOnFocus: false,
			revalidateOnReconnect: false,
			dedupingInterval: 600000, // 10 min dedup
		}
	)

	// Only check app repo if no static badge and no Bluesky badge
	const shouldCheckAppRepo = !staticType && !isBlueskyVerified && !!did
	const { data: isSdVerified } = useSWR(
		shouldCheckAppRepo ? `sd-verified:${did}` : null,
		async () => {
			try {
				const res = await fetch(`/api/app-record?rkey=${encodeURIComponent(did!)}`);
				if (!res.ok) return false;
				const json = await res.json();
				return json.record?.verified === true;
			} catch {
				return false;
			}
		},
		{
			revalidateOnFocus: false,
			revalidateOnReconnect: false,
			dedupingInterval: 300000, // 5 min dedup
		}
	)

	// Precedence: Bluesky > Gold > Green > Blue (only if none of the above)
	let type: VerificationType = staticType || (isBlueskyVerified ? "bluesky" : null);

	if (!type && isSdVerified) {
		type = "blue";
	}

	if (!type) return null;

	const badgeStyles = {
		bluesky: "bg-blue-500 text-white",
		gold: "bg-yellow-500 text-black",
		green: "bg-green-500 text-white",
		blue: "bg-indigo-600 text-white",
	};

	const tooltipText = {
		bluesky: "Bluesky Verified",
		gold: "SociallyDead Domain",
		green: "Domain Verified",
		blue: "SociallyDead Verified",
	};

	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
          <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${badgeStyles[type]} ${className}`}>
            {type === "blue" ? (
	            <>
		            SD Verified
		            <ShieldCheck className="ml-1 h-3 w-3" />
	            </>
            ) : (
	            <>
		            Verified
		            <BadgeCheck className="ml-1 h-3 w-3" />
	            </>
            )}
          </span>
				</TooltipTrigger>
				<TooltipContent>
					<p>{tooltipText[type]}</p>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}