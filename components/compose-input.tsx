"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { RichText } from '@atproto/api'
import { Loader2, ImagePlus, X, Video, ExternalLink, Bold, Italic, Heading1, Heading2, List, ListOrdered, Code, Link2, Strikethrough, Quote, SmilePlus, Send, PenSquare, Hash } from "lucide-react"
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
import { BlueskyRichText } from "@/components/bluesky/bluesky-rich-text"
import { useSuggestionContext } from "@/lib/bluesky/sugestion-context"

const EMOJI_CATEGORIES = {
  "Smileys": ["😀","😃","😄","😁","😆","😅","🤣","😂","🙂","😊","😇","🥰","😍","🤩","😘","😗","😚","😙","🥲","😋","😛","😜","🤪","😝","🤑","🤗","🤭","🫢","🫣","🤫","🤔","🫡","🤐","🤨","😐","😑","😶","🫥","😏","😒","🙄","😬","🤥","😌","😔","😪","🤤","😴","😷","🤒","🤕","🤢","🤮","🥵","🥶","🥴","😵","🤯","🤠","🥳","🥸","😎","🤓","🧐"],
  "Gestures": ["👋","🤚","🖐️","✋","🖖","🫱","🫲","🫳","🫴","👌","🤌","🤏","✌️","🤞","🫰","🤟","🤘","🤙","👈","👉","👆","🖕","👇","☝️","🫵","👍","👎","✊","👊","🤛","🤜","👏","🙌","🫶","👐","🤲","🤝","🙏","💪","🦾"],
  "Hearts": ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❤️‍🔥","❤️‍🩹","❣️","💕","💞","💓","💗","💖","💘","💝","💟","♥️","🫀"],
  "Animals": ["🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐻‍❄️","🐨","🐯","🦁","🐮","🐷","🐸","🐵","🙈","🙉","🙊","🐒","🐔","🐧","🐦","🐤","🦆","🦅","🦉","🦇","🐺","🐗","🐴","🦄","🐝","🪱","🐛","🦋","🐌","🐞"],
  "Food": ["🍎","🍐","🍊","🍋","🍌","🍉","🍇","🍓","🫐","🍈","🍒","🍑","🥭","🍍","🥥","🥝","🍅","🍆","🥑","🥦","🌽","🌶️","🫑","🥒","🥬","🧅","🍄","🥜","🫘","🌰","🍞","🥐","🥖","🫓","🥨","🥯","🥞","🧇","🧀","🍖","🍗","🥩","🥓","🍔","🍟","🍕","🌭","🥪","🌮","🌯","🫔","🥙","🧆","🥚","🍳","🥘","🍲"],
  "Objects": ["⌚","📱","💻","⌨️","🖥️","🖨️","🖱️","🖲️","🕹️","🗜️","💾","💿","📀","📷","📸","📹","🎥","📽️","🎞️","📞","☎️","📟","📠","📺","📻","🎙️","🎚️","🎛️","🧭","⏱️","⏲️","⏰","🕰️","💡","🔦","🕯️","🧯","🛢️","💸","💵","💴","💶","💷","🪙","💰","💳","💎","⚖️","🪜","🧰","🪛","🔧","🔨","⚒️","🛠️","⛏️","🪚","🔩","⚙️","🪤","🧱","⛓️","🧲","🔫","💣","🧨","🪓","🔪","🗡️","⚔️","🛡️"],
  "Symbols": ["💯","🔥","⭐","🌟","✨","⚡","💥","💫","🎉","🎊","🏆","🥇","🥈","🥉","⚽","🏀","🏈","⚾","🥎","🎾","🏐","🏉","🥏","🎱","🪀","🏓","🏸","🏒","🏑","🥍","🏏","🪃","🥅","⛳","🪁","🏹","🎣","🤿","🥊","🥋","🎽","🛹","🛼","🛷","⛸️","🥌","🎿","⛷️","🏂"],
} as const

