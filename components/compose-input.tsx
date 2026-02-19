"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import {
  Loader2,
  ImagePlus,
  X,
  Hash,
  Video,
  ExternalLink,
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Code,
  Link2,
  Strikethrough,
  Quote,
  SmilePlus,
  AtSign,
  Send,
  PenSquare,
} from "lucide-react"
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

const EMOJI_CATEGORIES = {
  Smileys: ["😀","😃","😄","😁","😆","😅","🤣","😂","🙂","😊","😇","🥰","😍","🤩","😘","😗","😚","😙","🥲","😋","😛","😜","🤪","😝","🤑","🤗","🤭","🫢","🫣","🤫","🤔","🫡","🤐","🤨","😐","😑","😶","🫥","😏","😒","🙄","😬","🤥","😌","😔","😪","🤤","😴","😷","🤒","🤕","🤢","🤮","🥵","🥶","🥴","😵","🤯","🤠","🥳","🥸","😎","🤓","🧐"],
  Gestures: ["👋","🤚","🖐️","✋","🖖","🫱","🫲","🫳","🫴","👌","🤌","🤏","✌️","🤞","🫰","🤟","🤘","🤙","👈","👉","👆","🖕","👇","☝️","🫵","👍","👎","✊","👊","🤛","🤜","👏","🙌","🫶","👐","🤲","🤝","🙏","💪","🦾"],
  Hearts: ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❤️‍🔥","❤️‍🩹","❣️","💕","💞","💓","💗","💖","💘","💝","💟","♥️","🫀"],
  Animals: ["🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐻‍❄️","🐨","🐯","🦁","🐮","🐷","🐸","🐵","🙈","🙉","🙊","🐒","🐔","🐧","🐦","🐤","🦆","🦅","🦉","🦇","🐺","🐗","🐴","🦄","🐝","🪱","🐛","🦋","🐌","🐞"],
  // ... (you can keep the rest of your categories)
} as const

const POPULAR_HASHTAGS = [
  "art", "music", "photography", "gaming", "tech", "news", "politics",
  "sports", "science", "health", "food", "travel", "fashion", "movies",
  "books", "anime", "bluesky", "developer", "design", "ai", "sociallydead",
  "coding", "programming", "react", "nextjs", "webdev", "crypto", "nature"
]

