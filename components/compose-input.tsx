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
import Mention from '@tiptap/extension-mention'
import CharacterCount from '@tiptap/extension-character-count'

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

  // Tiptap editor with custom styles
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2],
        },
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      CharacterCount.configure({
        limit: effectiveMaxChars === Infinity ? null : effectiveMaxChars,
      }),
      // Optional: mention extension for @autocomplete (can replace manual popup)
      Mention.configure({
        HTMLAttributes: {
          class: 'text-red-600 font-medium bg-red-500/5 px-0.5 rounded',
        },
      }),
    ],
    content: text,
    editorProps: {
      attributes: {
        class: cn(
          "px-4 py-3 text-sm leading-[1.5] tracking-normal outline-none min-h-[8rem] whitespace-pre-wrap break-words focus-visible:outline-none prose max-w-none prose-red prose-a:text-red-600 prose-a:underline prose-a:no-underline-hover",
          minHeight
        ),
      },
    },
    onUpdate: ({ editor }) => {
      const newText = editor.getText()
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
    },
  })

  // ... all your other state variables and functions (searchMentions, handleMediaSelect, dialogs, etc.) remain unchanged ...

  // Toolbar actions using Tiptap commands
  const formatActions = [
    { icon: Bold, label: "Bold", action: () => editor?.chain().focus().toggleBold().run() },
    { icon: Italic, label: "Italic", action: () => editor?.chain().focus().toggleItalic().run() },
    { icon: Strikethrough, label: "Strikethrough", action: () => editor?.chain().focus().toggleStrike().run() },
    { icon: Code, label: "Code", action: () => editor?.chain().focus().toggleCode().run() },
    { icon: Heading1, label: "Heading 1", action: () => editor?.chain().focus().toggleHeading({ level: 1 }).run() },
    { icon: Heading2, label: "Heading 2", action: () => editor?.chain().focus().toggleHeading({ level: 2 }).run() },
    { icon: Quote, label: "Quote", action: () => editor?.chain().focus().toggleBlockquote().run() },
    { icon: List, label: "Bullet List", action: () => editor?.chain().focus().toggleBulletList().run() },
    { icon: ListOrdered, label: "Numbered List", action: () => editor?.chain().focus().toggleOrderedList().run() },
    { icon: Link2, label: "Link", action: () => {
        const previousUrl = editor?.getAttributes('link').href
        const url = window.prompt('URL', previousUrl)
        if (url === null) return
        if (url === '') {
          editor?.chain().focus().extendMarkRange('link').unsetLink().run()
          return
        }
        editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
      }},
  ]

  // Insert suggestion using Tiptap
  const insertSuggestion = useCallback((suggestion: string, type: 'mention' | 'hashtag') => {
    const prefix = type === 'mention' ? '@' : '#'
    editor?.commands.insertContent(prefix + suggestion + ' ')
    setShowMentionSuggestions(false)
    setShowHashtagSuggestions(false)
  }, [editor])

  const insertEmoji = useCallback((emoji: string) => {
    editor?.commands.insertContent(emoji)
  }, [editor])

  // ... rest of your code (handleMediaSelect, dialogs, toolbar render, etc.) unchanged ...

  return (
    <div className="space-y-2">
      <Card className="border-2 focus-within:border-primary transition-colors overflow-hidden">
        <div className="border-b border-border bg-muted/30 px-4 py-1.5 flex items-center justify-between">
          {/* header unchanged */}
        </div>

        <div className="relative">
          <EditorContent editor={editor} />

          {/* Mention suggestions popup */}
          {showMentionSuggestions && (mentionSuggestions.length > 0 || isSearchingMentions) && (
            <Card className="absolute left-4 w-80 sm:w-96 z-[100] mt-1 shadow-xl border-primary/20 animate-in fade-in slide-in-from-top-2 duration-200">
              {/* ... your existing popup content ... */}
            </Card>
          )}

          {/* Hashtag suggestions popup */}
          {showHashtagSuggestions && hashtagSuggestions.length > 0 && (
            <Card className="absolute left-4 w-80 sm:w-96 z-[100] mt-1 shadow-xl border-primary/20 animate-in fade-in slide-in-from-top-2 duration-200">
              {/* ... your existing popup content ... */}
            </Card>
          )}
        </div>
      </Card>

      {/* Toolbar with Tiptap commands */}
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

            {/* ... emoji picker, format actions (now using editor.chain() above), mention/hashtag picker unchanged ... */}
          </div>
        </div>
      </TooltipProvider>

      {/* ... media previews, link card, dialogs unchanged ... */}
    </div>
  )
}

export { IMAGE_TYPES, VIDEO_TYPES, MAX_VIDEO_SIZE }