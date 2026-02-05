"use client"

import { useState, useEffect, useCallback, useRef, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useBluesky } from "@/lib/bluesky-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MarkdownRenderer } from "@/components/markdown-renderer"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, ArrowLeft, Pencil, Trash2, Save, Calendar, X } from "lucide-react"
import { formatDistanceToNow, format } from "date-fns"
import { cn } from "@/lib/utils"

interface Article {
  uri: string
  rkey: string
  title: string
  content: string
  createdAt: string
  updatedAt?: string
}

const MAX_CHARS = 2000

export default function ArticlePage({ params }: { params: Promise<{ rkey: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading, getArticle, updateArticle, deleteArticle } = useBluesky()
  const [article, setArticle] = useState<Article | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState("")
  const [editContent, setEditContent] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasPlayedWarning, setHasPlayedWarning] = useState(false)
  const audioContextRef = useRef<AudioContext | null>(null)

  const charCount = editContent.length
  const isOverLimit = charCount > MAX_CHARS

  const loadArticle = useCallback(async () => {
    if (!user) return
    setIsLoading(true)
    try {
      const result = await getArticle(user.did, resolvedParams.rkey)
      if (result) {
        setArticle(result)
        setEditTitle(result.title)
        setEditContent(result.content)
      }
    } catch (error) {
      console.error("Failed to load article:", error)
    } finally {
      setIsLoading(false)
    }
  }, [user, resolvedParams.rkey, getArticle])

  useEffect(() => {
    if (isAuthenticated && user) {
      loadArticle()
    } else if (!authLoading) {
      setIsLoading(false)
    }
  }, [isAuthenticated, authLoading, user, loadArticle])

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
    setEditContent(newContent)
    
    if (newContent.length < 1800) {
      setHasPlayedWarning(false)
    }
    
    if (newContent.length >= 1800 && editContent.length < 1800) {
      playWarningSound()
    }
  }

  const handleSave = async () => {
    if (!editTitle.trim() || !editContent.trim() || isOverLimit) return

    setIsSaving(true)
    setError(null)

    try {
      await updateArticle(resolvedParams.rkey, editTitle.trim(), editContent.trim())
      await loadArticle()
      setIsEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update article")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteArticle(resolvedParams.rkey)
      router.push("/articles")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete article")
      setIsDeleting(false)
    }
  }

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!article) {
    return (
      <div className="container max-w-4xl py-6 px-4">
        <div className="flex flex-col items-center justify-center py-12">
          <h2 className="text-xl font-semibold mb-2">Article not found</h2>
          <p className="text-muted-foreground mb-4">This article may have been deleted.</p>
          <Link href="/articles">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Articles
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl py-6 px-4">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/articles">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1" />
        {isAuthenticated && !isEditing && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        )}
        {isEditing && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => {
              setIsEditing(false)
              setEditTitle(article.title)
              setEditContent(article.content)
            }}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving || isOverLimit}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save
            </Button>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      {isEditing ? (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <Input
              placeholder="Article title"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="text-lg font-semibold"
              maxLength={100}
            />

            <Tabs defaultValue="write" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="write">Write</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>
              
              <TabsContent value="write" className="mt-4">
                <Textarea
                  placeholder="Write your article here..."
                  value={editContent}
                  onChange={(e) => handleContentChange(e.target.value)}
                  className="min-h-[400px] resize-none font-mono text-sm"
                />
                <div className="mt-2 flex items-center justify-between text-sm">
                  <p className="text-muted-foreground">Markdown supported</p>
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
                  {editTitle && <h1 className="text-2xl font-bold mb-4">{editTitle}</h1>}
                  {editContent ? (
                    <MarkdownRenderer content={editContent} />
                  ) : (
                    <p className="text-muted-foreground">Nothing to preview...</p>
                  )}
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      ) : (
        <article className="prose prose-neutral dark:prose-invert max-w-none">
          <h1 className="text-3xl font-bold mb-2">{article.title}</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8 not-prose">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {format(new Date(article.createdAt), "MMMM d, yyyy")}
            </span>
            {article.updatedAt && (
              <span>
                Updated {formatDistanceToNow(new Date(article.updatedAt), { addSuffix: true })}
              </span>
            )}
          </div>
          <MarkdownRenderer content={article.content} />
        </article>
      )}

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Article</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this article? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
