"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Loader2, ImagePlus, X, Hash, Video, ExternalLink, Bold, Italic, Heading1, Heading2, List, ListOrdered, Code, Link2, Strikethrough, Quote, SmilePlus, AtSign, Send, Smile, PenSquare } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { useBluesky } from "@/lib/bluesky-context"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { VerifiedBadge } from "@/components/verified-badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

// Your constants (unchanged)
const EMOJI_CATEGORIES = { /* ... your full object ... */ } as const
const POPULAR_HASHTAGS = [ /* ... your array ... */ ]

// Your interfaces and types (unchanged)
interface MentionSuggestion { /* ... */ }
export interface LinkCardData { /* ... */ }
export type MediaFile = { /* ... */ }

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"]
const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"]
const ALL_MEDIA_TYPES = [...IMAGE_TYPES, ...VIDEO_TYPES]
const MAX_IMAGES = 4
const MAX_VIDEO_SIZE = 50 * 1024 * 1024

// Your extractUrl function (unchanged)
function extractUrl(text: string): string | null { /* ... your code ... */ }

interface ComposeInputProps { /* ... your full props interface ... */ }

export function ComposeInput({
                               text,
                               onTextChange,
                               mediaFiles = [],
                               onMediaFilesChange,
                               linkCard = null,
                               onLinkCardChange,
                               placeholder = "What's happening?",
                               minHeight = "min-h-32",
                               maxChars,
                               postType = "post",
                               compact = false,
                               autoFocus = false,
                               onSubmit,
                               onCancel,
                               showSubmitButton = false,
                               submitButtonText = "Send",
                               isSubmitting = false,
                             }: ComposeInputProps) {
  const isDM = postType === "dm"
  const effectiveMaxChars = maxChars ?? (isDM ? Infinity : postType === "article" ? 2000 : 300)

  // … all your useBluesky, refs, state declarations exactly as before …

  const charCount = text.length
  const isOverLimit = effectiveMaxChars !== Infinity && charCount > effectiveMaxChars

  const progress = effectiveMaxChars !== Infinity ? Math.min((charCount / effectiveMaxChars) * 100, 100) : 0
  const isNearLimit = progress >= 70
  const isWarning = progress >= 90

  // … all your useCallback, useEffect, functions (handleTextChange, insertSuggestion, etc.) unchanged …

  return (
    <div className="space-y-4">
      <Card className="border-2 focus-within:border-primary transition-colors overflow-hidden">
        <div className="border-b border-border bg-muted/30 px-4 py-1.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PenSquare className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">
              {postType === "reply" ? "Replying" :
                postType === "quote" ? "Quoting" :
                  postType === "dm" ? "Direct Message" :
                    postType === "article" ? "Writing Article" :
                      "New Post"}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!isDM && effectiveMaxChars !== Infinity && (
              <div className="relative h-7 w-7 flex items-center justify-center">
                <svg className="h-7 w-7 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="16" fill="none" className="stroke-muted/30" strokeWidth="3" />
                  <circle
                    cx="18"
                    cy="18"
                    r="16"
                    fill="none"
                    strokeWidth="3"
                    strokeDasharray="100"
                    strokeDashoffset={100 - progress}
                    className={cn(
                      "transition-all duration-300",
                      progress < 70 ? "stroke-green-500" :
                        progress < 90 ? "stroke-orange-500" :
                          "stroke-red-600"
                    )}
                    strokeLinecap="round"
                  />
                </svg>
                <span
                  className={cn(
                    "absolute text-xs font-medium tabular-nums",
                    isOverLimit ? "text-red-600 font-bold" :
                      isWarning ? "text-red-600 font-bold" :
                        isNearLimit ? "text-orange-500" :
                          "text-muted-foreground"
                  )}
                >
                  {charCount}{effectiveMaxChars !== Infinity && ` / ${effectiveMaxChars}`}
                </span>
              </div>
            )}

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-3 text-xs"
              onClick={handleCancelOrEscape}
              disabled={isSubmitting}
            >
              Cancel
            </Button>

            {onSubmit && (
              <Button
                onClick={onSubmit}
                disabled={
                  isSubmitting ||
                  (!text.trim() && mediaFiles.length === 0) ||
                  isOverLimit
                }
                size="sm"
                className="h-7 px-3 text-xs font-bold"
              >
                {isSubmitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5 mr-1.5" />
                    {postType === "reply" ? "Reply" : postType === "dm" ? "Send" : "Post"}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* The rest of your JSX — highlighter + textarea + suggestions + toolbar + media preview + link card + dialogs — copy-paste your original working version here. Do NOT replace this part with mine if it differs. */}
      </Card>
    </div>
  )
}

export { IMAGE_TYPES, VIDEO_TYPES, MAX_VIDEO_SIZE }