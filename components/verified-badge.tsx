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

// Check supporter record from PDS
async function checkSupporterRecord(did: string): Promise<boolean> {
  if (!did) return false
  try {
    const res = await fetch(
      `https://public.api.bsky.app/xrpc/com.atproto.repo.getRecord?repo=${encodeURIComponent(did)}&collection=me.sociallydead.supporter&rkey=self`
    )
    if (!res.ok) return false
    const data = await res.json()
    return !!data?.value?.verifiedAt
  } catch {
    return false
  }
}

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
    // It contains `verifications` array with trustedVerifiers
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
  // Blue/Bluesky checkmarks are determined by async checks
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
  
  // Only check PDS supporter if there's no static badge, no bluesky badge, and we have a DID
  const shouldCheckPDS = !staticType && !isBlueskyVerified && !!did
  const { data: isSupporter } = useSWR(
    shouldCheckPDS ? `supporter:${did}` : null,
    () => checkSupporterRecord(did!),
    { 
      revalidateOnFocus: false, 
      revalidateOnReconnect: false,
      dedupingInterval: 300000, // 5 min dedup
    }
  )
  
  // Priority: Bluesky official > gold (SociallyDead) > green (domain) > blue (supporter)
  let verificationType: VerificationType = null
  if (isBlueskyVerified) {
    verificationType = "bluesky"
  } else if (staticType) {
    verificationType = staticType
  } else if (isSupporter) {
    verificationType = "blue"
  }
  
  if (!verificationType) {
    return null
  }
  
  const config = {
    bluesky: {
      color: "text-yellow-500",
      label: "Bluesky Verified",
      description: "Officially verified by Bluesky",
      Icon: ShieldCheck,
    },
    gold: {
      color: "text-yellow-500",
      label: "SociallyDead Verified",
      description: "This account is verified through SociallyDead",
      Icon: BadgeCheck,
    },
    green: {
      color: "text-green-500",
      label: "Domain Verified",
      description: "This account owns their domain",
      Icon: BadgeCheck,
    },
    blue: {
      color: "text-blue-500",
      label: "Supporter Verified",
      description: "This account supports SociallyDead",
      Icon: BadgeCheck,
    },
  }
  
  const { color, label, description, Icon } = config[verificationType]
  
  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <Icon 
            className={`h-4 w-4 ${color} ${className} inline-block shrink-0`}
            aria-label={label}
          />
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="font-semibold">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
