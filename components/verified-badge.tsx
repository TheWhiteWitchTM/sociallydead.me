"use client"

import { BadgeCheck } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface VerifiedBadgeProps {
  handle: string
  className?: string
}

type VerificationType = "gold" | "green" | "blue" | null

// Handles of PayPal supporters who get the blue badge
// Add handles here (without @) when someone donates
const BLUE_VERIFIED_HANDLES = new Set<string>([
  // "supporter.bsky.social",
])

export function getVerificationType(handle: string): VerificationType {
  // Gold checkmark for SociallyDead users
  if (handle.endsWith(".sociallydead.me") || handle === "sociallydead.me") {
    return "gold"
  }
  
  // Green checkmark for domain-verified users (not using bsky.social)
  if (!handle.endsWith(".bsky.social")) {
    return "green"
  }
  
  // Blue checkmark for PayPal supporters
  if (BLUE_VERIFIED_HANDLES.has(handle.toLowerCase())) {
    return "blue"
  }
  
  // No checkmark for regular bsky.social users
  return null
}

export function VerifiedBadge({ handle, className = "" }: VerifiedBadgeProps) {
  const verificationType = getVerificationType(handle)
  
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
      label: "Verified",
      description: "This account is verified",
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
