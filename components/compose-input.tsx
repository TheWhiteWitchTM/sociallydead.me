"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Loader2, ImagePlus, X, Hash, Video, ExternalLink, Bold, Italic, Heading1, Heading2, List, ListOrdered, Code, Link2, Strikethrough, Quote, SmilePlus, AtSign, Send, Smile, Separator, PenSquare } from "lucide-react"
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

// ────────────────────────────────────────────────
// Your original constants, types, extractUrl, etc. (unchanged)
// ────────────────────────────────────────────────

const EMOJI_CATEGORIES = { /* your full object */ } as const
const POPULAR_HASHTAGS = [ /* your full array */ ]

interface MentionSuggestion { /* ... */ }
export interface LinkCardData { /* ... */ }
export type MediaFile = { /* ... */ }

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"]
const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"]
const ALL_MEDIA_TYPES = [...IMAGE_TYPES, ...VIDEO_TYPES]
const MAX_IMAGES = 4
const MAX_VIDEO_SIZE = 50 * 1024 * 1024

function extractUrl(text: string): string | null { /* your original */ }

// ... (keep formatActions, renderHighlightedText, all your helpers unchanged)

interface ComposeInputProps {
  text: string
  onTextChange: (text: string) => void
  mediaFiles?: MediaFile[]
  onMediaFilesChange?: (files: MediaFile[]) => void
  linkCard?: LinkCardData | null
  onLinkCardChange?: (card: LinkCardData | null) => void
  placeholder?: string
  minHeight?: string
  maxChars?: number
  postType?: "post" | "reply" | "quote" | "article" | "dm"
  compact?: boolean
  autoFocus?: boolean
  onSubmit?: () => void
  onCancel?: () => void
  showSubmitButton?: boolean
  submitButtonText?: string
  isSubmitting?: boolean
}

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
  const { searchActors, searchActorsTypeahead } = useBluesky()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const highlighterRef = useRef<HTMLDivElement>(null)

  // ── Your existing state ──
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false)
  const [showHashtagSuggestions, setShowHashtagSuggestions] = useState(false)
  const [mentionSuggestions, setMentionSuggestions] = useState<MentionSuggestion[]>([])
  const [hashtagSuggestions, setHashtagSuggestions] = useState<string[]>([])
  const [autocompletePosition, setAutocompletePosition] = useState(0)
  const [autocompleteCoords, setAutocompleteCoords] = useState({ top: 0, left: 0 })
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0)
  const [isSearchingMentions, setIsSearchingMentions] = useState(false)

  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false)
  const [emojiCategory, setEmojiCategory] = useState<keyof typeof EMOJI_CATEGORIES>("Smileys")

  const [mentionPickerOpen, setMentionPickerOpen] = useState(false)
  const [mentionSearch, setMentionSearch] = useState("")
  const [mentionPickerResults, setMentionPickerResults] = useState<MentionSuggestion[]>([])
  const [selectedMentions, setSelectedMentions] = useState<Set<string>>(new Set())
  const [isSearchingPicker, setIsSearchingPicker] = useState(false)

  const [hashtagPickerOpen, setHashtagPickerOpen] = useState(false)
  const [hashtagSearch, setHashtagSearch] = useState("")
  const [selectedHashtags, setSelectedHashtags] = useState<Set<string>>(new Set())

  const [linkCardLoading, setLinkCardLoading] = useState(false)
  const [linkCardUrl, setLinkCardUrl] = useState<string | null>(null)
  const [linkCardDismissed, setLinkCardDismissed] = useState(false)

  // ── New state for discard confirmation ──
  const [showDiscardDialog, setShowDiscardDialog] = useState(false)

  const hasVideo = mediaFiles.some(f => f.type === "video")
  const hasImages = mediaFiles.some(f => f.type === "image")
  const imageCount = mediaFiles.filter(f => f.type === "image").length
  const canAddMedia = !hasVideo && imageCount < MAX_IMAGES

  const charCount = text.length

  // ── Your existing effects and handlers (unchanged except handleKeyDown) ──
  // ... keep useEffect, playWarningSound, fetchLinkCard, searchMentions, etc. ...

  // Updated handleKeyDown with discard dialog
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.shiftKey && onSubmit && !isSubmitting) {
      e.preventDefault()
      if (text.trim()) {
        onSubmit()
      }
      return
    }

    if (e.key === 'Escape') {
      if (showMentionSuggestions || showHashtagSuggestions) {
        setShowMentionSuggestions(false)
        setShowHashtagSuggestions(false)
      } else if (text.trim() || mediaFiles.length > 0 || linkCard) {
        setShowDiscardDialog(true)
        e.preventDefault()
      } else if (onCancel) {
        onCancel()
      }
      return
    }

    if (!showMentionSuggestions && !showHashtagSuggestions) return
    const suggestions = showMentionSuggestions ? mentionSuggestions : hashtagSuggestions

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedSuggestionIndex(prev => prev < suggestions.length - 1 ? prev + 1 : 0)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : suggestions.length - 1)
    } else if (e.key === 'Enter' && suggestions.length > 0) {
      e.preventDefault()
      if (showMentionSuggestions && mentionSuggestions[selectedSuggestionIndex]) {
        insertSuggestion(mentionSuggestions[selectedSuggestionIndex].handle, 'mention')
      } else if (showHashtagSuggestions && hashtagSuggestions[selectedSuggestionIndex]) {
        insertSuggestion(hashtagSuggestions[selectedSuggestionIndex], 'hashtag')
      }
    }
  }

  // ... keep handleTextChange, insertSuggestion, handleMediaSelect, removeMedia, etc. unchanged ...

  // New handler for discard confirmation
  const handleDiscard = () => {
    onTextChange("")
    onMediaFilesChange?.([])
    onLinkCardChange?.(null)
    setShowMentionSuggestions(false)
    setShowHashtagSuggestions(false)
    if (onCancel) onCancel()
    setShowDiscardDialog(false)
  }

  return (
    <div className="space-y-4">
      <Card className="border-2 focus-within:border-primary transition-colors overflow-hidden">
        {/* Title Bar - Shows what you're composing */}
        <div className="border-b border-border bg-muted/30 px-4 py-1.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PenSquare className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">{composeType}</span>
          </div>

          {/* Always show Cancel + counter + submit */}
          <div className="flex items-center gap-2 shrink-0">
            {!isDM && effectiveMaxChars !== Infinity && (
              <span className={cn(
                "font-medium tabular-nums transition-colors text-xs",
                charCount < effectiveMaxChars * 0.8 && "text-muted-foreground",
                charCount >= effectiveMaxChars * 0.8 && charCount < effectiveMaxChars * 0.9 && "text-orange-500",
                charCount >= effectiveMaxChars * 0.9 && "text-destructive font-bold"
              )}>
                {charCount}/{effectiveMaxChars}
              </span>
            )}

            {/* Cancel - always visible */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-3 text-xs"
              onClick={() => {
                if (text.trim() || mediaFiles.length > 0 || linkCard) {
                  setShowDiscardDialog(true)
                } else if (onCancel) {
                  onCancel()
                }
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>

            {onSubmit && (
              <Button
                onClick={onSubmit}
                disabled={isSubmitting || (!text.trim() && mediaFiles.length === 0)}
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

        {/* Rest of your component unchanged: text area, suggestions, toolbar, media previews, link card */}
        {/* ... paste the rest of your original return JSX here ... */}

      </Card>

      {/* Discard confirmation dialog */}
      <AlertDialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard {postType === "dm" ? "message" : "post"}?</AlertDialogTitle>
            <AlertDialogDescription>
              This {postType === "dm" ? "message" : "post"} will be permanently discarded.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDiscard}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Your existing Mention & Hashtag Dialogs stay here unchanged */}
      {/* ... */}
    </div>
  )
}

export { IMAGE_TYPES, VIDEO_TYPES, MAX_VIDEO_SIZE }