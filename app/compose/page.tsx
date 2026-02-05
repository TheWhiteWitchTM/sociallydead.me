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
import { Loader2, Send, ImagePlus, X, AtSign, Hash } from "lucide-react"
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

export default function ComposePage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading, createPost, searchActors } = useBluesky()
  const [text, setText] = useState("")
  const [hasPlayedWarning, setHasPlayedWarning] = useState(false)
  const audioContextRef = useRef<AudioContext | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  
  // Autocomplete state
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false)
  const [showHashtagSuggestions, setShowHashtagSuggestions] = useState(false)
  const [mentionSuggestions, setMentionSuggestions] = useState<MentionSuggestion[]>([])
  const [hashtagSuggestions, setHashtagSuggestions] = useState<string[]>([])
  const [autocompleteQuery, setAutocompleteQuery] = useState("")
  const [autocompletePosition, setAutocompletePosition] = useState(0)
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0)
  const [isSearchingMentions, setIsSearchingMentions] = useState(false)

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
      
      oscillator.frequency.value = 440 // A4 note
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

  // Handle text change with sound and autocomplete
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
    
    // Focus textarea and move cursor after inserted text
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

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newImages = Array.from(files).slice(0, 4 - images.length) // Max 4 images
    if (newImages.length === 0) return

    setImages(prev => [...prev, ...newImages])
    
    // Generate previews
    newImages.forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreviews(prev => [...prev, e.target?.result as string])
      }
      reader.readAsDataURL(file)
    })

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
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
    if (!text.trim() && images.length === 0) return

    setIsPosting(true)
    setError(null)

    try {
      await createPost(text, { images: images.length > 0 ? images : undefined })
      setText("")
      setImages([])
      setImagePreviews([])
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

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center justify-between px-4">
          <h1 className="text-xl font-bold">Compose</h1>
          <Button 
            onClick={handleSubmit} 
            disabled={isPosting || !text.trim() || isOverLimit}
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

      <main className="max-w-2xl mx-auto px-4 py-6">
        {error && (
          <Card className="mb-4 border-destructive">
            <CardContent className="p-4 text-destructive">{error}</CardContent>
          </Card>
        )}

        <Tabs defaultValue="write" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="write">Write</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="write" className="mt-4">
            <div className="relative">
              <Textarea
                ref={textareaRef}
                placeholder="What's happening? (Markdown supported)"
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
            
            {/* Image Previews */}
            {imagePreviews.length > 0 && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeImage(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageSelect}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={images.length >= 4}
                >
                  <ImagePlus className="h-4 w-4 mr-2" />
                  Add Image {images.length > 0 && `(${images.length}/4)`}
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
            
            <p className="mt-2 text-xs text-muted-foreground">
              Supports: **bold**, *italic*, `code`, [links](url), lists
            </p>
          </TabsContent>

          <TabsContent value="preview" className="mt-4">
            <Card>
              <CardContent className="p-4">
                {text.trim() ? (
                  <MarkdownRenderer content={text} />
                ) : (
                  <p className="text-muted-foreground">Nothing to preview yet...</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
