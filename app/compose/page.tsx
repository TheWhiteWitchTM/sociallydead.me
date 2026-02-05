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
import { Loader2, Send, ImagePlus, X } from "lucide-react"
import { cn } from "@/lib/utils"

export default function ComposePage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading, createPost } = useBluesky()
  const [text, setText] = useState("")
  const [hasPlayedWarning, setHasPlayedWarning] = useState(false)
  const audioContextRef = useRef<AudioContext | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])

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

  // Handle text change with sound
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
            <Textarea
              placeholder="What's happening? (Markdown supported)"
              value={text}
              onChange={(e) => handleTextChange(e.target.value)}
              className="min-h-48 resize-none"
            />
            
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