interface MentionSuggestion {
  did: string
  handle: string
  displayName?: string
  avatar?: string
}

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

  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false)
  const [showHashtagSuggestions, setShowHashtagSuggestions] = useState(false)
  const [mentionSuggestions, setMentionSuggestions] = useState<MentionSuggestion[]>([])
  const [hashtagSuggestions, setHashtagSuggestions] = useState<string[]>([])
  const [autocompletePosition, setAutocompletePosition] = useState(0)
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0)
  const [isSearchingMentions, setIsSearchingMentions] = useState(false)

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
  const canAddMedia = !hasVideo && imageCount < MAX_IMAGES && !isDM

  const charCount = text.length
  const isOverLimit = effectiveMaxChars !== Infinity && charCount > effectiveMaxChars

  const progress = effectiveMaxChars !== Infinity ? Math.min((charCount / effectiveMaxChars) * 100, 100) : 0
  const isNearLimit = progress >= 70
  const isWarning = progress >= 90

  const simulateEscape = useCallback(() => {
    const escEvent = new KeyboardEvent("keydown", {
      key: "Escape",
      bubbles: true,
      cancelable: true,
    })
    document.dispatchEvent(escEvent)
  }, [])

  const forceClose = useCallback(() => {
    simulateEscape()
  }, [simulateEscape])

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

  const syncScroll = () => {
    if (textareaRef.current && highlighterRef.current) {
      highlighterRef.current.scrollTop = textareaRef.current.scrollTop
      highlighterRef.current.scrollLeft = textareaRef.current.scrollLeft
    }
  }

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      setTimeout(() => textareaRef.current.focus(), 50)
    }
  }, [autoFocus])

  const playWarningSound = useCallback(() => {
    if (hasPlayedWarning) return
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = 440
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2)
      osc.start()
      osc.stop(ctx.currentTime + 0.2)
      setHasPlayedWarning(true)
    } catch {}
  }, [hasPlayedWarning])

  const fetchLinkCard = useCallback(async (url: string) => {
    if (linkCardDismissed) return
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
  }, [linkCardDismissed, onLinkCardChange])

  const searchMentions = useCallback(async (query: string) => {
    if (!query.trim()) return
    setIsSearchingMentions(true)
    try {
      let actors = (await searchActorsTypeahead(query)).actors || []
      if (actors.length === 0) {
        actors = (await searchActors(query)).actors || []
      }
      setMentionSuggestions(actors.slice(0, 6))
    } catch (err) {
      console.error("Mention search failed", err)
      setMentionSuggestions([])
    } finally {
      setIsSearchingMentions(false)
    }
  }, [searchActors, searchActorsTypeahead])

  const searchHashtags = useCallback((query: string) => {
    const q = query.toLowerCase()
    const matches = q
      ? POPULAR_HASHTAGS.filter(t => t.toLowerCase().startsWith(q)).slice(0, 8)
      : POPULAR_HASHTAGS.slice(0, 8)
    setHashtagSuggestions(matches)
  }, [])

  const handleTextChange = (newText: string) => {
    onTextChange(newText)

    const warningThreshold = effectiveMaxChars * 0.9
    if (newText.length < warningThreshold) setHasPlayedWarning(false)
    if (newText.length >= warningThreshold && text.length < warningThreshold) playWarningSound()

    // link card
    if (linkCardDebounceRef.current) clearTimeout(linkCardDebounceRef.current)
    linkCardDebounceRef.current = setTimeout(() => {
      const url = extractUrl(newText)
      if (url && url !== linkCardUrl && !linkCardDismissed) {
        fetchLinkCard(url)
      } else if (!url) {
        onLinkCardChange?.(null)
        setLinkCardUrl(null)
        setLinkCardDismissed(false)
      }
    }, 700)

    // Autocomplete triggers
    const cursor = textareaRef.current?.selectionStart ?? newText.length
    const beforeCursor = newText.slice(0, cursor)

    // Mention
    const mentionMatch = beforeCursor.match(/@([a-zA-Z0-9.-]*)$/)
    if (mentionMatch) {
      const query = mentionMatch[1]
      setAutocompletePosition(beforeCursor.lastIndexOf("@"))
      setShowMentionSuggestions(true)
      setShowHashtagSuggestions(false)
      setSelectedSuggestionIndex(0)
      searchMentions(query)
    } else {
      setShowMentionSuggestions(false)
    }

    // Hashtag
    const hashtagMatch = beforeCursor.match(/#(\w*)$/)
    if (hashtagMatch) {
      const query = hashtagMatch[1]
      setAutocompletePosition(beforeCursor.lastIndexOf("#"))
      setShowHashtagSuggestions(true)
      setShowMentionSuggestions(false)
      setSelectedSuggestionIndex(0)
      searchHashtags(query)
    } else {
      setShowHashtagSuggestions(false)
    }
  }

  const insertSuggestion = (value: string, type: "mention" | "hashtag") => {
    const prefix = type === "mention" ? "@" : "#"
    const before = text.slice(0, autocompletePosition)
    const after = text.slice(textareaRef.current?.selectionEnd ?? text.length)
    const insert = prefix + value + " "
    const newText = before + insert + after
    onTextChange(newText)

    setShowMentionSuggestions(false)
    setShowHashtagSuggestions(false)

    setTimeout(() => {
      if (textareaRef.current) {
        const pos = before.length + insert.length
        textareaRef.current.focus()
        textareaRef.current.setSelectionRange(pos, pos)
      }
    }, 10)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && onSubmit && !isSubmitting) {
      if (!showMentionSuggestions && !showHashtagSuggestions) {
        e.preventDefault()
        if (text.trim() || mediaFiles.length > 0) onSubmit()
      }
    }

    if (e.key === "Escape") {
      e.preventDefault()
      if (showMentionSuggestions || showHashtagSuggestions) {
        setShowMentionSuggestions(false)
        setShowHashtagSuggestions(false)
      } else {
        handleCancelOrEscape()
      }
      return
    }

    let suggestions: any[] = []
    let isMentionMode = false

    if (showMentionSuggestions) {
      suggestions = mentionSuggestions
      isMentionMode = true
    } else if (showHashtagSuggestions) {
      suggestions = hashtagSuggestions
    }

    if (suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedSuggestionIndex(i => (i + 1) % suggestions.length)
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedSuggestionIndex(i => (i - 1 + suggestions.length) % suggestions.length)
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault()
        const selected = suggestions[selectedSuggestionIndex]
        if (selected) {
          insertSuggestion(
            isMentionMode ? (selected as MentionSuggestion).handle : selected,
            isMentionMode ? "mention" : "hashtag"
          )
        }
      }
    }
  }

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const files = Array.from(e.target.files)

    for (const file of files) {
      const isImage = IMAGE_TYPES.includes(file.type)
      const isVideo = VIDEO_TYPES.includes(file.type)
      if (!isImage && !isVideo) continue

      if (isVideo) {
        if (hasImages || hasVideo || file.size > MAX_VIDEO_SIZE) continue
        const preview = URL.createObjectURL(file)
        onMediaFilesChange?.([{ file, preview, type: "video" }])
        break
      }

      if (isImage) {
        if (hasVideo || imageCount >= MAX_IMAGES) continue
        const reader = new FileReader()
        reader.onload = ev => {
          const preview = ev.target?.result as string
          onMediaFilesChange?.([
            ...mediaFiles.filter(f => f.type !== "video"),
            { file, preview, type: "image" },
          ].slice(0, MAX_IMAGES))
        }
        reader.readAsDataURL(file)
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const removeMedia = (index: number) => {
    const item = mediaFiles[index]
    if (item.type === "video") URL.revokeObjectURL(item.preview)
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
      textareaRef.current?.focus()
      textareaRef.current?.setSelectionRange(pos + emoji.length, pos + emoji.length)
    }, 0)
  }

  const wrapSelection = (prefix: string, suffix: string) => {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const selected = text.slice(start, end)
    const newText = selected
      ? text.slice(0, start) + prefix + selected + suffix + text.slice(end)
      : text.slice(0, start) + prefix + "text" + suffix + text.slice(end)
    onTextChange(newText)
    setTimeout(() => {
      ta.focus()
      if (selected) {
        ta.setSelectionRange(start + prefix.length, end + prefix.length)
      } else {
        ta.setSelectionRange(start + prefix.length, start + prefix.length + 4)
      }
    }, 0)
  }

  const insertAtLineStart = (prefix: string) => {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const lineStart = text.lastIndexOf("\n", start - 1) + 1
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

  // You can keep / improve your renderHighlightedText function here
  // (the version from your previous message should work if caret sync was fixed)
  const renderHighlightedText = () => {
    // Placeholder – insert your actual highlighting logic here
    // Make sure it produces the same number of characters as text
    return text.split("\n").map((line, i) => (
      <div key={i}>{line || <br />}</div>
    ))
  }

  const composeType =
    postType === "reply" ? "Replying" :
      postType === "quote" ? "Quoting" :
        postType === "dm" ? "Direct Message" :
          postType === "article" ? "Writing Article" :
            "New Post"

  return (
    <div className="space-y-2">
      <Card className="border-2 focus-within:border-primary transition-colors overflow-hidden">
        {!isDM && (
          <div className="border-b border-border bg-muted/30 px-4 py-1.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PenSquare className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">{composeType}</span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {effectiveMaxChars !== Infinity && (
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
                  <span className={cn(
                    "absolute text-xs font-medium tabular-nums",
                    isWarning ? "text-red-600 font-bold" :
                      isNearLimit ? "text-orange-500" :
                        "text-muted-foreground"
                  )}>
                    {charCount}
                  </span>
                </div>
              )}

              <Button
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
                  disabled={isSubmitting || (!text.trim() && !mediaFiles.length) || isOverLimit}
                  size="sm"
                  className="h-7 px-3 text-xs font-bold"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5 mr-1.5" />
                      {postType === "reply" ? "Reply" : "Post"}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        )}

        <div className="relative">
          <div
            ref={highlighterRef}
            className={cn(
              "absolute inset-0 pointer-events-none px-4 py-3 whitespace-pre-wrap break-words text-sm overflow-auto select-none z-0",
              minHeight
            )}
            aria-hidden="true"
            style={{ fontFamily: "inherit", lineHeight: "1.5", fontSize: "0.875rem" }}
          >
            {renderHighlightedText()}
          </div>

          <Textarea
            ref={textareaRef}
            placeholder={placeholder}
            value={text}
            onChange={e => handleTextChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onScroll={syncScroll}
            className={cn(
              "resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-4 py-3 bg-transparent relative z-10",
              minHeight
            )}
            style={{ color: "transparent", caretColor: "var(--foreground)", lineHeight: "1.5" }}
          />

          {showMentionSuggestions && mentionSuggestions.length > 0 && (
            <Card className="absolute left-4 w-80 sm:w-96 z-[100] mt-1 shadow-xl border-primary/20">
              <CardContent className="p-1 max-h-64 overflow-y-auto">
                {isSearchingMentions ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                ) : (
                  mentionSuggestions.map((user, idx) => (
                    <div
                      key={user.did}
                      className={cn(
                        "flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors",
                        idx === selectedSuggestionIndex ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                      )}
                      onClick={() => insertSuggestion(user.handle, "mention")}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>{(user.displayName || user.handle).slice(0,2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{user.displayName || user.handle}</p>
                        <p className="text-xs text-muted-foreground truncate">@{user.handle}</p>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          )}

          {showHashtagSuggestions && hashtagSuggestions.length > 0 && (
            <Card className="absolute left-4 w-80 sm:w-96 z-[100] mt-1 shadow-xl border-primary/20">
              <CardContent className="p-1 max-h-64 overflow-y-auto">
                {hashtagSuggestions.map((tag, idx) => (
                  <div
                    key={tag}
                    className={cn(
                      "flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors",
                      idx === selectedSuggestionIndex ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                    )}
                    onClick={() => insertSuggestion(tag, "hashtag")}
                  >
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                      <Hash className="h-4 w-4" />
                    </div>
                    <span className="font-medium">#{tag}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </Card>

      <div className="flex items-center justify-between gap-2 border rounded-lg p-1 bg-muted/30">
        <div className="flex items-center gap-0.5 flex-wrap">
          {formatActions.map(a => (
            <Tooltip key={a.label}>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={a.action}>
                  <a.icon className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{a.label}</TooltipContent>
            </Tooltip>
          ))}

          <Separator orientation="vertical" className="h-5 mx-1" />

          <Popover open={emojiPickerOpen} onOpenChange={setEmojiPickerOpen}>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <SmilePlus className="h-3.5 w-3.5" />
                  </Button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent>Emoji</TooltipContent>
            </Tooltip>
            {/* ← your emoji picker content here */}
          </Popover>

          {!isDM && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!canAddMedia}
                >
                  <ImagePlus className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add media</TooltipContent>
            </Tooltip>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isDM && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-3 text-xs"
              onClick={handleCancelOrEscape}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}

          {onSubmit && (
            <Button
              onClick={onSubmit}
              disabled={isSubmitting || (!text.trim() && !mediaFiles.length) || isOverLimit}
              size="sm"
              className="h-7 px-4 text-xs font-bold"
            >
              {isSubmitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <>
                  <Send className="h-3.5 w-3.5 mr-1.5" />
                  {isDM ? "Send" : postType === "reply" ? "Reply" : "Post"}
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Media previews, link card preview, dialogs, file input input */}
      {/* ... keep your existing media / link card / alert dialog code here ... */}

      <input
        type="file"
        ref={fileInputRef}
        accept={ALL_MEDIA_TYPES.join(",")}
        multiple
        hidden
        onChange={handleMediaSelect}
      />
    </div>
  )
}

export { IMAGE_TYPES, VIDEO_TYPES, MAX_VIDEO_SIZE }