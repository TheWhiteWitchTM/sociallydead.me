"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Loader2, ImagePlus, X, Hash, Video, ExternalLink, Bold, Italic, Heading1, Heading2, List, ListOrdered, Code, Link2, Strikethrough, Quote, SmilePlus } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { useBluesky } from "@/lib/bluesky-context"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

// Common emoji categories like X/Twitter
const EMOJI_CATEGORIES = {
  "Smileys": ["😀","😃","😄","😁","😆","😅","🤣","😂","🙂","😊","😇","🥰","😍","🤩","😘","😗","😚","😙","🥲","😋","😛","😜","🤪","😝","🤑","🤗","🤭","🫢","🫣","🤫","🤔","🫡","🤐","🤨","😐","😑","😶","🫥","😏","😒","🙄","😬","🤥","😌","😔","😪","🤤","😴","😷","🤒","🤕","🤢","🤮","🥵","🥶","🥴","😵","🤯","🤠","🥳","🥸","😎","🤓","🧐"],
  "Gestures": ["👋","🤚","🖐️","✋","🖖","🫱","🫲","🫳","🫴","👌","🤌","🤏","✌️","🤞","🫰","🤟","🤘","🤙","👈","👉","👆","🖕","👇","☝️","🫵","👍","👎","✊","👊","🤛","🤜","👏","🙌","🫶","👐","🤲","🤝","🙏","💪","🦾"],
  "Hearts": ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❤️‍🔥","❤️‍🩹","❣️","💕","💞","💓","💗","💖","💘","💝","💟","♥️","🫀"],
  "Animals": ["🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐻‍❄️","🐨","🐯","🦁","🐮","🐷","🐸","🐵","🙈","🙉","🙊","🐒","🐔","🐧","🐦","🐤","🦆","🦅","🦉","🦇","🐺","🐗","🐴","🦄","🐝","🪱","🐛","🦋","🐌","🐞"],
  "Food": ["🍎","🍐","🍊","🍋","🍌","🍉","🍇","🍓","🫐","🍈","🍒","🍑","🥭","🍍","🥥","🥝","🍅","🍆","🥑","🥦","🌽","🌶️","🫑","🥒","🥬","🧅","🍄","🥜","🫘","🌰","🍞","🥐","🥖","🫓","🥨","🥯","🥞","🧇","🧀","🍖","🍗","🥩","🥓","🍔","🍟","🍕","🌭","🥪","🌮","🌯","🫔","🥙","🧆","🥚","🍳","🥘","🍲"],
  "Objects": ["⌚","📱","💻","⌨️","🖥️","🖨️","🖱️","🖲️","🕹️","🗜️","💾","💿","📀","📷","📸","📹","🎥","📽️","🎞️","📞","☎️","📟","📠","📺","📻","🎙️","🎚️","🎛️","🧭","⏱️","⏲️","⏰","🕰️","💡","🔦","🕯️","🧯","🛢️","💸","💵","💴","💶","💷","🪙","💰","💳","💎","⚖️","🪜","🧰","🪛","🔧","🔨","⚒️","🛠️","⛏️","🪚","🔩","⚙️","🪤","🧱","⛓️","🧲","🔫","💣","🧨","🪓","🔪","🗡️","⚔️","🛡️"],
  "Symbols": ["💯","🔥","⭐","🌟","✨","⚡","💥","💫","🎉","🎊","🏆","🥇","🥈","🥉","⚽","🏀","🏈","⚾","🥎","🎾","🏐","🏉","🥏","🎱","🪀","🏓","🏸","🏒","🏑","🥍","🏏","🪃","🥅","⛳","🪁","🏹","🎣","🤿","🥊","🥋","🎽","🛹","🛼","🛷","⛸️","🥌","🎿","⛷️","🏂"],
} as const

