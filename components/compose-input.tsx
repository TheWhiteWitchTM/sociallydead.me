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

// … all your other constants, interfaces, types, extractUrl function …

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
  const canAddMedia = !hasVideo && imageCount < 4   // ← hard-coded 4 since MAX_IMAGES was causing pain

  const charCount = text.length
  const isOverLimit = effectiveMaxChars !== Infinity && charCount > effectiveMaxChars   // ← this is the new line

  const progress = effectiveMaxChars !== Infinity ? Math.min((charCount / effectiveMaxChars) * 100, 100) : 0
  const isNearLimit = progress >= 70
  const isWarning = progress >= 90

  // … all the rest of your hooks, callbacks, functions (simulateEscape, forceClose, handleCancelOrEscape, handleDiscard, syncScroll, playWarningSound, fetchLinkCard, searchMentions, etc.) remain 100% unchanged …

  return (
    <div className="space-y-4">
      <Card className="border-2 focus-within:border-primary transition-colors overflow-hidden">
        <div className="border-b border-border bg-muted/30 px-4 py-1.5 flex items-center justify-between">
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
                  isOverLimit   // ← this is the only real functional change
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

        {/* Everything below this line is unchanged from your last working version */}
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

          {/* suggestions, media preview, link card, toolbars, dialogs — all exactly as you had them */}
        </div>
      </Card>

      {/* … the rest of your bottom part (media, link card, dialogs, alert) stays identical … */}
    </div>
  )
}