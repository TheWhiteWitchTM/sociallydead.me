"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { RichText } from '@atproto/api'
import {
  Loader2, ImagePlus, X, Video, ExternalLink, Bold, Italic,
  Heading1, Heading2, List, ListOrdered, Code, Link2, Strikethrough,
  Quote, SmilePlus, Send, PenSquare, Hash
} from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { VerifiedBadge } from "@/components/verified-badge"
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { BlueskyRichText } from "@/components/bluesky/bluesky-rich-text"
import { suggestHandles, suggestHashtags } from "@/hooks/bluesky/use-bluesky-suggestions"

const EMOJI_CATEGORIES = {
  "Smileys": ["😀","😃","😄","😁","😆","😅","🤣","😂","🙂","😊","😇","🥰","😍","🤩","😘","😗","😚","😙","🥲","😋","😛","😜","🤪","😝","🤑","🤗","🤭","🫢","🫣","🤫","🤔","🫡","🤐","🤨","😐","😑","😶","🫥","😏","😒","🙄","😬","🤥","😌","😔","😪","🤤","😴","😷","🤒","🤕","🤢","🤮","🥵","🥶","🥴","😵","🤯","🤠","🥳","🥸","😎","🤓","🧐"],
  "Gestures": ["👋","🤚","🖐️","✋","🖖","🫱","🫲","🫳","🫴","👌","🤌","🤏","✌️","🤞","🫰","🤟","🤘","🤙","👈","👉","👆","🖕","👇","☝️","🫵","👍","👎","✊","👊","🤛","🤜","👏","🙌","🫶","👐","🤲","🤝","🙏","💪","🦾"],
  "Hearts": ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❤️‍🔥","❤️‍🩹","❣️","💕","💞","💓","💗","💖","💘","💝","💟","♥️","🫀"],
  "Animals": ["🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐻‍❄️","🐨","🐯","🦁","🐮","🐷","🐸","🐵","🙈","🙉","🙊","🐒","🐔","🐧","🐦","🐤","🦆","🦅","🦉","🦇","🐺","🐗","🐴","🦄","🐝","🪱","🐛","🦋","🐌","🐞"],
  "Food": ["🍎","🍐","🍊","🍋","🍌","🍉","🍇","🍓","🫐","🍈","🍒","🍑","🥭","🍍","🥥","🥝","🍅","🍆","🥑","🥦","🌽","🌶️","🫑","🥒","🥬","🧅","🍄","🥜","🫘","🌰","🍞","🥐","🥖","🫓","🥨","🥯","🥞","🧇","🧀","🍖","🍗","🥩","🥓","🍔","🍟","🍕","🌭","🥪","🌮","🌯","🫔","🥙","🧆","🥚","🍳","🥘","🍲"],
  "Objects": ["⌚","📱","💻","⌨️","🖥️","🖨️","🖱️","🖲️","🕹️","🗜️","💾","💿","📀","📷","📸","📹","🎥","📽️","🎞️","📞","☎️","📟","📠","📺","📻","🎙️","🎚️","🎛️","🧭","⏱️","⏲️","⏰","🕰️","💡","🔦","🕯️","🧯","🛢️","💸","💵","💴","💶","💷","🪙","💰","💳","💎","⚖️","🪜","🧰","🪛","🔧","🔨","⚒️","🛠️","⛏️","🪚","🔩","⚙️","🪤","🧱","⛓️","🧲","🔫","💣","🧨","🪓","🔪","🗡️","⚔️","🛡️"],
  "Symbols": ["💯","🔥","⭐","🌟","✨","⚡","💥","💫","🎉","🎊","🏆","🥇","🥈","🥉","⚽","🏀","🏈","⚾","🥎","🎾","🏐","🏉","🥏","🎱","🪀","🏓","🏸","🏒","🏑","🥍","🏏","🪃","🥅","⛳","🪁","🏹","🎣","🤿","🥊","🥋","🎽","🛹","🛼","🛷","⛸️","🥌","🎿","⛷️","🏂"],
} as const

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"]
const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"]
const ALL_MEDIA_TYPES = [...IMAGE_TYPES, ...VIDEO_TYPES]
const MAX_IMAGES = 4
const MAX_VIDEO_SIZE = 50 * 1024 * 1024

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

