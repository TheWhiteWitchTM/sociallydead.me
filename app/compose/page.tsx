"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useBluesky } from "@/lib/bluesky-context"
import { useComposeContext } from "@/lib/compose-context"
import { SignInPrompt } from "@/components/sign-in-prompt"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ComposeInput, type LinkCardData, type MediaFile } from "@/components/compose-input"
import {Loader2, Send, PenSquare, Rss, MessageSquare, X, ArrowLeft, WrapTextIcon} from "lucide-react"
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
import {PageHeader} from "@/components/page-header";

export default function ComposePage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading, createPost } = useBluesky()
  const { context, clearContext } = useComposeContext()
  const [text, setText] = useState("")
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
  const [linkCard, setLinkCard] = useState<LinkCardData | null>(null)
  const [isPosting, setIsPosting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDiscardDialog, setShowDiscardDialog] = useState(false)

  // Check if there's content
  const hasContent = text.trim().length > 0 || mediaFiles.length > 0 || linkCard !== null

  // Load draft from AI assistant if available
  useEffect(() => {
    const draft = sessionStorage.getItem("compose_draft")
    if (draft) {
      setText(draft)
      sessionStorage.removeItem("compose_draft")
    }
  }, [])

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        handleCancel()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [hasContent])

  const handleCancel = () => {
    setText("")
    router.back()

  }

  const handleDiscard = () => {
    clearContext()
    router.back()
  }

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
        reply: context?.replyTo ? { uri: context.replyTo.uri, cid: context.replyTo.cid } : undefined,
        quote: context?.quotePost,
      })
      setText("")
      setMediaFiles([])
      setLinkCard(null)
      clearContext()
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
  const isOverLimit = charCount > 300

  return (
    <div className="min-h-screen">
      <PageHeader
        isLoading={isPosting}
        rightContent={
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCancel}
            disabled={isPosting}
            className="shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        }
      >
        <PenSquare/>
        Write a post
      </PageHeader>

      <main className="max-w-2xl mx-auto px-0 sm:px-4 py-6">
        {error && (
          <Card className="mb-4 border-destructive rounded-none sm:rounded-lg border-x-0 sm:border-x">
            <CardContent className="p-4 text-destructive">{error}</CardContent>
          </Card>
        )}

        <div className="w-full px-3 sm:px-0">
          <div className="mt-4">
            <div className="bg-background rounded-xl border-none sm:border shadow-sm overflow-hidden">
              <ComposeInput
                text={text}
                onTextChange={setText}
                mediaFiles={mediaFiles}
                onMediaFilesChange={setMediaFiles}
                linkCard={linkCard}
                onLinkCardChange={setLinkCard}
                placeholder="What's happening?"
                minHeight="min-h-48"
                onCancel={handleCancel}
                onSubmit={handleSubmit}
                autoFocus
              />
            </div>
            <div className="mt-4 p-4 rounded-xl bg-primary/5 border border-primary/10 flex items-start gap-3">
              <div className="bg-primary/20 p-1.5 rounded-lg text-primary">
                <PenSquare className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Pro Tip</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Type @ to mention someone or # for hashtags. Paste a URL at the start or end to generate a rich link preview card.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
