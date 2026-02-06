"use client"

import { BadgeCheck } from "lucide-react"
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

type VerificationType = "gold" | "green" | "blue" | null

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

export function getVerificationType(handle: string): VerificationType {
  // Gold checkmark for SociallyDead users
  if (handle.endsWith(".sociallydead.me") || handle === "sociallydead.me") {
    return "gold"
  }
  
  // Green checkmark for domain-verified users (not using bsky.social)
  if (!handle.endsWith(".bsky.social")) {
    return "green"
  }
  
  // No static checkmark for regular bsky.social users
  // Blue checkmark is determined by PDS record (async)
  return null
}

export function VerifiedBadge({ handle, did, className = "" }: VerifiedBadgeProps) {
  const staticType = getVerificationType(handle)
  
  // Only check PDS if there's no static badge and we have a DID
  const shouldCheckPDS = !staticType && !!did
  const { data: isSupporter } = useSWR(
    shouldCheckPDS ? `supporter:${did}` : null,
    () => checkSupporterRecord(did!),
    { 
      revalidateOnFocus: false, 
      revalidateOnReconnect: false,
      dedupingInterval: 300000, // 5 min dedup
    }
  )
  
  const verificationType = staticType || (isSupporter ? "blue" : null)
  
  if (!verificationType) {
    return null
  }
  
  const config = {
    gold: {
      color: "text-yellow-500",
      label: "SociallyDead Verified",
      description: "This account is verified through SociallyDead",
    },
    green: {
      color: "text-green-500",
      label: "Domain Verified",
      description: "This account owns their domain",
    },
    blue: {
      color: "text-blue-500",
      label: "Supporter Verified",
      description: "This account supports SociallyDead",
    },
  }
  
  const { color, label, description } = config[verificationType]
  
  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <BadgeCheck 
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
