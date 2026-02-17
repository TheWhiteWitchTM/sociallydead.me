"use client"

import { BadgeCheck, ShieldCheck, Star } from "lucide-react"
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip"
import useSWR from "swr"
import { useSociallyDeadRepo } from "@/lib/sociallydead-repo-context"

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
		if (data.verification.verifications) {
			if (data.verification.verifications.length > 0) {
				return true
			}
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

	const { getRecord } = useSociallyDeadRepo()

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
	const { record } = getRecord(shouldCheckAppRepo ? did! : "")
	const isAppVerified = record?.verified === true
	const hasStar = record?.star === true

	// If user is a star supporter, show a gold star regardless of other types
	if (hasStar) {
		return (
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild>
	          <span 
	            className={`inline-flex items-center justify-center font-medium shrink-0 text-yellow-500 ${className}`} 
	            style={{ 
	              width: (className?.includes('h-') || className?.includes('w-')) ? undefined : '1.1em', 
	              height: (className?.includes('h-') || className?.includes('w-')) ? undefined : '1.1em',
	              marginLeft: (className?.includes('ml-')) ? undefined : '0.125rem'
	            }}
	          >
		          <Star className="h-full w-full fill-yellow-500/30" />
	          </span>
					</TooltipTrigger>
					<TooltipContent>
						<p>Gold Star Supporter</p>
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		)
	}

	// Precedence: Bluesky > Gold > Green > Blue (only if none above)
	let type: VerificationType = staticType || (isBlueskyVerified ? "bluesky" : null)

	if (!type && isAppVerified) {
		type = "blue"
	}

	if (!type) return null

	const badgeStyles = {
		bluesky: "text-yellow-600",
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
          <span 
            className={`inline-flex items-center justify-center font-medium shrink-0 ${badgeStyles[type]} ${className}`} 
            style={{ 
              width: (className?.includes('h-') || className?.includes('w-')) ? undefined : '1.1em', 
              height: (className?.includes('h-') || className?.includes('w-')) ? undefined : '1.1em',
              marginLeft: (className?.includes('ml-')) ? undefined : '0.125rem'
            }}
          >
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