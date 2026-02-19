"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { createPortal } from "react-dom"

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

// ... (all constants, functions, types, extractUrl, etc. unchanged from your last working version)

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
  // ... (all state, refs, effects, functions unchanged)

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

          {(showMentionSuggestions || showHashtagSuggestions) && createPortal(
            <div className="fixed inset-0 z-[9998] bg-black/30 pointer-events-none">
              <Card
                className="absolute z-[9999] shadow-xl border border-primary/30 rounded-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 pointer-events-auto"
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
            </div>,
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