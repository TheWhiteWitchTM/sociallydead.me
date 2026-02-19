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
  "Smileys": ["😀","😃","😄","😁","😆","😅","🤣","😂","🙂","😊","😇","🥰","😍","🤩","😘","😗","😚","😙","🥲","😋","😛","😜","🤪","😝","🤑","🤗","🤭","🫢","🫣","🤫","🤔","🫡","🤐","🤨","😐","😑","😶","🫥","😏","😒","🙄","😬","🤥","😌","😔","😪","🤤","😴","😷","🤒","🤕","🤢","🤮","🥵","🥶","🥴","😵","🤯","🤠","🥳","🥸","😎","🤓","🧐"],
  "Gestures": ["👋","🤚","🖐️","✋","🖖","🫱","🫲","🫳","🫴","👌","🤌","🤏","✌️","🤞","🫰","🤟","🤘","🤙","👈","👉","👆","🖕","👇","☝️","🫵","👍","👎","✊","👊","🤛","🤜","👏","🙌","🫶","👐","🤲","🤝","🙏","💪","🦾"],
  "Hearts": ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❤️‍🔥","❤️‍🩹","❣️","💕","💞","💓","💗","💖","💘","💝","💟","♥️","🫀"],
  "Animals": ["🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐻‍❄️","🐨","🐯","🦁","🐮","🐷","🐸","🐵","🙈","🙉","🙊","🐒","🐔","🐧","🐦","🐤","🦆","🦅","🦉","🦇","🐺","🐗","🐴","🦄","🐝","🪱","🐛","🦋","🐌","🐞"],
  "Food": ["🍎","🍐","🍊","🍋","🍌","🍉","🍇","🍓","🫐","🍈","🍒","🍑","🥭","🍍","🥥","🥝","🍅","🍆","🥑","🥦","🌽","🌶️","🫑","🥒","🥬","🧅","🍄","🥜","🫘","🌰","🍞","🥐","🥖","🫓","🥨","🥯","🥞","waffle","🧀","🍖","🍗","🥩","🥓","🍔","🍟","🍕","🌭","🥪","🌮","🌯","🫔","🥙","🧆","🥚","🍳","🥘","🍲"],
  "Objects": ["⌚","📱","💻","⌨️","🖥️","🖨️","🖱️","🖲️","🕹️","🗜️","💾","💿","📀","📷","📸","📹","🎥","📽️","🎞️","📞","☎️","📟","📠","📺","📻","🎙️","🎚️","🎛️","🧭","⏱️","⏲️","⏰","🕰️","💡","🔦","🕯️","🧯","🛢️","💸","💵","💴","💶","💷","🪙","💰","💳","💎","⚖️","🪜","🧰","🪛","🔧","🔨","⚒️","🛠️","⛏️","🪚","🔩","⚙️","🪤","🧱","⛓️","🧲","🔫","💣","🧨","🪓","🔪","🗡️","⚔️","🛡️"],
  "Symbols": ["💯","🔥","⭐","🌟","✨","⚡","💥","💫","🎉","🎊","🏆","🥇","🥈","🥉","⚽","🏀","🏈","⚾","🥎","🎾","🏐","🏉","🥏","🎱","🪀","🏓","🏸","🏒","🏑","🥍","🏏","🪃","🥅","⛳","🪁","🏹","🎣","🤿","🥊","🥋","🎽","🛹","🛼","🛷","⛸️","🥌","🎿","⛷️","🏂"],
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
  const [autocompleteCoords, setAutocompleteCoords] = useState({ top: 0, left: 0 })
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
    setIsSearchingMentions(true)
    try {
      const typeahead = await searchActorsTypeahead(query)
      let actors = typeahead.actors
      if ((!actors || actors.length === 0) && query.length > 0) {
        const result = await searchActors(query)
        actors = result.actors
      }
      const suggestions = (actors || []).slice(0, 5)
      setMentionSuggestions(suggestions)
    } catch (error) {
      console.error('Error searching mentions:', error)
      setMentionSuggestions([])
    } finally {
      setIsSearchingMentions(false)
    }
  }, [searchActors, searchActorsTypeahead])

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

  const updateAutocompletePosition = useCallback(() => {
    if (!textareaRef.current) return

    const ta = textareaRef.current
    const cursorPos = ta.selectionStart
    const textBefore = text.slice(0, cursorPos)

    const mirror = document.createElement('div')
    mirror.style.position = 'absolute'
    mirror.style.visibility = 'hidden'
    mirror.style.whiteSpace = 'pre-wrap'
    mirror.style.wordWrap = 'break-word'
    mirror.style.font = window.getComputedStyle(ta).font
    mirror.style.padding = window.getComputedStyle(ta).padding
    mirror.style.width = ta.clientWidth + 'px'
    mirror.style.lineHeight = window.getComputedStyle(ta).lineHeight
    mirror.style.letterSpacing = window.getComputedStyle(ta).letterSpacing
    mirror.style.border = window.getComputedStyle(ta).border
    mirror.textContent = textBefore

    document.body.appendChild(mirror)

    const span = document.createElement('span')
    span.textContent = textBefore.slice(-1) || ' '
    mirror.appendChild(span)

    const rect = span.getBoundingClientRect()
    const taRect = ta.getBoundingClientRect()

    setAutocompleteCoords({
      top: rect.top - taRect.top + ta.scrollTop + rect.height + 4,
      left: rect.left - taRect.left + ta.scrollLeft
    })

    document.body.removeChild(mirror)
  }, [text])

  useEffect(() => {
    if (showMentionSuggestions || showHashtagSuggestions) {
      updateAutocompletePosition()
    }
  }, [showMentionSuggestions, showHashtagSuggestions, text, updateAutocompletePosition])

  const handleTextChange = (newText: string) => {
    onTextChange(newText)

    const warningThreshold = effectiveMaxChars * 0.9
    if (newText.length < warningThreshold) setHasPlayedWarning(false)
    if (newText.length >= warningThreshold && text.length < warningThreshold) playWarningSound()

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
    }, 800)

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
    if (e.key === 'Enter' && e.shiftKey && onSubmit && !isSubmitting) {
      e.preventDefault()
      if (text.trim()) onSubmit()
      return
    }

    if (e.key === 'Escape') {
      e.preventDefault()
      if (showMentionSuggestions || showHashtagSuggestions) {
        setShowMentionSuggestions(false)
        setShowHashtagSuggestions(false)
      } else {
        handleCancelOrEscape()
      }
      return
    }

    if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault()

      const cursor = textareaRef.current?.selectionStart ?? text.length
      const before = text.slice(0, cursor)

      const atMatch = before.match(/@([a-zA-Z0-9.-]*)$/)
      const hashMatch = before.match(/#(\w*)$/)

      if (atMatch || hashMatch) {
        const isMention = !!atMatch
        const query = (atMatch?.[1] ?? hashMatch?.[1] ?? '').trim()
        const triggerPos = before.lastIndexOf(isMention ? '@' : '#')

        setAutocompletePosition(triggerPos)
        setSelectedSuggestionIndex(0)

        if (isMention) {
          setShowMentionSuggestions(true)
          setShowHashtagSuggestions(false)
          searchMentions(query || 'a')
        } else {
          setShowHashtagSuggestions(true)
          setShowMentionSuggestions(false)
          searchHashtags(query)
        }

        updateAutocompletePosition()
        return
      }

      const newText = text.slice(0, cursor) + '\t' + text.slice(cursor)
      onTextChange(newText)
      setTimeout(() => textareaRef.current?.setSelectionRange(cursor + 1, cursor + 1), 0)
      return
    }

    if (showMentionSuggestions || showHashtagSuggestions) {
      const suggestions = showMentionSuggestions ? mentionSuggestions : hashtagSuggestions
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedSuggestionIndex(i => (i + 1) % suggestions.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedSuggestionIndex(i => (i - 1 + suggestions.length) % suggestions.length)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const sel = suggestions[selectedSuggestionIndex]
        if (sel) {
          insertSuggestion(
            showMentionSuggestions ? (sel as MentionSuggestion).handle : sel as string,
            showMentionSuggestions ? 'mention' : 'hashtag'
          )
        }
      }
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
        onMediaFilesChange?.([{ file, preview, type: "video" }])
        break
      }

      if (isImage) {
        if (hasVideo) continue
        if (imageCount >= MAX_IMAGES) continue
        const reader = new FileReader()
        reader.onload = (ev) => {
          onMediaFilesChange?.([...mediaFiles.filter(f => f.type !== "video"),
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
    onMediaFilesChange?.(updated)
  }

  const dismissLinkCard = () => {
    onLinkCardChange?.(null)
    setLinkCardDismissed(true)
  }

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

  const renderHighlightedText = () => {
    const boldRegex = /(\*\*)(.*?)(\*\*)/g
    const italicRegex = /(\*)([^*]+?)(\*)/g
    const strikethroughRegex = /(~~)(.*?)(~~)/g
    const codeRegex = /(`)(.*?)(`)/g
    const linkRegex = /(\[)(.*?)(\]\()(.*?)(\))/g
    const headingRegex = /^(#{1,6})\s+(.+)$/gm

    const mentionRegex = /@([a-zA-Z0-9.-]+)/g
    const hashtagRegex = /#(\w+)/g
    const urlRegex = /((?:https?:\/\/|www\.)[^\s<]+[^\s<.,:;"')\]!?]|(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+(?:[a-zA-Z]{2,})(?:\/[^\s<]*)?)/g

    let processedText = text
    let keyCounter = 0

    const lines = processedText.split('\n')
    const processedLines = lines.map((line, lineIdx) => {
      const lineParts: React.ReactNode[] = []
      let currentText = line
      const lineKey = `line-${lineIdx}`

      const headingMatch = currentText.match(headingRegex)
      if (headingMatch) {
        const [, hashes, content] = headingMatch
        lineParts.push(
          <span key={`${lineKey}-heading`} className="text-primary font-bold text-lg">
            <span className="text-muted-foreground">{hashes} </span>
            {content}
          </span>
        )
        return <span key={lineKey}>{lineParts}</span>
      }

      let lastIndex = 0
      const patterns = [
        { regex: boldRegex, type: 'bold' },
        { regex: italicRegex, type: 'italic' },
        { regex: strikethroughRegex, type: 'strikethrough' },
        { regex: codeRegex, type: 'code' },
        { regex: linkRegex, type: 'link' },
        { regex: mentionRegex, type: 'mention' },
        { regex: hashtagRegex, type: 'hashtag' },
        { regex: urlRegex, type: 'url' },
      ]

      const allMatches: Array<{ index: number; length: number; element: React.ReactNode }> = []

      patterns.forEach(({ regex, type }) => {
        let match
        regex.lastIndex = 0
        while ((match = regex.exec(currentText)) !== null) {
          const index = match.index
          const fullMatch = match[0]
          let element: React.ReactNode

          switch (type) {
            case 'bold':
              element = (
                <span key={`${lineKey}-${keyCounter++}`} className="font-bold">
                  <span className="text-muted-foreground/60">{match[1]}</span>
                  {match[2]}
                  <span className="text-muted-foreground/60">{match[3]}</span>
                </span>
              )
              break
            case 'italic':
              element = (
                <span key={`${lineKey}-${keyCounter++}`} className="italic">
                  <span className="text-muted-foreground/60">{match[1]}</span>
                  {match[2]}
                  <span className="text-muted-foreground/60">{match[3]}</span>
                </span>
              )
              break
            case 'strikethrough':
              element = (
                <span key={`${lineKey}-${keyCounter++}`} className="line-through">
                  <span className="text-muted-foreground/60">{match[1]}</span>
                  {match[2]}
                  <span className="text-muted-foreground/60">{match[3]}</span>
                </span>
              )
              break
            case 'code':
              element = (
                <span key={`${lineKey}-${keyCounter++}`} className="bg-muted text-primary px-1 rounded font-mono text-xs">
                  <span className="text-muted-foreground/60">{match[1]}</span>
                  {match[2]}
                  <span className="text-muted-foreground/60">{match[3]}</span>
                </span>
              )
              break
            case 'link':
              element = (
                <span key={`${lineKey}-${keyCounter++}`} className="text-blue-500">
                  <span className="text-muted-foreground/60">{match[1]}</span>
                  <span className="underline">{match[2]}</span>
                  <span className="text-muted-foreground/60">{match[3]}</span>
                  <span className="text-blue-400 text-xs">{match[4]}</span>
                  <span className="text-muted-foreground/60">{match[5]}</span>
                </span>
              )
              break
            case 'mention':
              element = (
                <span key={`${lineKey}-${keyCounter++}`} className="text-blue-500 font-medium bg-blue-500/10 px-0.5 rounded">
                  @{match[1]}
                </span>
              )
              break
            case 'hashtag':
              element = (
                <span key={`${lineKey}-${keyCounter++}`} className="text-blue-500 font-medium bg-blue-500/10 px-0.5 rounded">
                  #{match[1]}
                </span>
              )
              break
            case 'url':
              element = (
                <span key={`${lineKey}-${keyCounter++}`} className="text-blue-500 underline bg-blue-500/10 px-0.5 rounded">
                  {match[0]}
                </span>
              )
              break
          }

          allMatches.push({ index, length: fullMatch.length, element })
        }
      })

      allMatches.sort((a, b) => a.index - b.index)

      lastIndex = 0
      allMatches.forEach((match) => {
        if (match.index > lastIndex) {
          lineParts.push(currentText.slice(lastIndex, match.index))
        }
        lineParts.push(match.element)
        lastIndex = match.index + match.length
      })

      if (lastIndex < currentText.length) {
        lineParts.push(currentText.slice(lastIndex))
      }

      return <span key={lineKey}>{lineParts.length > 0 ? lineParts : <br />}</span>
    })

    return processedLines.map((line, idx) => (
      <span key={idx}>
        {line}
        {idx < processedLines.length - 1 && '\n'}
      </span>
    ))
  }

  const composeType = postType === "reply" ? "Replying" :
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
        )}

        <div className="relative">
          <div
            ref={highlighterRef}
            className={cn(
              "absolute inset-0 pointer-events-none px-4 py-3 whitespace-pre-wrap break-words text-sm overflow-auto select-none z-0",
              minHeight
            )}
            aria-hidden="true"
            style={{
              fontFamily: 'inherit',
              lineHeight: '1.5',
              fontSize: '0.875rem',
            }}
          >
            {renderHighlightedText()}
          </div>

          <Textarea
            ref={textareaRef}
            placeholder={placeholder}
            value={text}
            onChange={(e) => handleTextChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onScroll={syncScroll}
            className={cn(
              "resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-4 py-3 bg-transparent relative z-10",
              minHeight
            )}
            style={{
              color: 'transparent',
              caretColor: 'var(--foreground)',
              lineHeight: '1.5',
            }}
          />

          {(showMentionSuggestions || showHashtagSuggestions) && createPortal(
            <Card
              className="fixed z-[9999] shadow-xl border border-primary/30 rounded-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
              style={{
                top: `${autocompleteCoords.top}px`,
                left: `${autocompleteCoords.left}px`,
                minWidth: '280px',
                maxWidth: '340px',
              }}
            >
              <CardContent className="p-1 max-h-48 overflow-y-auto">
                {showMentionSuggestions && (
                  <>
                    {isSearchingMentions ? (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      </div>
                    ) : mentionSuggestions.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground text-sm">
                        No users found
                      </div>
                    ) : (
                      mentionSuggestions.map((user, idx) => (
                        <div
                          key={user.did}
                          tabIndex={0}
                          autoFocus={idx === 0}
                          className={cn(
                            "flex items-center gap-3 p-2.5 cursor-pointer transition-colors outline-none",
                            idx === selectedSuggestionIndex
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-accent focus:bg-accent/80 focus:ring-2 focus:ring-primary"
                          )}
                          onClick={() => insertSuggestion(user.handle, 'mention')}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              insertSuggestion(user.handle, 'mention')
                            }
                          }}
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar || "/placeholder.svg"} />
                            <AvatarFallback>{(user.displayName || user.handle).slice(0,2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate text-sm">{user.displayName || user.handle}</p>
                            <p className="text-xs text-muted-foreground truncate">@{user.handle}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </>
                )}

                {showHashtagSuggestions && (
                  hashtagSuggestions.map((tag, idx) => (
                    <div
                      key={tag}
                      tabIndex={0}
                      autoFocus={idx === 0}
                      className={cn(
                        "flex items-center gap-3 p-2.5 cursor-pointer transition-colors outline-none",
                        idx === selectedSuggestionIndex
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-accent focus:bg-accent/80 focus:ring-2 focus:ring-primary"
                      )}
                      onClick={() => insertSuggestion(tag, 'hashtag')}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          insertSuggestion(tag, 'hashtag')
                        }
                      }}
                    >
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                        <Hash className="h-4 w-4" />
                      </div>
                      <span className="font-medium text-sm">#{tag}</span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>,
            document.body
          )}
        </div>
      </Card>

      <TooltipProvider delayDuration={300}>
        <div className="flex items-center justify-between gap-2 border rounded-lg p-1 bg-muted/30">
          <div className="flex items-center gap-0.5">
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

            <Separator orientation="vertical" className="h-5 mx-1" />

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

            {!isDM && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={!canAddMedia}
                  >
                    <ImagePlus className="h-3.5 w-3.5" />
                    <span className="sr-only">Add Media</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="text-xs">Add Media</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isDM && (
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
            )}

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
      </TooltipProvider>

      {mediaFiles.length > 0 && (
        <div className={cn("gap-2", hasVideo ? "flex" : "grid grid-cols-2")}>
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

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleMediaSelect}
        multiple
        accept={ALL_MEDIA_TYPES.join(',')}
        className="hidden"
      />

    </div>
  )
}

export { IMAGE_TYPES, VIDEO_TYPES, MAX_VIDEO_SIZE }