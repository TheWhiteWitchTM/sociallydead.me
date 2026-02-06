"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useBluesky } from "@/lib/bluesky-context"
import { SignInPrompt } from "@/components/sign-in-prompt"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2, Plus, FileText, Calendar, ArrowRight } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface Article {
  uri: string
  rkey: string
  title: string
  content: string
  createdAt: string
  updatedAt?: string
}

export default function ArticlesPage() {
  const { isAuthenticated, isLoading: authLoading, user, getArticles } = useBluesky()
  const [articles, setArticles] = useState<Article[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadArticles = useCallback(async () => {
    if (!user) return
    setIsLoading(true)
    try {
      const result = await getArticles(user.did)
      setArticles(result)
    } catch (error) {
      console.error("Failed to load articles:", error)
    } finally {
      setIsLoading(false)
    }
  }, [user, getArticles])

  useEffect(() => {
    if (isAuthenticated && user) {
      loadArticles()
    } else if (!authLoading) {
      setIsLoading(false)
    }
  }, [isAuthenticated, authLoading, user, loadArticles])

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <SignInPrompt message="Sign in to create and manage your articles" />
  }

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <h1 className="text-xl font-bold">Articles</h1>
          </div>
          <Link href="/articles/new">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Article
            </Button>
          </Link>
        </div>
      </header>
      <div className="max-w-2xl mx-auto px-0 sm:px-4 py-6">
        <p className="text-muted-foreground text-sm mb-6 px-3 sm:px-0">
          Long-form content stored on Bluesky (SociallyDead exclusive)
        </p>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : articles.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No articles yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Write long-form content with markdown support. Articles are stored in your Bluesky account.
            </p>
            <Link href="/articles/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create your first article
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {articles.map((article) => (
            <Link key={article.uri} href={`/articles/${article.rkey}`}>
              <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{article.title}</CardTitle>
                  <CardDescription className="flex items-center gap-2 text-xs">
                    <Calendar className="h-3 w-3" />
                    {formatDistanceToNow(new Date(article.createdAt), { addSuffix: true })}
                    {article.updatedAt && (
                      <span className="text-muted-foreground">
                        (edited {formatDistanceToNow(new Date(article.updatedAt), { addSuffix: true })})
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {article.content.slice(0, 200)}...
                  </p>
                  <div className="flex items-center gap-1 mt-3 text-sm text-primary">
                    Read more <ArrowRight className="h-3 w-3" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
      </div>
    </>
  )
}
