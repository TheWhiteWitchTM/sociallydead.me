"use client"

import { useEffect, useState } from "react"
import { useBluesky } from "@/lib/bluesky-context"
import { SignInPrompt } from "@/components/sign-in-prompt"
import { PostCard } from "@/components/post-card"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Bookmark, Trash2 } from "lucide-react"

interface Post {
  uri: string
  cid: string
  author: {
    did: string
    handle: string
    displayName?: string
    avatar?: string
  }
  record: {
    text: string
    createdAt: string
    reply?: {
      root: { uri: string; cid: string }
      parent: { uri: string; cid: string }
    }
  }
  embed?: unknown
  replyCount: number
  repostCount: number
  likeCount: number
  viewer?: {
    like?: string
    repost?: string
  }
}

export default function BookmarksPage() {
  const { isAuthenticated, isLoading: authLoading, user, getPost, getBookmarks } = useBluesky()
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadBookmarks = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const bookmarkUris = await getBookmarks()

      if (bookmarkUris.length === 0) {
        setPosts([])
        return
      }

      const loadedPosts: Post[] = []
      // Load in chunks to avoid blocking
      for (const uri of bookmarkUris) {
        try {
          const post = await getPost(uri)
          if (post) {
            loadedPosts.push(post as Post)
          }
        } catch {
          // Post may have been deleted, skip it
        }
      }

      setPosts(loadedPosts)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load bookmarks")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      loadBookmarks()
    } else {
      setIsLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated])

  const clearAllBookmarks = () => {
    // Clear logic moved to context if needed, but for now we just show notice
    alert("Please remove bookmarks individually to sync with server.")
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <SignInPrompt title="Bookmarks" description="Sign in to view your saved posts" />
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Bookmark className="h-5 w-5" />
            <h1 className="text-xl font-bold">Bookmarks</h1>
          </div>
          {posts.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAllBookmarks} className="text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-0 sm:px-4 py-6">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <Card className="border-destructive">
            <CardContent className="p-4 text-destructive">{error}</CardContent>
          </Card>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Bookmark className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No bookmarks yet</h2>
            <p className="text-muted-foreground max-w-sm">
              When you bookmark posts, they will appear here. Click the menu on any post to save it.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard
                key={post.uri}
                post={post}
                isOwnPost={post.author.did === user?.did}
                onPostUpdated={loadBookmarks}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
