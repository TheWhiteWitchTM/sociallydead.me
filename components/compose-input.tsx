"use client"

import { useState, useRef, useCallback, useEffect } from "react"
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
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'

const EMOJI_CATEGORIES = {
  "Smileys": ["😀","😃","😄","😁","😆","😅","🤣","😂","🙂","😊","😇","🥰","😍","🤩","😘","😗","😚","😙","🥲","😋","😛","😜","🤪","😝","🤑","🤗","🤭","🫢","🫣","🤫","🤔","🫡","🤐","🤨","😐","😑","😶","🫥","😏","😒","🙄","😬","🤥","😌","😔","😪","🤤","😴","😷","🤒","🤕","🤢","🤮","🥵","🥶","🥴","😵","🤯","🤠","🥳","🥸","😎","🤓","🧐"],
  "Gestures": ["👋","🤚","🖐️","✋","🖖","🫱","🫲","🫳","🫴","👌","🤌","🤏","✌️","🤞","🫰","🤟","🤘","🤙","👈","👉","👆","🖕","👇","☝️","🫵","👍","👎","✊","👊","🤛","🤜","👏","🙌","🫶","👐","🤲","🤝","🙏","💪","🦾"],
  "Hearts": ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❤️‍🔥","❤️‍🩹","❣️","💕","💞","💓","💗","💖","💘","💝","💟","♥️","🫀"],
  "Animals": ["🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐻‍❄️","🐨","🐯","🦁","🐮","🐷","🐸","🐵","🙈","🙉","🙊","🐒","🐔","🐧","🐦","🐤","🦆","🦅","🦉","🦇","🐺","🐗","🐴","🦄","🐝","🪱","🐛","🦋","🐌","🐞"],
  "Food": ["🍎","🍐","🍊","🍋","🍌","🍉","🍇","🍓","🫐","🍈","🍒","🍑","🥭","🍍","🥥","🥝","🍅","🍆","🥑","🥦","🌽","🌶️","🫑","🥒","🥬","🧅","🍄","🥜","🫘","🌰","🍞","🥐","🥖","🫓","🥨","🥯","🥞","🧇","🧀","🍖","🍗","🥩","🥓","🍔","🍟","🍕","🌭","🥪","🌮","🌯","🫔","🥙","🧆","🥚","🍳","🥘","🍲"],
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
  // unchanged
}