interface MentionSuggestion {
  handle: string
  displayName?: string
  avatar?: string
  did: string
}

function extractUrl(text: string): string | null {
  const urlRegex = /((?:https?:\/\/|www\.)[^\s<]+[^\s<.,:;"')\]!?]|(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+(?:[a-zA-Z]{2,}))/g
  const matches = text.match(urlRegex)
  if (!matches || matches.length === 0) return null

  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0)
  if (lines.length === 0) return null

  const firstLine = lines[0]
  const lastLine = lines[lines.length - 1]

  if (firstLine.match(urlRegex)?.[0] === firstLine) return firstLine
  if (lastLine.match(urlRegex)?.[0] === lastLine) return lastLine

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

  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const highlighterRef = useRef<HTMLDivElement>(null)

  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false)
  const [showHashtagSuggestions, setShowHashtagSuggestions] = useState(false)
  const [mentionSuggestions, setMentionSuggestions] = useState<MentionSuggestion[]>([])
  const [hashtagSuggestions, setHashtagSuggestions] = useState<string[]>([])
  const [autocompletePosition, setAutocompletePosition] = useState(0)
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0)
  const [isSearching, setIsSearching] = useState(false)
  const [cursorCoords, setCursorCoords] = useState<{ x: number; y: number; lineHeight: number } | null>(null)

  const [linkCardLoading, setLinkCardLoading] = useState(false)
  const [linkCardUrl, setLinkCardUrl] = useState<string | null>(null)
  const [linkCardDismissed, setLinkCardDismissed] = useState(false)
  const linkCardDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [hasPlayedWarning, setHasPlayedWarning] = useState(false)
  const audioContextRef = useRef<AudioContext | null>(null)

  const [showDiscardDialog, setShowDiscardDialog] = useState(false)

  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false)
  const [emojiCategory, setEmojiCategory] = useState<keyof typeof EMOJI_CATEGORIES>("Smileys")

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
    const esc = new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true })
    document.dispatchEvent(esc)
  }, [])

  const forceClose = useCallback(() => simulateEscape(), [simulateEscape])

  const handleCancelOrEscape = useCallback(() => {
    if (showMentionSuggestions || showHashtagSuggestions) {
      setShowMentionSuggestions(false)
      setShowHashtagSuggestions(false)
      return
    }
    if (text.trim() || mediaFiles.length > 0 || linkCard) {
      setShowDiscardDialog(true)
    } else {
      forceClose()
    }
  }, [showMentionSuggestions, showHashtagSuggestions, text, mediaFiles.length, linkCard, forceClose])

  const handleDiscard = useCallback(() => {
    forceClose()
    setShowDiscardDialog(false)
  }, [forceClose])

  const syncScroll = useCallback(() => {
    if (textareaRef.current && highlighterRef.current) {
      highlighterRef.current.scrollTop = textareaRef.current.scrollTop
      highlighterRef.current.scrollLeft = textareaRef.current.scrollLeft
    }
  }, [])

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 100)
    }
  }, [autoFocus])

  const playWarningSound = useCallback(() => {
    if (hasPlayedWarning) return
    try {
      const ctx = audioContextRef.current ??= new AudioContext()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain).connect(ctx.destination)
      osc.frequency.value = 440
      osc.type = 'sine'
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2)
      osc.start()
      osc.stop(ctx.currentTime + 0.2)
      setHasPlayedWarning(true)
    } catch {}
  }, [hasPlayedWarning])

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

  const loadMentionSuggestions = useCallback(async (prefix: string) => {
    if (!prefix.trim()) {
      setMentionSuggestions([])
      return
    }
    setIsSearching(true)
    try {
      const res = await suggestHandles(prefix.trim(), 8)
      setMentionSuggestions(Array.isArray(res) ? res : [])
    } catch (err) {
      console.error("suggestHandles failed:", err)
      setMentionSuggestions([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  const loadHashtagSuggestions = useCallback(async (prefix: string) => {
    if (!prefix.trim()) {
      setHashtagSuggestions([])
      return
    }
    setIsSearching(true)
    try {
      const res = await suggestHashtags(prefix.trim(), 10)
      setHashtagSuggestions(Array.isArray(res) ? res : [])
    } catch (err) {
      console.error("suggestHashtags failed:", err)
      setHashtagSuggestions([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  const updateCursorPosition = useCallback(() => {
    const ta = textareaRef.current
    if (!ta || ta.selectionStart == null) {
      setCursorCoords(null)
      return
    }
    const coords = getCursorXY(ta, ta.selectionStart)
    setCursorCoords(coords)
  }, [])

  const handleTextChange = (newText: string) => {
    onTextChange(newText)

    const warningThreshold = effectiveMaxChars * 0.9
    if (newText.length < warningThreshold) setHasPlayedWarning(false)
    if (newText.length >= warningThreshold && text.length < warningThreshold) playWarningSound()

    if (linkCardDebounceRef.current) clearTimeout(linkCardDebounceRef.current)
    linkCardDebounceRef.current = setTimeout(() => {
      const url = extractUrl(newText)
      if (url && url !== linkCardUrl && !linkCardDismissed && !isDM) {
        fetchLinkCard(url)
      } else if (!url || isDM) {
        onLinkCardChange?.(null)
        setLinkCardUrl(null)
        setLinkCardDismissed(false)
      }
    }, 800)

    const cursorPos = textareaRef.current?.selectionStart ?? newText.length
    const beforeCursor = newText.slice(0, cursorPos)

    const mentionMatch = beforeCursor.match(/@([a-zA-Z0-9.-]*)$/)
    if (mentionMatch) {
      setAutocompletePosition(beforeCursor.lastIndexOf('@'))
      setShowMentionSuggestions(true)
      setShowHashtagSuggestions(false)
      setSelectedSuggestionIndex(0)
      loadMentionSuggestions(mentionMatch[1])
      updateCursorPosition()
      return
    }

    const hashtagMatch = beforeCursor.match(/(?:^|\s)#([a-zA-Z0-9_]*)$/)
    if (hashtagMatch) {
      setAutocompletePosition(beforeCursor.lastIndexOf('#'))
      setShowHashtagSuggestions(true)
      setShowMentionSuggestions(false)
      setSelectedSuggestionIndex(0)
      loadHashtagSuggestions(hashtagMatch[1])
      updateCursorPosition()
      return
    }

    setShowMentionSuggestions(false)
    setShowHashtagSuggestions(false)
    setCursorCoords(null)
  }

  const insertSuggestion = (value: string, type: 'mention' | 'hashtag') => {
    const prefixChar = type === 'mention' ? '@' : '#'
    const before = text.slice(0, autocompletePosition)
    const cursorPos = textareaRef.current?.selectionStart ?? text.length
    const after = text.slice(cursorPos)
    const inserted = prefixChar + value + ' '
    const newText = before + inserted + after
    onTextChange(newText)

    setShowMentionSuggestions(false)
    setShowHashtagSuggestions(false)
    setCursorCoords(null)

    setTimeout(() => {
      const ta = textareaRef.current
      if (ta) {
        const pos = before.length + inserted.length
        ta.focus()
        ta.setSelectionRange(pos, pos)
      }
    }, 0)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.shiftKey && onSubmit && !isSubmitting && text.trim()) {
      e.preventDefault()
      onSubmit()
      return
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      handleCancelOrEscape()
      return
    }

    if (!showMentionSuggestions && !showHashtagSuggestions) return

    const suggestions = showMentionSuggestions ? mentionSuggestions : hashtagSuggestions
    const isMention = showMentionSuggestions

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedSuggestionIndex(i => (i + 1) % suggestions.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedSuggestionIndex(i => (i - 1 + suggestions.length) % suggestions.length)
    } else if (e.key === 'Enter' && suggestions.length > 0) {
      e.preventDefault()
      const item = suggestions[selectedSuggestionIndex]
      if (item) {
        if (isMention) insertSuggestion((item as MentionSuggestion).handle, 'mention')
        else insertSuggestion(item as string, 'hashtag')
      }
    }
  }

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isDM) return
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return

    for (const file of files) {
      const isImage = IMAGE_TYPES.includes(file.type)
      const isVideo = VIDEO_TYPES.includes(file.type)
      if (!isImage && !isVideo) continue

      if (isVideo) {
        if (hasImages || hasVideo || file.size > MAX_VIDEO_SIZE) continue
        onMediaFilesChange?.([{ file, preview: URL.createObjectURL(file), type: "video" }])
        break
      }

      if (isImage) {
        if (hasVideo || imageCount >= MAX_IMAGES) continue
        const reader = new FileReader()
        reader.onload = ev => {
          const preview = ev.target?.result as string
          if (preview) {
            onMediaFilesChange?.([
              ...mediaFiles.filter(f => f.type !== "video"),
              { file, preview, type: "image" }
            ].slice(0, MAX_IMAGES))
          }
        }
        reader.readAsDataURL(file)
      }
    }

    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeMedia = (index: number) => {
    const item = mediaFiles[index]
    if (item?.type === "video") URL.revokeObjectURL(item.preview)
    onMediaFilesChange?.(mediaFiles.filter((_, i) => i !== index))
  }

  const dismissLinkCard = () => {
    onLinkCardChange?.(null)
    setLinkCardDismissed(true)
  }

  const insertEmoji = (emoji: string) => {
    const pos = textareaRef.current?.selectionStart ?? text.length
    const newText = text.slice(0, pos) + emoji + text.slice(pos)
    onTextChange(newText)
    setTimeout(() => {
      const ta = textareaRef.current
      if (ta) {
        const newPos = pos + emoji.length
        ta.focus()
        ta.setSelectionRange(newPos, newPos)
      }
    }, 0)
  }

  const wrapSelection = (prefix: string, suffix: string) => {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const selected = text.slice(start, end)
    const before = text.slice(0, start)
    const after = text.slice(end)
    const newText = selected
      ? `${before}${prefix}${selected}${suffix}${after}`
      : `${before}${prefix}text${suffix}${after}`
    onTextChange(newText)
    setTimeout(() => {
      if (selected) {
        ta.setSelectionRange(start + prefix.length, end + prefix.length)
      } else {
        ta.setSelectionRange(start + prefix.length, start + prefix.length + 4)
      }
      ta.focus()
    }, 0)
  }

  const insertAtLineStart = (prefix: string) => {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const lineStart = text.lastIndexOf('\n', start - 1) + 1
    const newText = text.slice(0, lineStart) + prefix + text.slice(lineStart)
    onTextChange(newText)
    setTimeout(() => {
      ta.focus()
      ta.setSelectionRange(start + prefix.length, start + prefix.length)
    }, 0)
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

  const composeType =
    postType === "reply"   ? "Replying" :
      postType === "quote"   ? "Quoting" :
        postType === "dm"      ? "Direct Message" :
          postType === "article" ? "Writing Article" :
            "New Post"

  return (
    <div className="space-y-3">
      <Card className="border-2 focus-within:border-primary transition-colors overflow-hidden">
        <div className="border-b border-border bg-muted/30 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PenSquare className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">{composeType}</span>
          </div>

          <div className="flex items-center gap-3">
            {!isDM && effectiveMaxChars !== Infinity && (
              <div className="relative h-8 w-8 flex items-center justify-center">
                <svg className="h-8 w-8 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="16" fill="none" className="stroke-muted/30" strokeWidth="3" />
                  <circle
                    cx="18" cy="18" r="16" fill="none" strokeWidth="3"
                    strokeDasharray="100" strokeDashoffset={100 - progress}
                    className={cn(
                      "transition-all duration-300",
                      progress < 70 ? "stroke-green-500" :
                        progress < 90 ? "stroke-orange-500" :
                          "stroke-red-600"
                    )}
                    strokeLinecap="round"
                  />
                </svg>
                <span className={cn(
                  "absolute text-sm font-bold tabular-nums",
                  isWarning ? "text-red-600" :
                    isNearLimit ? "text-orange-500" :
                      "text-muted-foreground"
                )}>
                  {charCount}
                </span>
              </div>
            )}

            {!isDM && (
              <>
                <Button variant="ghost" size="sm" onClick={handleCancelOrEscape} disabled={isSubmitting}>
                  Cancel
                </Button>
                {onSubmit && (
                  <Button
                    onClick={onSubmit}
                    disabled={isSubmitting || (!text.trim() && !mediaFiles.length) || isOverLimit}
                    size="sm"
                    className="font-semibold"
                  >
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                    {postType === "reply" ? "Reply" : postType === "dm" ? "Send" : "Post"}
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        <div className="relative">
          <div
            ref={highlighterRef}
            className={cn("absolute inset-0 pointer-events-none px-4 py-3 whitespace-pre-wrap break-words text-base overflow-hidden select-none z-0 leading-relaxed", minHeight)}
            aria-hidden="true"
          >
            <BlueskyRichText record={getLiveRichText(text)} />
          </div>

          <Textarea
            ref={textareaRef}
            placeholder={placeholder}
            value={text}
            onChange={e => handleTextChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onScroll={syncScroll}
            className={cn("resize-none border-0 focus-visible:ring-0 px-4 py-3 bg-transparent relative z-10 caret-foreground leading-relaxed text-base", minHeight)}
            style={{ color: 'transparent', caretColor: 'var(--foreground)', whiteSpace: 'pre-wrap' }}
          />

          {showMentionSuggestions && cursorCoords && (
            <Card
              className="fixed z-[9999] w-96 shadow-2xl border border-primary/30 bg-background rounded-lg overflow-hidden"
              style={{
                left: `${cursorCoords.x}px`,
                top: `${cursorCoords.y - 320}px`,
              }}
            >
              <CardContent className="p-2 max-h-72 overflow-y-auto">
                {isSearching ? (
                  <div className="py-10 flex justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : mentionSuggestions.length > 0 ? (
                  mentionSuggestions.map((user, i) => (
                    <div
                      key={user.did}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                        i === selectedSuggestionIndex ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                      )}
                      onClick={() => insertSuggestion(user.handle, 'mention')}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>{(user.displayName || user.handle)[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate flex items-center gap-1.5">
                          {user.displayName || user.handle}
                          <VerifiedBadge handle={user.handle} />
                        </p>
                        <p className="text-sm text-muted-foreground truncate">@{user.handle}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-10 text-center text-muted-foreground">No matching users</div>
                )}
              </CardContent>
            </Card>
          )}

          {showHashtagSuggestions && cursorCoords && (
            <Card
              className="fixed z-[9999] w-96 shadow-2xl border border-primary/30 bg-background rounded-lg overflow-hidden"
              style={{
                left: `${cursorCoords.x}px`,
                top: `${cursorCoords.y - 320}px`,
              }}
            >
              <CardContent className="p-2 max-h-72 overflow-y-auto">
                {isSearching ? (
                  <div className="py-10 flex justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : hashtagSuggestions.length > 0 ? (
                  hashtagSuggestions.map((tag, i) => (
                    <div
                      key={tag}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                        i === selectedSuggestionIndex ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                      )}
                      onClick={() => insertSuggestion(tag, 'hashtag')}
                    >
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        <Hash className="h-5 w-5" />
                      </div>
                      <div className="font-medium">#{tag}</div>
                    </div>
                  ))
                ) : (
                  <div className="py-10 text-center text-muted-foreground">No matching hashtags</div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </Card>

      <TooltipProvider>
        <div className="flex flex-wrap items-center gap-1 border rounded-lg p-2 bg-muted/30">
          {!isDM && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} disabled={!canAddMedia || isSubmitting}>
                  <ImagePlus className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Add image or video</TooltipContent>
            </Tooltip>
          )}

          <Popover open={emojiPickerOpen} onOpenChange={setEmojiPickerOpen}>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <SmilePlus className="h-5 w-5" />
                  </Button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent side="top">Emoji</TooltipContent>
            </Tooltip>
            <PopoverContent className="w-96">
              <div className="flex gap-2 overflow-x-auto pb-3 mb-3 border-b">
                {Object.keys(EMOJI_CATEGORIES).map(cat => (
                  <Button
                    key={cat}
                    variant={emojiCategory === cat ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setEmojiCategory(cat as keyof typeof EMOJI_CATEGORIES)}
                  >
                    {cat}
                  </Button>
                ))}
              </div>
              <div className="grid grid-cols-8 gap-2 max-h-64 overflow-y-auto">
                {EMOJI_CATEGORIES[emojiCategory].map(emoji => (
                  <button
                    key={emoji}
                    className="h-10 w-10 text-2xl hover:bg-accent rounded"
                    onClick={() => insertEmoji(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {formatActions.map(a => (
            <Tooltip key={a.label}>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={a.action}>
                  <a.icon className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">{a.label}</TooltipContent>
            </Tooltip>
          ))}
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
        <div className={cn("grid gap-4", hasVideo ? "grid-cols-1" : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4")}>
          {mediaFiles.map((media, idx) => (
            <div key={idx} className="group relative rounded-xl overflow-hidden border shadow-sm">
              {media.type === "image" ? (
                <img src={media.preview} alt="preview" className="w-full aspect-video object-cover" />
              ) : (
                <video src={media.preview} className="w-full aspect-video object-contain bg-black" controls />
              )}
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeMedia(idx)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {linkCard && !isDM && (
        <Card className="overflow-hidden relative">
          {linkCard.image && <img src={linkCard.image} alt="" className="w-full h-48 object-cover" />}
          <CardContent className="p-4">
            <p className="font-semibold line-clamp-2">{linkCard.title}</p>
            <p className="text-sm text-muted-foreground line-clamp-3 mt-1">{linkCard.description}</p>
            <p className="text-xs text-muted-foreground mt-2 truncate">{linkCard.url}</p>
          </CardContent>
          <Button size="icon" variant="ghost" className="absolute top-2 right-2" onClick={dismissLinkCard}>
            <X className="h-4 w-4" />
          </Button>
        </Card>
      )}

      <AlertDialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard {isDM ? "message" : "post"}?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDiscard}>Discard</AlertDialogAction>
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
  while ((match = mentionRegex.exec(text)) !== null) {
    const full = match[1]
    const handle = match[2]
    const offset = match[0].startsWith(' ') ? match.index + 1 : match.index
    const byteStart = new TextEncoder().encode(text.slice(0, offset)).length
    const byteEnd = byteStart + new TextEncoder().encode(full).length

    if (facets.some(f => byteStart >= f.index.byteStart && byteEnd <= f.index.byteEnd)) continue

    facets.push({
      $type: 'app.bsky.richtext.facet',
      index: { byteStart, byteEnd },
      features: [{ $type: 'app.bsky.richtext.facet#mention', handle }]
    })
  }

  facets.sort((a, b) => a.index.byteStart - b.index.byteStart)

  const deduped: any[] = []
  let lastEnd = 0
  for (const f of facets) {
    if (f.index.byteStart >= lastEnd) {
      deduped.push(f)
      lastEnd = f.index.byteEnd
    }
  }

  return { text: rt.text, facets: deduped }
}

function getCursorXY(textarea: HTMLTextAreaElement, selectionStart: number) {
  const { offsetLeft: inputX, offsetTop: inputY, scrollLeft, scrollTop } = textarea

  const mirror = document.createElement('div')
  const mirrorStyle = mirror.style
  const computed = getComputedStyle(textarea)

  mirrorStyle.position = 'absolute'
  mirrorStyle.visibility = 'hidden'
  mirrorStyle.whiteSpace = 'pre-wrap'
  mirrorStyle.wordWrap = 'break-word'
  mirrorStyle.overflow = 'hidden'
  mirrorStyle.fontFamily = computed.fontFamily
  mirrorStyle.fontSize = computed.fontSize
  mirrorStyle.fontWeight = computed.fontWeight
  mirrorStyle.letterSpacing = computed.letterSpacing
  mirrorStyle.lineHeight = computed.lineHeight
  mirrorStyle.padding = computed.padding
  mirrorStyle.border = computed.border
  mirrorStyle.width = `${textarea.clientWidth}px`
  mirrorStyle.height = 'auto'

  const textBefore = textarea.value.substring(0, selectionStart)
  mirror.textContent = textBefore.replace(/\s/g, '\u00a0')

  const cursorSpan = document.createElement('span')
  cursorSpan.textContent = '\u200b'
  mirror.appendChild(cursorSpan)

  document.body.appendChild(mirror)
  const { offsetLeft: spanX, offsetTop: spanY } = cursorSpan
  document.body.removeChild(mirror)

  return {
    x: inputX + spanX - scrollLeft,
    y: inputY + spanY - scrollTop,
    lineHeight: parseFloat(computed.lineHeight) || 24,
  }
}