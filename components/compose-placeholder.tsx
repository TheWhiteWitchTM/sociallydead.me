"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { PenSquare, X } from "lucide-react"
import { ComposeInput, type MediaFile, type LinkCardData } from "@/components/compose-input"
import { useBluesky } from "@/lib/bluesky-context"
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

interface ComposePlaceholderProps {
  placeholder?: string
  onSuccess?: () => void
  postType?: "post" | "reply" | "quote" | "article" | "dm"
  className?: string
}

export function ComposePlaceholder({
  placeholder = "What's happening?",
  onSuccess,
  postType = "post",
  className
}: ComposePlaceholderProps) {
  const { user, createPost } = useBluesky()
  const [isExpanded, setIsExpanded] = useState(false)
  const [text, setText] = useState("")
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
  const [linkCard, setLinkCard] = useState<LinkCardData | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDiscardDialog, setShowDiscardDialog] = useState(false)

  // Check if there's content to save
  const hasContent = text.trim().length > 0 || mediaFiles.length > 0 || linkCard !== null

  const handleCancel = () => {
    setIsExpanded(false)
  }

  const handleDiscard = () => {
    setText("")
    setMediaFiles([])
    setLinkCard(null)
    setIsExpanded(false)
    setShowDiscardDialog(false)
  }

  // Handle ESC key
  useEffect(() => {
    if (!isExpanded) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        handleCancel()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isExpanded, hasContent])

  const handleSubmit = async () => {
    if (!text.trim() && mediaFiles.length === 0) return

    setIsSubmitting(true)
    try {
      const images = mediaFiles.filter(f => f.type === "image").map(f => f.file)
      const video = mediaFiles.find(f => f.type === "video")?.file

      await createPost(text, {
        images: images.length > 0 ? images : undefined,
        video: video || undefined,
        linkCard: linkCard && !mediaFiles.length ? linkCard : undefined,
      })

      // Reset after successful post
      setText("")
      setMediaFiles([])
      setLinkCard(null)
      setIsExpanded(false)

      // Callback for parent to refresh feed
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error("Failed to post:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isExpanded) {
    return (
      <ComposeInput
                text={text}
                onTextChange={setText}
                mediaFiles={mediaFiles}
                onMediaFilesChange={setMediaFiles}
                linkCard={linkCard}
                onLinkCardChange={setLinkCard}
                placeholder={placeholder}
                postType={postType}
                onCancel={handleCancel}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                autoFocus={true}
                compact={true}
      />
    )
  }

  return (
    <Card
      className={cn("mb-6 cursor-pointer hover:bg-accent/50 transition-colors", className)}
      onClick={() => setIsExpanded(true)}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user?.avatar || "/placeholder.svg"} alt={user?.displayName || user?.handle} />
            <AvatarFallback className="text-xs">
              {(user?.displayName || user?.handle || "?").slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 flex items-center gap-2 text-muted-foreground">
            <PenSquare className="h-4 w-4" />
            <span className="text-sm">{placeholder}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