interface ComposeInputProps {
  // unchanged
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

  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false)
  const [showHashtagSuggestions, setShowHashtagSuggestions] = useState(false)
  const [mentionSuggestions, setMentionSuggestions] = useState<MentionSuggestion[]>([])
  const [hashtagSuggestions, setHashtagSuggestions] = useState<string[]>([])
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

  const [mentionPickerOpen, setMentionPickerOpen] = useState(false)
  const [mentionSearch, setMentionSearch] = useState("")
  const [mentionPickerResults, setMentionPickerResults] = useState<MentionSuggestion[]>([])
  const [selectedMentions, setSelectedMentions] = useState<Set<string>>(new Set())
  const [isSearchingPicker, setIsSearchingPicker] = useState(false)

  const [hashtagPickerOpen, setHashtagPickerOpen] = useState(false)
  const [hashtagSearch, setHashtagSearch] = useState("")
  const [selectedHashtags, setSelectedHashtags] = useState<Set<string>>(new Set())

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

  useEffect(() => {
    if (autoFocus && editableRef.current) {
      setTimeout(() => editableRef.current?.focus(), 100)
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
      gainNode.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2)
      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + 0.2)
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

  const handleTextChange = useCallback((newText: string) => {
    onTextChange(newText)

    const warningThreshold = effectiveMaxChars * 0.9
    if (newText.length < warningThreshold) {
      setHasPlayedWarning(false)
    }
    if (newText.length >= warningThreshold && text.length < warningThreshold) {
      playWarningSound()
    }

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

    // Suggestion trigger
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) return
    const range = sel.getRangeAt(0)
    const container = range.commonAncestorContainer
    if (container.nodeType !== Node.TEXT_NODE) return
    const textBeforeCursor = (container as Text).textContent?.slice(0, range.startOffset) || ''

    const mentionMatch = textBeforeCursor.match(/@([a-zA-Z0-9.-]*)$/)
    if (mentionMatch) {
      const matchText = mentionMatch[1]
      setShowMentionSuggestions(true)
      setShowHashtagSuggestions(false)
      setSelectedSuggestionIndex(0)
      searchMentions(matchText)
      return
    }

    const hashtagMatch = textBeforeCursor.match(/(?:^|\s)#([a-zA-Z0-9_]*)$/)
    if (hashtagMatch) {
      const matchText = hashtagMatch[1]
      setShowHashtagSuggestions(true)
      setShowMentionSuggestions(false)
      setSelectedSuggestionIndex(0)
      if (matchText.length === 0) {
        setHashtagSuggestions(POPULAR_HASHTAGS.slice(0, 5))
      } else {
        searchHashtags(matchText)
      }
      return
    }

    setShowMentionSuggestions(false)
    setShowHashtagSuggestions(false)
  }, [onTextChange, text, effectiveMaxChars, linkCardUrl, linkCardDismissed, isDM, playWarningSound, fetchLinkCard, onLinkCardChange, searchMentions, searchHashtags])

  const insertAtCursor = useCallback((toInsert: string) => {
    const el = editableRef.current
    if (!el) return

    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) {
      el.innerHTML += toInsert
      onTextChange(el.textContent || '')
      return
    }

    const range = sel.getRangeAt(0)
    range.deleteContents()
    range.insertNode(document.createTextNode(toInsert))
    range.collapse(false)
    sel.removeAllRanges()
    sel.addRange(range)

    onTextChange(el.textContent || '')
  }, [onTextChange])

  const insertSuggestion = useCallback((suggestion: string, type: 'mention' | 'hashtag') => {
    const prefix = type === 'mention' ? '@' : '#'
    insertAtCursor(prefix + suggestion + ' ')
    setShowMentionSuggestions(false)
    setShowHashtagSuggestions(false)
  }, [insertAtCursor])

  const insertEmoji = useCallback((emoji: string) => {
    insertAtCursor(emoji)
  }, [insertAtCursor])

  const wrapSelection = useCallback((prefix: string, suffix: string) => {
    const el = editableRef.current
    if (!el) return

    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) {
      insertAtCursor(prefix + 'text' + suffix)
      return
    }

    const range = sel.getRangeAt(0)
    const selectedText = range.toString() || 'text'
    range.deleteContents()

    const fragment = document.createDocumentFragment()
    fragment.appendChild(document.createTextNode(prefix))
    fragment.appendChild(document.createTextNode(selectedText))
    fragment.appendChild(document.createTextNode(suffix))

    range.insertNode(fragment)
    range.collapse(false)
    sel.removeAllRanges()
    sel.addRange(range)

    onTextChange(el.textContent || '')
  }, [insertAtCursor, onTextChange])

  const insertAtLineStart = useCallback((prefix: string) => {
    const el = editableRef.current
    if (!el) return

    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) {
      insertAtCursor(prefix)
      return
    }

    const range = sel.getRangeAt(0)
    const container = range.commonAncestorContainer
    if (container.nodeType !== Node.TEXT_NODE) return

    const textNode = container as Text
    const offset = range.startOffset
    const text = textNode.textContent || ''
    const lineStart = text.lastIndexOf('\n', offset - 1) + 1

    const before = text.slice(0, lineStart)
    const after = text.slice(lineStart)

    textNode.textContent = before + prefix + after

    const newOffset = lineStart + prefix.length
    range.setStart(textNode, newOffset)
    range.setEnd(textNode, newOffset)
    sel.removeAllRanges()
    sel.addRange(range)

    onTextChange(el.textContent || '')
  }, [insertAtCursor, onTextChange])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
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

    if (!showMentionSuggestions && !showHashtagSuggestions) return

    const suggestions = showMentionSuggestions ? mentionSuggestions : hashtagSuggestions

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedSuggestionIndex(prev => (prev + 1) % suggestions.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedSuggestionIndex(prev => (prev - 1 + suggestions.length) % suggestions.length)
    } else if (e.key === 'Enter' && suggestions.length > 0) {
      e.preventDefault()
      if (showMentionSuggestions && mentionSuggestions[selectedSuggestionIndex]) {
        insertSuggestion(mentionSuggestions[selectedSuggestionIndex].handle, 'mention')
      } else if (showHashtagSuggestions && hashtagSuggestions[selectedSuggestionIndex]) {
        insertSuggestion(hashtagSuggestions[selectedSuggestionIndex], 'hashtag')
      }
    }
  }, [onSubmit, isSubmitting, text, handleCancelOrEscape, showMentionSuggestions, showHashtagSuggestions, mentionSuggestions, hashtagSuggestions, selectedSuggestionIndex, insertSuggestion])

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    // unchanged
  }

  const removeMedia = (index: number) => {
    // unchanged
  }

  const dismissLinkCard = () => {
    // unchanged
  }

  const searchMentionsPicker = useCallback(async (query: string) => {
    // unchanged
  }, [searchActors, searchActorsTypeahead])

  const insertSelectedMentions = useCallback(() => {
    if (selectedMentions.size === 0) return
    const mentions = Array.from(selectedMentions).map(h => `@${h}`).join(' ')
    insertAtCursor((editableRef.current?.textContent?.endsWith(' ') ? '' : ' ') + mentions + ' ')
    setSelectedMentions(new Set())
    setMentionPickerOpen(false)
    setMentionSearch("")
  }, [insertAtCursor])

  const insertSelectedHashtags = useCallback(() => {
    if (selectedHashtags.size === 0) return
    const hashtags = Array.from(selectedHashtags).map(h => `#${h}`).join(' ')
    insertAtCursor((editableRef.current?.textContent?.endsWith(' ') ? '' : ' ') + hashtags + ' ')
    setSelectedHashtags(new Set())
    setHashtagPickerOpen(false)
    setHashtagSearch("")
  }, [insertAtCursor])

  const filteredHashtags = hashtagSearch.trim() === ""
    ? POPULAR_HASHTAGS
    : POPULAR_HASHTAGS.filter(tag => tag.toLowerCase().includes(hashtagSearch.toLowerCase()))

  useEffect(() => {
    if (!mentionPickerOpen) return
    const timer = setTimeout(() => {
      searchMentionsPicker(mentionSearch)
    }, 300)
    return () => clearTimeout(timer)
  }, [mentionSearch, mentionPickerOpen, searchMentionsPicker])

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
        <div className="border-b border-border bg-muted/30 px-4 py-1.5 flex items-center justify-between">
          {/* unchanged */}
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
              "relative z-10 px-4 py-3 text-sm leading-[1.5] tracking-normal outline-none min-h-[8rem] whitespace-pre-wrap break-words bg-transparent",
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
              color: 'transparent',  // hide plain text, show caret
              caretColor: 'var(--foreground)',
            }}
          />

          {/* suggestions, dialogs unchanged */}
        </div>
      </Card>

      {/* toolbar, media, link card, dialogs unchanged */}
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