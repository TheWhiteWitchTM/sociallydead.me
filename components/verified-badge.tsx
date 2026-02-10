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
		if (data.verification?.verifications?.length > 0) {
			return true
		}
		return false
	} catch {
		return false
	}
}

export function getVerificationType(handle: string): VerificationType {
	if (!handle || handle === "handle.invalid" || handle.endsWith(".invalid")) {
		return null
	}

	if (handle.endsWith(".sociallydead.me") || handle === "sociallydead.me") {
		return "gold"
	}

	if (!handle.endsWith(".bsky.social")) {
		return "green"
	}

	return null
}

export function VerifiedBadge({ handle, did, className = "" }: VerifiedBadgeProps) {
	if (!handle || handle === "handle.invalid" || handle.endsWith(".invalid")) {
		return null
	}

	const staticType = getVerificationType(handle)

	const { data: isBlueskyVerified } = useSWR(
		did ? `bsky-verified:${did}` : null,
		() => checkBlueskyVerification(did!),
		{
			revalidateOnFocus: false,
			revalidateOnReconnect: false,
			dedupingInterval: 600000,
		}
	)

	const shouldCheckAppRepo = !staticType && !isBlueskyVerified && !!did
	const { data: isAppVerified } = useSWR(
		shouldCheckAppRepo ? `app-verified:${did}` : null,
		async () => {
			try {
				const res = await fetch(`/api/app-record?rkey=${encodeURIComponent(did!)}`);
				if (!res.ok) return false
				const json = await res.json()
				return json.record?.verified === true
			} catch {
				return false
			}
		},
		{
			revalidateOnFocus: false,
			revalidateOnReconnect: false,
			dedupingInterval: 300000,
		}
	)

	// Precedence: Bluesky > Gold > Green > Blue (only if none above)
	let type: VerificationType = staticType || (isBlueskyVerified ? "bluesky" : null)

	if (!type && isAppVerified) {
		type = "blue"
	}

	if (!type) return null

	const badgeStyles = {
		bluesky: "text-yellow-600 ",
		gold: "text-yellow-500",
		green: "text-green-500",
		blue: "text-blue-500",
	}

	const tooltipText = {
		bluesky: "Bluesky Verified",
		gold: "SociallyDead Domain",
		green: "Domain Verified",
		blue: "SociallyDead Verified",
	}

	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
          <span className={`inline-flex items-center text-xs font-medium shrink-0 ${badgeStyles[type]} ${className}`} style={{ width: (className?.includes('h-') || className?.includes('w-')) ? undefined : '1rem', height: (className?.includes('h-') || className?.includes('w-')) ? undefined : '1rem' }}>
	          <BadgeCheck className="h-full w-full" />
          </span>
				</TooltipTrigger>
				<TooltipContent>
					<p>{tooltipText[type]}</p>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	)
}