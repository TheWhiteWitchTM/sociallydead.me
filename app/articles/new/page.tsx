"use client"

import { useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useBluesky } from "@/lib/bluesky-context"
import { SignInPrompt } from "@/components/sign-in-prompt"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MarkdownRenderer } from "@/components/markdown-renderer"
import { Loader2, ArrowLeft, Save } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

const MAX_CHARS = 2000

export default function NewArticlePage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading, createArticle } = useBluesky()
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasPlayedWarning, setHasPlayedWarning] = useState(false)
  const audioContextRef = useRef<AudioContext | null>(null)

  const charCount = content.length
  const isOverLimit = charCount > MAX_CHARS

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

  const handleContentChange = (newContent: string) => {
    setContent(newContent)
    
    if (newContent.length < 1800) {
      setHasPlayedWarning(false)
    }
    
    if (newContent.length >= 1800 && content.length < 1800) {
      playWarningSound()
    }
  }

  const handleSave = async () => {
    if (!title.trim()) {
      setError("Please enter a title")
      return
    }
    if (!content.trim()) {
      setError("Please enter some content")
      return
    }
    if (isOverLimit) {
      setError("Content exceeds the character limit")
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const { rkey } = await createArticle(title.trim(), content.trim())
      router.push(`/articles/${rkey}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create article")
    } finally {
      setIsSaving(false)
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
    return <SignInPrompt message="Sign in to create articles" />
  }

  return (
    <div className="container max-w-4xl py-6 px-4">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/articles">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">New Article</h1>
          <p className="text-muted-foreground text-sm">Write long-form content with markdown</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving || isOverLimit || !title.trim() || !content.trim()}>
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Publish
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div>
            <Input
              placeholder="Article title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-lg font-semibold"
              maxLength={100}
            />
          </div>

          <Tabs defaultValue="write" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="write">Write</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>
            
            <TabsContent value="write" className="mt-4">
              <Textarea
                placeholder="Write your article here... (Markdown supported)"
                value={content}
                onChange={(e) => handleContentChange(e.target.value)}
                className="min-h-[400px] resize-none font-mono text-sm"
              />
              <div className="mt-2 flex items-center justify-between text-sm">
                <p className="text-muted-foreground">
                  Supports: **bold**, *italic*, `code`, [links](url), lists, headers
                </p>
                <span className={cn(
                  "font-medium tabular-nums transition-colors",
                  charCount < 1600 && "text-muted-foreground",
                  charCount >= 1600 && charCount < 1800 && "text-orange-500",
                  charCount >= 1800 && "text-destructive font-bold"
                )}>
                  {charCount}/{MAX_CHARS}
                </span>
              </div>
            </TabsContent>
            
            <TabsContent value="preview" className="mt-4">
              <Card className="min-h-[400px] p-4">
                {title && <h1 className="text-2xl font-bold mb-4">{title}</h1>}
                {content ? (
                  <MarkdownRenderer content={content} />
                ) : (
                  <p className="text-muted-foreground">Nothing to preview yet...</p>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
