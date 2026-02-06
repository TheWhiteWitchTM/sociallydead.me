"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useBluesky } from "@/lib/bluesky-context"
import { SignInPrompt } from "@/components/sign-in-prompt"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MarkdownRenderer } from "@/components/markdown-renderer"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, Send, ImagePlus, X, AtSign, Hash, PenSquare, Video, Paperclip, Link2, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"

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

interface LinkCardData {
  url: string
  title: string
  description: string
  image: string
}

type MediaFile = {
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
  // Check if URL is at the very start or end of the text
  const trimmed = text.trim()
  const firstUrl = matches[0]
  const lastUrl = matches[matches.length - 1]
  if (trimmed.startsWith(firstUrl)) return firstUrl
  if (trimmed.endsWith(lastUrl)) return lastUrl
  return null
}

export default function ComposePage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading, createPost, searchActors } = useBluesky()
  const [text, setText] = useState("")
  const [hasPlayedWarning, setHasPlayedWarning] = useState(false)
  const audioContextRef = useRef<AudioContext | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
  
  // Link card state
  const [linkCard, setLinkCard] = useState<LinkCardData | null>(null)
  const [linkCardLoading, setLinkCardLoading] = useState(false)
  const [linkCardUrl, setLinkCardUrl] = useState<string | null>(null)
  const [linkCardDismissed, setLinkCardDismissed] = useState(false)
  const linkCardDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  
  // Autocomplete state
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false)
  const [showHashtagSuggestions, setShowHashtagSuggestions] = useState(false)
  const [mentionSuggestions, setMentionSuggestions] = useState<MentionSuggestion[]>([])
  const [hashtagSuggestions, setHashtagSuggestions] = useState<string[]>([])
  const [autocompleteQuery, setAutocompleteQuery] = useState("")
  const [autocompletePosition, setAutocompletePosition] = useState(0)
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0)
  const [isSearchingMentions, setIsSearchingMentions] = useState(false)

  const hasVideo = mediaFiles.some(f => f.type === "video")
  const hasImages = mediaFiles.some(f => f.type === "image")
  const imageCount = mediaFiles.filter(f => f.type === "image").length

  // Play warning sound when hitting 275 characters
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
      // Audio not supported, ignore
    }
  }, [hasPlayedWarning])

  // Fetch link card metadata
  const fetchLinkCard = useCallback(async (url: string) => {
    if (linkCardDismissed) return
    setLinkCardLoading(true)
    try {
      const res = await fetch(`/api/og?url=${encodeURIComponent(url)}`)
      if (res.ok) {
        const data = await res.json()
        if (data.title || data.description) {
          setLinkCard(data)
          setLinkCardUrl(url)
        }
      }
    } catch {
      // Silently fail
    } finally {
      setLinkCardLoading(false)
    }
  }, [linkCardDismissed])

  // Search for mention suggestions
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

  // Search for hashtag suggestions
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

  // Handle text change with sound, autocomplete, and link detection
  const handleTextChange = (newText: string) => {
    setText(newText)
    
    // Reset warning flag if going back below 275
    if (newText.length < 275) {
      setHasPlayedWarning(false)
    }
    
    // Play sound when hitting 275
    if (newText.length >= 275 && text.length < 275) {
      playWarningSound()
    }

    // Detect URL at start/end for link card (debounced)
    if (linkCardDebounceRef.current) clearTimeout(linkCardDebounceRef.current)
    linkCardDebounceRef.current = setTimeout(() => {
      const url = extractUrl(newText)
      if (url && url !== linkCardUrl && !linkCardDismissed) {
        fetchLinkCard(url)
      } else if (!url) {
        setLinkCard(null)
        setLinkCardUrl(null)
        setLinkCardDismissed(false)
      }
    }, 800)

    // Check for @ or # autocomplete
    const cursorPos = textareaRef.current?.selectionStart || newText.length
    const textBeforeCursor = newText.slice(0, cursorPos)
    
    // Check for mention (@)
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/)
    if (mentionMatch) {
      setAutocompleteQuery(mentionMatch[1])
      setAutocompletePosition(cursorPos - mentionMatch[1].length - 1)
      setShowMentionSuggestions(true)
      setShowHashtagSuggestions(false)
      setSelectedSuggestionIndex(0)
      searchMentions(mentionMatch[1])
      return
    }
    
    // Check for hashtag (#)
    const hashtagMatch = textBeforeCursor.match(/#(\w*)$/)
    if (hashtagMatch) {
      setAutocompleteQuery(hashtagMatch[1])
      setAutocompletePosition(cursorPos - hashtagMatch[1].length - 1)
      setShowHashtagSuggestions(true)
      setShowMentionSuggestions(false)
      setSelectedSuggestionIndex(0)
      searchHashtags(hashtagMatch[1])
      return
    }
    
    // No autocomplete
    setShowMentionSuggestions(false)
    setShowHashtagSuggestions(false)
  }

  // Insert mention or hashtag
  const insertSuggestion = (suggestion: string, type: 'mention' | 'hashtag') => {
    const prefix = type === 'mention' ? '@' : '#'
    const beforeTrigger = text.slice(0, autocompletePosition)
    const cursorPos = textareaRef.current?.selectionStart || text.length
    const afterCursor = text.slice(cursorPos)
    
    const newText = beforeTrigger + prefix + suggestion + ' ' + afterCursor
    setText(newText)
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

  // Handle keyboard navigation in suggestions
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showMentionSuggestions && !showHashtagSuggestions) return
    
    const suggestions = showMentionSuggestions ? mentionSuggestions : hashtagSuggestions
    
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedSuggestionIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : 0
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedSuggestionIndex(prev => 
        prev > 0 ? prev - 1 : suggestions.length - 1
      )
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

  // Handle media file selection (images + videos)
  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newFiles = Array.from(files)
    
    for (const file of newFiles) {
      // Determine type
      const isImage = IMAGE_TYPES.includes(file.type)
      const isVideo = VIDEO_TYPES.includes(file.type)
      
      if (!isImage && !isVideo) continue
      
      // Bluesky rules: max 4 images OR 1 video, not both
      if (isVideo) {
        if (hasImages || hasVideo) continue // Can't mix or add multiple videos
        if (file.size > MAX_VIDEO_SIZE) continue // 50MB limit
        
        const preview = URL.createObjectURL(file)
        setMediaFiles([{ file, preview, type: "video" }])
        break // Only 1 video allowed
      }
      
      if (isImage) {
        if (hasVideo) continue // Can't mix
        if (imageCount >= MAX_IMAGES) continue
        
        const reader = new FileReader()
        reader.onload = (ev) => {
          setMediaFiles(prev => {
            if (prev.some(f => f.type === "video")) return prev
            if (prev.filter(f => f.type === "image").length >= MAX_IMAGES) return prev
            return [...prev, { file, preview: ev.target?.result as string, type: "image" }]
          })
        }
        reader.readAsDataURL(file)
      }
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeMedia = (index: number) => {
    setMediaFiles(prev => {
      const updated = prev.filter((_, i) => i !== index)
      // Revoke video object URLs
      if (prev[index]?.type === "video") {
        URL.revokeObjectURL(prev[index].preview)
      }
      return updated
    })
  }

  const dismissLinkCard = () => {
    setLinkCard(null)
    setLinkCardDismissed(true)
  }

  // Load draft from AI assistant if available
  useEffect(() => {
    const draft = sessionStorage.getItem("compose_draft")
    if (draft) {
      setText(draft)
      sessionStorage.removeItem("compose_draft")
    }
  }, [])

  const [isPosting, setIsPosting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!text.trim() && mediaFiles.length === 0) return

    setIsPosting(true)
    setError(null)

    try {
      const images = mediaFiles.filter(f => f.type === "image").map(f => f.file)
      const video = mediaFiles.find(f => f.type === "video")?.file
      
      await createPost(text, { 
        images: images.length > 0 ? images : undefined,
        video: video || undefined,
        linkCard: linkCard && !mediaFiles.length ? linkCard : undefined,
      })
      setText("")
      setMediaFiles([])
      setLinkCard(null)
      setLinkCardUrl(null)
      router.push("/")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create post")
    } finally {
      setIsPosting(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <SignInPrompt title="Compose" description="Sign in to create posts" />
  }

  const charCount = text.length
  const maxChars = 300
  const isOverLimit = charCount > maxChars

  // File input accept string based on current state
  const getAcceptTypes = () => {
    if (hasVideo) return "" // Disable further uploads
    if (hasImages) return IMAGE_TYPES.join(",") // Only images if already has images
    return ALL_MEDIA_TYPES.join(",") // Allow everything
  }

  const canAddMedia = !hasVideo && imageCount < MAX_IMAGES

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <PenSquare className="h-5 w-5" />
            <h1 className="text-xl font-bold">Compose</h1>
          </div>
          <Button 
            onClick={handleSubmit} 
            disabled={isPosting || (!text.trim() && mediaFiles.length === 0) || isOverLimit}
          >
            {isPosting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Post
          </Button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-0 sm:px-4 py-6">
        {error && (
          <Card className="mb-4 border-destructive rounded-none sm:rounded-lg border-x-0 sm:border-x">
            <CardContent className="p-4 text-destructive">{error}</CardContent>
          </Card>
        )}

        <Tabs defaultValue="write" className="w-full px-3 sm:px-0">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="write">Write</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="write" className="mt-4">
            <div className="relative">
              <Textarea
                ref={textareaRef}
                placeholder="What's happening?"
                value={text}
                onChange={(e) => handleTextChange(e.target.value)}
                onKeyDown={handleKeyDown}
                className="min-h-48 resize-none"
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
              <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground p-3 border rounded-lg">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading link preview...
              </div>
            )}
            {linkCard && !linkCardLoading && (
              <div className="mt-3 relative">
                <Card className="overflow-hidden">
                  {linkCard.image && (
                    <div className="aspect-video relative bg-muted">
                      <img
                        src={linkCard.image}
                        alt=""
                        className="w-full h-full object-cover"
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
                "mt-3 gap-2",
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
            
            <div className="mt-3 flex items-center justify-between">
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
                  <span className="hidden sm:inline">Image</span>
                  {imageCount > 0 && <span className="ml-1 text-xs">({imageCount}/{MAX_IMAGES})</span>}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Set accept to video only and trigger
                    if (fileInputRef.current) {
                      fileInputRef.current.accept = VIDEO_TYPES.join(",")
                      fileInputRef.current.multiple = false
                      fileInputRef.current.click()
                      // Reset accept after click
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
                  <span className="hidden sm:inline">Video</span>
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
            
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <span>Tip: Paste a URL at the start or end to attach a link card</span>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="mt-4">
            <Card>
              <CardContent className="p-4">
                {text.trim() ? (
                  <MarkdownRenderer content={text} />
                ) : (
                  <p className="text-muted-foreground">Nothing to preview yet...</p>
                )}
                {linkCard && (
                  <a href={linkCard.url} target="_blank" rel="noopener noreferrer" className="block mt-3">
                    <Card className="overflow-hidden hover:bg-accent/50 transition-colors">
                      {linkCard.image && (
                        <div className="aspect-video relative">
                          <img src={linkCard.image} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <CardContent className="p-3">
                        <p className="font-medium line-clamp-2">{linkCard.title}</p>
                        {linkCard.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{linkCard.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2 truncate">{linkCard.url}</p>
                      </CardContent>
                    </Card>
                  </a>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