// Popular hashtags for suggestions
const POPULAR_HASHTAGS = [
  "art", "music", "photography", "gaming", "tech", "news", "politics",
  "sports", "science", "health", "food", "travel", "fashion", "movies",
  "books", "anime", "bluesky", "developer", "design", "ai"
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

// Bluesky supported media types
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"]
const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"]
const ALL_MEDIA_TYPES = [...IMAGE_TYPES, ...VIDEO_TYPES]
const MAX_IMAGES = 4
const MAX_VIDEO_SIZE = 50 * 1024 * 1024 // 50MB

function extractUrl(text: string): string | null {
  const urlRegex = /(https?:\/\/[^\s<]+[^\s<.,:;"')\]!?])/g
  const matches = text.match(urlRegex)
  if (!matches || matches.length === 0) return null
  const trimmed = text.trim()
  const firstUrl = matches[0]
  const lastUrl = matches[matches.length - 1]
  if (trimmed.startsWith(firstUrl)) return firstUrl
  if (trimmed.endsWith(lastUrl)) return lastUrl
  return null
}

interface ComposeInputProps {
  text: string
  onTextChange: (text: string) => void
  mediaFiles: MediaFile[]
  onMediaFilesChange: (files: MediaFile[]) => void
  linkCard: LinkCardData | null
  onLinkCardChange: (card: LinkCardData | null) => void
  placeholder?: string
  minHeight?: string
  maxChars?: number
  compact?: boolean
  autoFocus?: boolean
}

export function ComposeInput({
  text,
  onTextChange,
  mediaFiles,
  onMediaFilesChange,
  linkCard,
  onLinkCardChange,
  placeholder = "What's happening?",
  minHeight = "min-h-32",
  maxChars = 300,
  compact = false,
  autoFocus = false,
}: ComposeInputProps) {
  const { searchActors } = useBluesky()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Autocomplete state
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false)
  const [showHashtagSuggestions, setShowHashtagSuggestions] = useState(false)
  const [mentionSuggestions, setMentionSuggestions] = useState<MentionSuggestion[]>([])
  const [hashtagSuggestions, setHashtagSuggestions] = useState<string[]>([])
  const [autocompletePosition, setAutocompletePosition] = useState(0)
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0)
  const [isSearchingMentions, setIsSearchingMentions] = useState(false)

  // Link card state
  const [linkCardLoading, setLinkCardLoading] = useState(false)
  const [linkCardUrl, setLinkCardUrl] = useState<string | null>(null)
  const [linkCardDismissed, setLinkCardDismissed] = useState(false)
  const linkCardDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Warning sound
  const [hasPlayedWarning, setHasPlayedWarning] = useState(false)
  const audioContextRef = useRef<AudioContext | null>(null)

  const hasVideo = mediaFiles.some(f => f.type === "video")
  const hasImages = mediaFiles.some(f => f.type === "image")
  const imageCount = mediaFiles.filter(f => f.type === "image").length
  const canAddMedia = !hasVideo && imageCount < MAX_IMAGES

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 100)
    }
  }, [autoFocus])

  const playWarningSound = useCallback(() => {
    if (hasPlayedWarning) return
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext()
      }
      const ctx = audioContextRef.current
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()
      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)
      oscillator.frequency.value = 440
      oscillator.type = 'sine'
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2)
      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + 0.2)
      setHasPlayedWarning(true)
    } catch {
      // Audio not supported
    }
  }, [hasPlayedWarning])

  const fetchLinkCard = useCallback(async (url: string) => {
    if (linkCardDismissed) return
    setLinkCardLoading(true)
    try {
      const res = await fetch(`/api/og?url=${encodeURIComponent(url)}`)
      if (res.ok) {
        const data = await res.json()
        if (data.title || data.description) {
          onLinkCardChange(data)
          setLinkCardUrl(url)
        }
      }
    } catch {
      // Silently fail
    } finally {
      setLinkCardLoading(false)
    }
  }, [linkCardDismissed, onLinkCardChange])

  const searchMentions = useCallback(async (query: string) => {
    if (query.length < 1) {
      setMentionSuggestions([])
      return
    }
    setIsSearchingMentions(true)
    try {
      const result = await searchActors(query)
      setMentionSuggestions(result.actors.slice(0, 5))
    } catch {
      setMentionSuggestions([])
    } finally {
      setIsSearchingMentions(false)
    }
  }, [searchActors])

  const searchHashtags = useCallback((query: string) => {
    if (query.length < 1) {
      setHashtagSuggestions([])
      return
    }
    const matches = POPULAR_HASHTAGS.filter(tag =>
      tag.toLowerCase().startsWith(query.toLowerCase())
    ).slice(0, 5)
    setHashtagSuggestions(matches)
  }, [])

  const handleTextChange = (newText: string) => {
    onTextChange(newText)

    if (newText.length < 275) {
      setHasPlayedWarning(false)
    }
    if (newText.length >= 275 && text.length < 275) {
      playWarningSound()
    }

    // Link card detection (debounced)
    if (linkCardDebounceRef.current) clearTimeout(linkCardDebounceRef.current)
    linkCardDebounceRef.current = setTimeout(() => {
      const url = extractUrl(newText)
      if (url && url !== linkCardUrl && !linkCardDismissed) {
        fetchLinkCard(url)
      } else if (!url) {
        onLinkCardChange(null)
        setLinkCardUrl(null)
        setLinkCardDismissed(false)
      }
    }, 800)

    // Check for @ or # autocomplete
    const cursorPos = textareaRef.current?.selectionStart || newText.length
    const textBeforeCursor = newText.slice(0, cursorPos)

    const mentionMatch = textBeforeCursor.match(/@(\w*)$/)
    if (mentionMatch) {
      setAutocompletePosition(cursorPos - mentionMatch[1].length - 1)
      setShowMentionSuggestions(true)
      setShowHashtagSuggestions(false)
      setSelectedSuggestionIndex(0)
      searchMentions(mentionMatch[1])
      return
    }

    const hashtagMatch = textBeforeCursor.match(/#(\w*)$/)
    if (hashtagMatch) {
      setAutocompletePosition(cursorPos - hashtagMatch[1].length - 1)
      setShowHashtagSuggestions(true)
      setShowMentionSuggestions(false)
      setSelectedSuggestionIndex(0)
      searchHashtags(hashtagMatch[1])
      return
    }

    setShowMentionSuggestions(false)
    setShowHashtagSuggestions(false)
  }

  const insertSuggestion = (suggestion: string, type: 'mention' | 'hashtag') => {
    const prefix = type === 'mention' ? '@' : '#'
    const beforeTrigger = text.slice(0, autocompletePosition)
    const cursorPos = textareaRef.current?.selectionStart || text.length
    const afterCursor = text.slice(cursorPos)
    const newText = beforeTrigger + prefix + suggestion + ' ' + afterCursor
    onTextChange(newText)
    setShowMentionSuggestions(false)
    setShowHashtagSuggestions(false)

    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = beforeTrigger.length + prefix.length + suggestion.length + 1
        textareaRef.current.focus()
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos)
      }
    }, 0)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
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
    } else if (e.key === 'Escape') {
      setShowMentionSuggestions(false)
      setShowHashtagSuggestions(false)
    }
  }

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newFiles = Array.from(files)
    for (const file of newFiles) {
      const isImage = IMAGE_TYPES.includes(file.type)
      const isVideo = VIDEO_TYPES.includes(file.type)
      if (!isImage && !isVideo) continue

      if (isVideo) {
        if (hasImages || hasVideo) continue
        if (file.size > MAX_VIDEO_SIZE) continue
        const preview = URL.createObjectURL(file)
        onMediaFilesChange([{ file, preview, type: "video" }])
        break
      }

      if (isImage) {
        if (hasVideo) continue
        if (imageCount >= MAX_IMAGES) continue
        const reader = new FileReader()
        reader.onload = (ev) => {
          onMediaFilesChange([...mediaFiles.filter(f => !(f.type === "video")),
            ...(mediaFiles.filter(f => f.type === "image").length < MAX_IMAGES
              ? [{ file, preview: ev.target?.result as string, type: "image" as const }]
              : [])
          ].slice(0, MAX_IMAGES))
        }
        reader.readAsDataURL(file)
      }
    }

    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeMedia = (index: number) => {
    const updated = mediaFiles.filter((_, i) => i !== index)
    if (mediaFiles[index]?.type === "video") {
      URL.revokeObjectURL(mediaFiles[index].preview)
    }
    onMediaFilesChange(updated)
  }

  const dismissLinkCard = () => {
    onLinkCardChange(null)
    setLinkCardDismissed(true)
  }

  const getAcceptTypes = () => {
    if (hasVideo) return ""
    if (hasImages) return IMAGE_TYPES.join(",")
    return ALL_MEDIA_TYPES.join(",")
  }

  // Emoji picker state
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false)
  const [emojiCategory, setEmojiCategory] = useState<keyof typeof EMOJI_CATEGORIES>("Smileys")

  const insertEmoji = (emoji: string) => {
    const cursorPos = textareaRef.current?.selectionStart || text.length
    const before = text.slice(0, cursorPos)
    const after = text.slice(cursorPos)
    const newText = before + emoji + after
    onTextChange(newText)
    setTimeout(() => {
      if (textareaRef.current) {
        const newPos = cursorPos + emoji.length
        textareaRef.current.focus()
        textareaRef.current.setSelectionRange(newPos, newPos)
      }
    }, 0)
  }

  // Markdown formatting helpers
  const wrapSelection = (prefix: string, suffix: string) => {
    const textarea = textareaRef.current
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = text.slice(start, end)
    const before = text.slice(0, start)
    const after = text.slice(end)
    const wrapped = selectedText
      ? `${before}${prefix}${selectedText}${suffix}${after}`
      : `${before}${prefix}text${suffix}${after}`
    onTextChange(wrapped)
    setTimeout(() => {
      textarea.focus()
      if (selectedText) {
        textarea.setSelectionRange(start + prefix.length, end + prefix.length)
      } else {
        textarea.setSelectionRange(start + prefix.length, start + prefix.length + 4)
      }
    }, 0)
  }

  const insertAtLineStart = (prefix: string) => {
    const textarea = textareaRef.current
    if (!textarea) return
    const start = textarea.selectionStart
    const lineStart = text.lastIndexOf('\n', start - 1) + 1
    const before = text.slice(0, lineStart)
    const after = text.slice(lineStart)
    const newText = `${before}${prefix}${after}`
    onTextChange(newText)
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + prefix.length, start + prefix.length)
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

  const charCount = text.length
  const isOverLimit = charCount > maxChars

  return (
    <div className="space-y-3">
      <div className="relative">
        <Textarea
          ref={textareaRef}
          placeholder={placeholder}
          value={text}
          onChange={(e) => handleTextChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className={cn("resize-none", minHeight)}
        />

        {/* Mention Suggestions Dropdown */}
        {showMentionSuggestions && (mentionSuggestions.length > 0 || isSearchingMentions) && (
          <Card className="absolute z-50 w-64 mt-1 shadow-lg">
            <CardContent className="p-1">
              {isSearchingMentions ? (
                <div className="flex items-center justify-center p-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : (
                mentionSuggestions.map((user, idx) => (
                  <button
                    key={user.did}
                    className={cn(
                      "w-full flex items-center gap-2 p-2 rounded text-left hover:bg-accent",
                      idx === selectedSuggestionIndex && "bg-accent"
                    )}
                    onClick={() => insertSuggestion(user.handle, 'mention')}
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={user.avatar || "/placeholder.svg"} />
                      <AvatarFallback className="text-xs">
                        {(user.displayName || user.handle).slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{user.displayName || user.handle}</p>
                      <p className="text-xs text-muted-foreground truncate">@{user.handle}</p>
                    </div>
                  </button>
                ))
              )}
            </CardContent>
          </Card>
        )}

        {/* Hashtag Suggestions Dropdown */}
        {showHashtagSuggestions && hashtagSuggestions.length > 0 && (
          <Card className="absolute z-50 w-48 mt-1 shadow-lg">
            <CardContent className="p-1">
              {hashtagSuggestions.map((tag, idx) => (
                <button
                  key={tag}
                  className={cn(
                    "w-full flex items-center gap-2 p-2 rounded text-left hover:bg-accent",
                    idx === selectedSuggestionIndex && "bg-accent"
                  )}
                  onClick={() => insertSuggestion(tag, 'hashtag')}
                >
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">#{tag}</span>
                </button>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Link Card Preview */}
      {linkCardLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 border rounded-lg">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading link preview...
        </div>
      )}
      {linkCard && !linkCardLoading && (
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

      {/* Media Previews */}
      {mediaFiles.length > 0 && (
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

      {/* Markdown Formatting Toolbar */}
      <TooltipProvider delayDuration={300}>
        <div className="flex items-center gap-0.5 flex-wrap border rounded-lg p-1 bg-muted/30">
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

          {/* Emoji Picker */}
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
                      onClick={() => {
                        insertEmoji(emoji)
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </TooltipProvider>

      {/* Media Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <input
            ref={fileInputRef}
            type="file"
            accept={getAcceptTypes()}
            multiple={!hasVideo}
            className="hidden"
            onChange={handleMediaSelect}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={!canAddMedia}
            title={hasVideo ? "Remove video to add images" : imageCount >= MAX_IMAGES ? "Maximum 4 images" : "Add media"}
          >
            <ImagePlus className="h-4 w-4 mr-1.5" />
            {!compact && <span className="hidden sm:inline">Image</span>}
            {imageCount > 0 && <span className="ml-1 text-xs">({imageCount}/{MAX_IMAGES})</span>}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.accept = VIDEO_TYPES.join(",")
                fileInputRef.current.multiple = false
                fileInputRef.current.click()
                setTimeout(() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.accept = getAcceptTypes()
                    fileInputRef.current.multiple = !hasVideo
                  }
                }, 100)
              }
            }}
            disabled={hasImages || hasVideo}
            title={hasImages ? "Remove images to add video" : hasVideo ? "Only 1 video allowed" : "Add video (max 50MB)"}
          >
            <Video className="h-4 w-4 mr-1.5" />
            {!compact && <span className="hidden sm:inline">Video</span>}
          </Button>
        </div>
        <span className={cn(
          "font-medium tabular-nums transition-colors text-sm",
          charCount < 250 && "text-muted-foreground",
          charCount >= 250 && charCount < 275 && "text-orange-500",
          charCount >= 275 && "text-destructive font-bold"
        )}>
          {charCount}/{maxChars}
        </span>
      </div>
    </div>
  )
}

export { IMAGE_TYPES, VIDEO_TYPES, MAX_VIDEO_SIZE }
