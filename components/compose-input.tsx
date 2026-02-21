"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { RichText } from '@atproto/api'
import { Loader2, ImagePlus, X, Hash, Video, ExternalLink, Bold, Italic, Heading1, Heading2, List, ListOrdered, Code, Link2, Strikethrough, Quote, SmilePlus, AtSign, Send, PenSquare } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
import { BlueskyRichText } from "@/components/bluesky/bluesky-rich-text"

const EMOJI_CATEGORIES = { /* unchanged */ } as const

const POPULAR_HASHTAGS = [ /* unchanged */ ]

interface MentionSuggestion { /* unchanged */ }

export interface LinkCardData { /* unchanged */ }

export type MediaFile = { /* unchanged */ }

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"]
const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"]
const ALL_MEDIA_TYPES = [...IMAGE_TYPES, ...VIDEO_TYPES]
const MAX_IMAGES = 4
const MAX_VIDEO_SIZE = 50 * 1024 * 1024

function extractUrl(text: string): string | null {
  /* unchanged */
}

interface ComposeInputProps {
  /* unchanged */
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
  const editableRef = useRef<HTMLDivElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)

  // ... all your state variables unchanged ...

  const syncScroll = useCallback(() => {
    if (editableRef.current && previewRef.current) {
      previewRef.current.scrollTop = editableRef.current.scrollTop
      previewRef.current.scrollLeft = editableRef.current.scrollLeft
    }
  }, [])

  useEffect(() => {
    if (autoFocus && editableRef.current) {
      editableRef.current.focus()
    }
  }, [autoFocus])

  const handleTextInput = useCallback(() => {
    if (!editableRef.current) return
    const newText = editableRef.current.textContent || ''
    onTextChange(newText)

    // ... warning sound, link card debounce unchanged ...

    // Suggestion trigger (unchanged)
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) return
    const range = sel.getRangeAt(0)
    const container = range.commonAncestorContainer
    if (container.nodeType !== Node.TEXT_NODE) return
    const textBeforeCursor = (container as Text).textContent?.slice(0, range.startOffset) || ''

    // ... mention/hashtag match logic unchanged ...
  }, [onTextChange, /* dependencies unchanged */])

  const insertAtCursor = useCallback((toInsert: string) => {
    const el = editableRef.current
    if (!el) return

    el.focus()

    const sel = window.getSelection()
    let range: Range
    if (sel && sel.rangeCount > 0) {
      range = sel.getRangeAt(0)
    } else {
      range = document.createRange()
      range.selectNodeContents(el)
      range.collapse(false)
    }

    range.deleteContents()
    range.insertNode(document.createTextNode(toInsert))

    range.collapse(false)
    sel?.removeAllRanges()
    sel?.addRange(range)

    onTextChange(el.textContent || '')
  }, [onTextChange])

  // ... insertSuggestion, insertEmoji, wrapSelection, insertAtLineStart unchanged (they use insertAtCursor or selection API) ...

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // ... unchanged ...
  }, [/* dependencies unchanged */])

  // ... handleMediaSelect, removeMedia, dismissLinkCard, searchMentionsPicker, insertSelectedMentions, insertSelectedHashtags unchanged ...

  return (
    <div className="space-y-2">
      <Card className="border-2 focus-within:border-primary transition-colors overflow-hidden">
        <div className="border-b border-border bg-muted/30 px-4 py-1.5 flex items-center justify-between">
          {/* header unchanged */}
        </div>

        <div className="relative">
          {/* Rich preview layer (read-only) */}
          <div
            ref={previewRef}
            className={cn(
              "absolute inset-0 pointer-events-none px-4 py-3 whitespace-pre-wrap break-words text-sm overflow-hidden select-none z-0 leading-[1.5]",
              minHeight
            )}
            style={{
              fontFamily: 'inherit',
              fontSize: '0.875rem',
              lineHeight: '1.5',
              letterSpacing: 'normal',
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
              whiteSpace: 'pre-wrap',
              caretColor: 'transparent',
            }}
            aria-hidden="true"
          >
            <BlueskyRichText record={getLiveRichText(text)} />
          </div>

          {/* Editable layer */}
          <div
            ref={editableRef}
            contentEditable
            suppressContentEditableWarning
            onInput={handleTextInput}
            onKeyDown={handleKeyDown}
            onPaste={(e) => {
              e.preventDefault()
              const pasted = (e.clipboardData || window.clipboardData).getData('text')
              document.execCommand('insertText', false, pasted)
            }}
            onScroll={syncScroll}
            className={cn(
              "relative z-10 px-4 py-3 text-sm leading-[1.5] tracking-normal outline-none min-h-[8rem] whitespace-pre-wrap break-words bg-transparent caret-foreground",
              minHeight
            )}
            style={{
              fontFamily: 'inherit',
              fontSize: '0.875rem',
              lineHeight: '1.5',
              letterSpacing: 'normal',
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
              whiteSpace: 'pre-wrap',
            }}
          />
        </div>

        {/* suggestions popups unchanged */}
      </Card>

      {/* ... rest of component (toolbar, media, link card, dialogs) unchanged ... */}
    </div>
  )
}

function getLiveRichText(text: string) {
  const rt = new RichText({ text })
  rt.detectFacetsWithoutResolution()
  return {
    text: rt.text,
    facets: rt.facets ?? [],
  }
}

export { IMAGE_TYPES, VIDEO_TYPES, MAX_VIDEO_SIZE }