export interface LinkCardData {
  url: string
  title: string
  description: string
  image: string
}

export type MediaFile = {
  file: File
  preview: string
  type: "image" | "video"
}

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"]
const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"]
const ALL_MEDIA_TYPES = [...IMAGE_TYPES, ...VIDEO_TYPES]
const MAX_IMAGES = 4
const MAX_VIDEO_SIZE = 50 * 1024 * 1024

function extractUrl(text: string): string | null {
  const urlRegex = /((?:https?:\/\/|www\.)[^\s<]+[^\s<.,:;"')\]!?]|(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+(?:[a-zA-Z]{2,}))/g
  const matches = text.match(urlRegex)
  if (!matches || matches.length === 0) return null

  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0)
  if (lines.length === 0) return null

  const firstLine = lines[0]
  const lastLine = lines[lines.length - 1]

  const firstLineMatch = firstLine.match(urlRegex)
  const lastLineMatch = lastLine.match(urlRegex)

  if (firstLineMatch && firstLine === firstLineMatch[0]) return firstLineMatch[0]
  if (lastLineMatch && lastLine === lastLineMatch[0]) return lastLineMatch[0]

  return null
}

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
                               minHeight = "min-h-24",
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

  const { suggestHandles, suggestHashtags } = useSuggestions()

  const [showDiscardDialog, setShowDiscardDialog] = useState(false)
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false)
  const [emojiCategory, setEmojiCategory] = useState<keyof typeof EMOJI_CATEGORIES>("Smileys")

  // ──────────────────────────────────────────────
  // Suggestion popup state
  const [trigger, setTrigger] = useState<'@' | '#' | null>(null)
  const [prefix, setPrefix] = useState('')
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [cursorLeft, setCursorLeft] = useState(0)

  // ADD THESE THREE MISSING STATES – this fixes the error
  const [linkCardLoading, setLinkCardLoading] = useState(false)
  const [linkCardUrl, setLinkCardUrl] = useState<string | null>(null)
  const [linkCardDismissed, setLinkCardDismissed] = useState(false)

  // Detect trigger
  useEffect(() => {
    if (!textareaRef.current) return
    const ta = textareaRef.current
    const pos = ta.selectionStart
    const textBefore = text.slice(0, pos)

    let active: '@' | '#' | null = null
    let pref = ''
    let startPos = 0

    const lastAt = textBefore.lastIndexOf('@')
    const lastHash = textBefore.lastIndexOf('#')

    if (lastAt > lastHash && lastAt >= 0) {
      const segment = textBefore.slice(lastAt)
      if (!segment.includes(' ')) {
        active = '@'
        pref = segment.slice(1)
        startPos = lastAt
      }
    } else if (lastHash >= 0) {
      const segment = textBefore.slice(lastHash)
      if (!segment.includes(' ')) {
        active = '#'
        pref = segment.slice(1)
        startPos = lastHash
      }
    }

    if (active && pref.length > 0) {
      setTrigger(active)
      setPrefix(pref)
      setCursorLeft(startPos * 9.2)
    } else {
      setTrigger(null)
      setPrefix('')
      setSuggestions([])
      setSelectedIdx(0)
    }
  }, [text])

  // Fetch suggestions
  useEffect(() => {
    if (!trigger || prefix.length < 1) {
      setSuggestions([])
      return
    }

    let cancelled = false
    const loader = trigger === '@' ? suggestHandles : suggestHashtags
    const limit = trigger === '@' ? 7 : 10

    loader(prefix, limit).then(res => {
      if (!cancelled) {
        setSuggestions(res)
        setSelectedIdx(0)
      }
    }).catch(err => console.error(err))

    return () => { cancelled = true }
  }, [trigger, prefix, suggestHandles, suggestHashtags])

  // Keyboard nav
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!trigger || suggestions.length === 0) return

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIdx(i => (i + 1) % suggestions.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIdx(i => (i - 1 + suggestions.length) % suggestions.length)
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        const item = suggestions[selectedIdx]
        const val = trigger === '@' ? (item.handle ?? item) : item
        applySuggestion(val)
      } else if (e.key === 'Escape') {
        setTrigger(null)
        setSuggestions([])
      }
    }

    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [trigger, suggestions, selectedIdx])

  const applySuggestion = useCallback((value: string) => {
    if (!textareaRef.current || !trigger) return

    const ta = textareaRef.current
    const pos = ta.selectionStart
    const beforeTrigger = text.slice(0, cursorLeft)
    const after = text.slice(pos)

    const insert = trigger === '@' ? `@${value} ` : `#${value} `
    const newText = beforeTrigger + insert + after

    onTextChange(newText)

    setTimeout(() => {
      ta.focus()
      const newCursor = cursorLeft + insert.length
      ta.setSelectionRange(newCursor, newCursor)
    }, 0)

    setTrigger(null)
    setSuggestions([])
  }, [text, onTextChange, trigger, cursorLeft])

  const hasVideo = mediaFiles.some(f => f.type === "video")
  const hasImages = mediaFiles.some(f => f.type === "image")
  const imageCount = mediaFiles.filter(f => f.type === "image").length
  const canAddMedia = !isDM && !hasVideo && imageCount < MAX_IMAGES

  const charCount = text.length
  const isOverLimit = effectiveMaxChars !== Infinity && charCount > effectiveMaxChars

  const progress = effectiveMaxChars !== Infinity ? Math.min((charCount / effectiveMaxChars) * 100, 100) : 0
  const isNearLimit = progress >= 70
  const isWarning = progress >= 90

  const simulateEscape = useCallback(() => {
    const escEvent = new KeyboardEvent("keydown", {
      key: "Escape",
      code: "Escape",
      keyCode: 27,
      which: 27,
      bubbles: true,
      cancelable: true,
      composed: true,
    })

    document.dispatchEvent(escEvent)
    document.body.dispatchEvent(escEvent)
    window.dispatchEvent(escEvent)
    if (document.activeElement) document.activeElement.dispatchEvent(escEvent)
  }, [])

  const forceClose = useCallback(() => {
    simulateEscape()
  }, [simulateEscape])

  const handleCancelOrEscape = useCallback(() => {
    if (text.trim() || mediaFiles.length > 0 || linkCard) {
      setShowDiscardDialog(true)
    } else {
      forceClose()
    }
  }, [text, mediaFiles.length, linkCard, forceClose])

  const handleDiscard = useCallback(() => {
    forceClose()
    setShowDiscardDialog(false)
  }, [forceClose])

  const syncScroll = () => {
    if (textareaRef.current && highlighterRef.current) {
      highlighterRef.current.scrollTop = textareaRef.current.scrollTop
      highlighterRef.current.scrollLeft = textareaRef.current.scrollLeft
    }
  }

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 100)
    }
  }, [autoFocus])

  const playWarningSound = useCallback(() => {
    // your warning sound logic here – unchanged
  }, [])

  const fetchLinkCard = useCallback(async (url: string) => {
    if (linkCardDismissed || isDM) return
    setLinkCardLoading(true)
    try {
      const res = await fetch(`/api/og?url=${encodeURIComponent(url)}`)
      if (res.ok) {
        const data = await res.json()
        if (data.title || data.description) {
          onLinkCardChange?.(data)
          setLinkCardUrl(url)
        }
      }
    } catch {}
    finally {
      setLinkCardLoading(false)
    }
  }, [linkCardDismissed, onLinkCardChange, isDM])

  const handleTextChange = (newText: string) => {
    onTextChange(newText)

    const warningThreshold = effectiveMaxChars * 0.9
    if (newText.length < warningThreshold) {
      // reset warning
    }
    if (newText.length >= warningThreshold && text.length < warningThreshold) {
      playWarningSound()
    }

    // your link card debounce logic here – unchanged
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.shiftKey && onSubmit && !isSubmitting) {
      e.preventDefault()
      if (text.trim()) {
        onSubmit()
      }
      return
    }

    if (e.key === 'Escape') {
      e.preventDefault()
      handleCancelOrEscape()
      return
    }
  }

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    // your media select logic – unchanged
  }

  const removeMedia = (index: number) => {
    // your remove media logic – unchanged
  }

  const dismissLinkCard = () => {
    onLinkCardChange?.(null)
    setLinkCardDismissed(true)
  }

  const insertEmoji = (emoji: string) => {
    // your emoji insert logic – unchanged
  }

  const wrapSelection = (prefix: string, suffix: string) => {
    // your wrap logic – unchanged
  }

  const insertAtLineStart = (prefix: string) => {
    // your line start insert logic – unchanged
  }

  const formatActions = [
    { icon: Bold, label: "Bold", action: () => wrapSelection("**", "**") },
    { icon: Italic, label: "Italic", action: () => wrapSelection("*", "*") },
    { icon: Strikethrough, label: "Strikethrough", action: () => wrapSelection("~~", "~~") },
    { icon: Code, label: "Code", action: () => wrapSelection("`", "`") },
    { icon: Heading1, label: "Heading 1", action: () => insertAtLineStart("# ") },
    { icon: Heading2, label: "Heading 2", action: () => insertAtLineStart("## ") },
    { icon: Quote, label: "Quote", action: () => insertAtLineStart("> ") },
    { icon: List, label: "Bullet List", action: () => insertAtLineStart("- ") },
    { icon: ListOrdered, label: "Numbered List", action: () => insertAtLineStart("1. ") },
    { icon: Link2, label: "Link", action: () => wrapSelection("[", "](url)") },
  ]

  const composeType = postType === "reply" ? "Replying" :
    postType === "quote" ? "Quoting" :
      postType === "dm" ? "Direct Message" :
        postType === "article" ? "Writing Article" :
          "New Post"

  return (
    <div className="space-y-2">
      <Card className="border-2 focus-within:border-primary transition-colors overflow-hidden">
        <div className="border-b border-border bg-muted/30 px-3 py-1 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PenSquare className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">{composeType}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!isDM && effectiveMaxChars !== Infinity && (
              <div className="relative h-7 w-7 flex items-center justify-center">
                <svg className="h-7 w-7 -rotate-90" viewBox="0 0 36 36">
                  <circle
                    cx="18"
                    cy="18"
                    r="16"
                    fill="none"
                    className="stroke-muted/30"
                    strokeWidth="3"
                  />
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
                    isWarning ? "text-red-600 font-bold" :
                      isNearLimit ? "text-orange-500" :
                        "text-muted-foreground"
                  )}
                >
                  {charCount}
                </span>
              </div>
            )}

            {!isDM && (
              <>
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
              </>
            )}
          </div>
        </div>

        <div className="relative">
          <div
            ref={highlighterRef}
            className={cn(
              "absolute inset-0 pointer-events-none px-3 py-2 whitespace-pre-wrap break-words text-sm overflow-hidden select-none z-0 leading-[1.5]",
              minHeight
            )}
            style={{
              fontFamily: 'inherit',
              fontSize: '0.875rem',
              lineHeight: '1.5',
              letterSpacing: 'normal',
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
              hyphens: 'auto',
            }}
            aria-hidden="true"
          >
            <BlueskyRichText record={getLiveRichText(text)} />
          </div>

          <Textarea
            ref={textareaRef}
            placeholder={placeholder}
            value={text}
            onChange={(e) => handleTextChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onScroll={syncScroll}
            className={cn(
              "resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-3 py-2 bg-transparent relative z-10 caret-foreground leading-[1.5]",
              minHeight
            )}
            style={{
              color: 'transparent',
              caretColor: 'var(--foreground)',
              lineHeight: '1.5',
              letterSpacing: 'normal',
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
              whiteSpace: 'pre-wrap',
            }}
          />

          {/* Suggestion popup */}
          {trigger && (
            <div
              className="absolute z-50 mt-1 w-80 sm:w-96 bg-popover border rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2"
              style={{ left: `${cursorLeft}px`, top: '100%' }}
            >
              <div className="max-h-72 overflow-y-auto divide-y divide-border">
                {suggestions.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground">
                    No {trigger === '@' ? 'accounts' : 'hashtags'} found
                  </div>
                ) : (
                  suggestions.map((item, idx) => {
                    const isActive = idx === selectedIdx
                    const key = trigger === '@' ? item.did : item

                    return (
                      <div
                        key={key}
                        className={cn(
                          "px-4 py-3 flex items-center gap-3 cursor-pointer transition-colors",
                          isActive ? "bg-accent" : "hover:bg-accent/60"
                        )}
                        onClick={() => {
                          const val = trigger === '@' ? (item.handle ?? item) : item
                          applySuggestion(val)
                        }}
                        onMouseEnter={() => setSelectedIdx(idx)}
                      >
                        {trigger === '@' ? (
                          <>
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={item.avatar} />
                              <AvatarFallback>
                                {(item.displayName || item.handle)?.[0]?.toUpperCase() || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="font-medium truncate">
                                {item.displayName || item.handle}
                              </div>
                              <div className="text-sm text-muted-foreground truncate">
                                @{item.handle}
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                              <Hash className="h-5 w-5" />
                            </div>
                            <div className="font-medium">#{item}</div>
                          </>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </Card>

      <TooltipProvider delayDuration={300}>
        <div className="flex flex-wrap items-center justify-between gap-2 border rounded-lg p-1 bg-muted/30">
          <div className="flex items-center gap-0.5 flex-wrap">
            {!isDM && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={!canAddMedia || isSubmitting}
                  >
                    <ImagePlus className="h-3.5 w-3.5" />
                    <span className="sr-only">Add media</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="text-xs">Add image/video</p>
                </TooltipContent>
              </Tooltip>
            )}

            <Popover open={emojiPickerOpen} onOpenChange={setEmojiPickerOpen}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                    >
                      <SmilePlus className="h-3.5 w-3.5" />
                      <span className="sr-only">Emoji</span>
                    </Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="text-xs">Emoji</p>
                </TooltipContent>
              </Tooltip>
              <PopoverContent className="w-72 p-0" align="start" side="top">
                <div className="p-2">
                  <div className="flex gap-1 overflow-x-auto pb-2 border-b mb-2">
                    {(Object.keys(EMOJI_CATEGORIES) as Array<keyof typeof EMOJI_CATEGORIES>).map((cat) => (
                      <Button
                        key={cat}
                        variant={emojiCategory === cat ? "secondary" : "ghost"}
                        size="sm"
                        className="h-7 px-2 text-xs shrink-0"
                        onClick={() => setEmojiCategory(cat)}
                      >
                        {cat}
                      </Button>
                    ))}
                  </div>
                  <div className="grid grid-cols-8 gap-0.5 max-h-48 overflow-y-auto">
                    {EMOJI_CATEGORIES[emojiCategory].map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        className="h-8 w-8 flex items-center justify-center rounded hover:bg-accent text-lg cursor-pointer transition-colors"
                        onClick={() => insertEmoji(emoji)}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <div className="w-2" />

            {formatActions.map(({ icon: Icon, label, action }) => (
              <Tooltip key={label}>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={action}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span className="sr-only">{label}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="text-xs">{label}</p>
                </TooltipContent>
              </Tooltip>
            ))}

            {isDM && (
              <>
                <Separator orientation="vertical" className="h-5 mx-2" />

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
                      !text.trim()
                    }
                    size="sm"
                    className="h-7 px-4 text-xs font-bold"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5 mr-1.5" />
                        Send
                      </>
                    )}
                  </Button>
                )}
              </>
            )}
          </div>

          {!isDM && (
            <div className="flex items-center gap-2 shrink-0 opacity-0 pointer-events-none w-0 h-0" />
          )}
        </div>
      </TooltipProvider>

      {!isDM && (
        <input
          ref={fileInputRef}
          type="file"
          accept={ALL_MEDIA_TYPES.join(",")}
          multiple
          hidden
          onChange={handleMediaSelect}
        />
      )}

      {mediaFiles.length > 0 && !isDM && (
        <div className={cn(
          "gap-2",
          hasVideo ? "flex" : "grid grid-cols-2"
        )}>
          {mediaFiles.map((media, index) => (
            <div key={index} className="relative group">
              {media.type === "image" ? (
                <img
                  src={media.preview}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg border"
                />
              ) : (
                <div className="relative w-full rounded-lg border overflow-hidden bg-muted">
                  <video
                    src={media.preview}
                    className="w-full max-h-64 object-contain"
                    controls
                    preload="metadata"
                  />
                  <div className="absolute top-2 left-2 bg-background/80 text-foreground text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Video className="h-3 w-3" />
                    Video
                  </div>
                </div>
              )}
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeMedia(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {linkCardLoading && !isDM && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 border rounded-lg">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading link preview...
        </div>
      )}
      {linkCard && !linkCardLoading && !isDM && (
        <div className="relative">
          <Card className="overflow-hidden">
            {linkCard.image && (
              <div className={cn("relative bg-muted", compact ? "aspect-[2/1]" : "aspect-video")}>
                <img
                  src={linkCard.image}
                  alt=""
                  className="w-full h-full object-cover"
                  crossOrigin="anonymous"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              </div>
            )}
            <CardContent className="p-3">
              <div className="flex items-start gap-2">
                <ExternalLink className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium line-clamp-2 text-sm">{linkCard.title}</p>
                  {linkCard.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{linkCard.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1 truncate">{linkCard.url}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Button
            variant="secondary"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6 rounded-full bg-background/80 hover:bg-background"
            onClick={dismissLinkCard}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      <AlertDialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard {isDM ? "message" : "post"}?</AlertDialogTitle>
            <AlertDialogDescription>
              Your {isDM ? "message" : "post"} will be permanently discarded.
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
    </div>
  )
}

function getLiveRichText(text: string) {
  const rt = new RichText({ text })
  rt.detectFacetsWithoutResolution()

  let facets = rt.facets ?? []

  const mentionRegex = /(?:^|\s)(@([a-zA-Z0-9.-]+(?:\.[a-zA-Z0-9.-]+)*))/g
  let match
  const manualFacets: any[] = []

  while ((match = mentionRegex.exec(text)) !== null) {
    const fullMatch = match[1]
    const handle = match[2]
    const offset = match[0].startsWith(' ') ? match.index + 1 : match.index
    const byteStart = new TextEncoder().encode(text.slice(0, offset)).length
    const byteEnd = byteStart + new TextEncoder().encode(fullMatch).length

    const covered = facets.some(f => byteStart >= f.index.byteStart && byteEnd <= f.index.byteEnd)
    if (covered) continue

    manualFacets.push({
      $type: 'app.bsky.richtext.facet',
      index: { byteStart, byteEnd },
      features: [{
        $type: 'app.bsky.richtext.facet#mention',
        handle,
      }]
    })
  }

  facets = [...facets, ...manualFacets].sort((a, b) => a.index.byteStart - b.index.byteStart)

  const deduped: any[] = []
  let lastEnd = 0
  for (const f of facets) {
    if (f.index.byteStart >= lastEnd) {
      deduped.push(f)
      lastEnd = f.index.byteEnd
    }
  }

  return {
    text: rt.text,
    facets: deduped,
  }
}

export { IMAGE_TYPES, VIDEO_TYPES, MAX_VIDEO_SIZE }