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

import { useBluesky } from "@/lib/bluesky-context"

// Constants and types unchanged...
// (EMOJI_CATEGORIES, POPULAR_HASHTAGS, MentionSuggestion, LinkCardData, MediaFile, IMAGE_TYPES, VIDEO_TYPES, extractUrl)

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

  // ... (all other state and refs unchanged)

  // Define handleCancelOrEscape here so it's always available
  const handleCancelOrEscape = useCallback(() => {
    if (showMentionSuggestions || showHashtagSuggestions) {
      setShowMentionSuggestions(false)
      setShowHashtagSuggestions(false)
      return
    }

    if (text.trim() || mediaFiles.length > 0 || linkCard) {
      setShowDiscardDialog(true)
    } else {
      // Optional: close composer if you have a prop for it
      onCancel?.()
    }
  }, [showMentionSuggestions, showHashtagSuggestions, text, mediaFiles.length, linkCard, onCancel])

  // ... (syncScroll, useEffect for autoFocus, playWarningSound, fetchLinkCard, searchMentions, searchHashtags unchanged)

  const handleTextChange = (newText: string) => {
    onTextChange(newText)

    // ... (warning sound, link card debounce unchanged)

    const cursorPos = textareaRef.current?.selectionStart || newText.length
    const textBeforeCursor = newText.slice(0, cursorPos)

    const mentionMatch = textBeforeCursor.match(/@([a-zA-Z0-9.-]*)$/)
    if (mentionMatch) {
      const matchText = mentionMatch[1]
      const triggerIndex = textBeforeCursor.lastIndexOf('@')
      setAutocompletePosition(triggerIndex)
      setShowMentionSuggestions(true)
      setShowHashtagSuggestions(false)
      setSelectedSuggestionIndex(0)
      searchMentions(matchText)
    } else {
      setShowMentionSuggestions(false)
    }

    const hashtagMatch = textBeforeCursor.match(/#(\w*)$/)
    if (hashtagMatch) {
      const matchText = hashtagMatch[1]
      const triggerIndex = textBeforeCursor.lastIndexOf('#')
      setAutocompletePosition(triggerIndex)
      setShowHashtagSuggestions(true)
      setShowMentionSuggestions(false)
      setSelectedSuggestionIndex(0)
      if (matchText.length === 0) {
        setHashtagSuggestions(POPULAR_HASHTAGS.slice(0, 5))
      } else {
        searchHashtags(matchText)
      }
    } else {
      setShowHashtagSuggestions(false)
    }
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
      handleCancelOrEscape()
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

  // ... (handleMediaSelect, removeMedia, dismissLinkCard, insertEmoji, wrapSelection, insertAtLineStart, formatActions, renderHighlightedText unchanged)

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
              fontFamily: window.getComputedStyle(textareaRef.current || document.body).fontFamily,
              fontSize: 'inherit',
              lineHeight: 'inherit',
              letterSpacing: 'inherit',
              padding: 'inherit',
              wordWrap: 'break-word',
              whiteSpace: 'pre-wrap',
              overflow: 'hidden',
              color: 'var(--foreground)',
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

          {(showMentionSuggestions || showHashtagSuggestions) && (
            <Card
              className="absolute z-[9999] shadow-xl border border-primary/30 rounded-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
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
            </Card>
          )}
        </div>
      </Card>

      {/* ... rest of the component (TooltipProvider, media preview, link card, AlertDialog, file input) unchanged ... */}

    </div>
  )
}

export { IMAGE_TYPES, VIDEO_TYPES, MAX_VIDEO_SIZE }