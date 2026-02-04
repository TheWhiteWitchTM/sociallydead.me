"use client"

import React from "react"

import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MarkdownRenderer } from "@/components/markdown-renderer"
import { Loader2, Heart, MessageCircle, Repeat2, Vote, Gamepad2, Cpu, HeartIcon as HealthIcon } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

const categoryConfig: Record<string, { label: string; icon: React.ElementType; searchTerms: string[] }> = {
	news: {
		label: "News",
		icon: Vote,
		searchTerms: ["news"],
	},
	politics: {
    label: "Politics",
    icon: Vote,
    searchTerms: ["politics", "election", "government", "congress", "senate", "democracy"],
  },
  games: {
    label: "Games",
    icon: Gamepad2,
    searchTerms: ["gaming", "videogames", "playstation", "xbox", "nintendo", "steam"],
  },
  tech: {
    label: "Tech",
    icon: Cpu,
    searchTerms: ["technology", "programming", "coding", "ai", "software", "startup"],
  },
  health: {
    label: "Health",
    icon: HealthIcon,
    searchTerms: ["health", "fitness", "wellness", "nutrition", "mental health", "exercise"],
  },
}

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
  }
  likeCount?: number
  repostCount?: number
  replyCount?: number
}

export default function FeedCategoryPage() {
  const params = useParams()
  const category = params.category as string
  const config = categoryConfig[category]

  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCategoryFeed = async () => {
      if (!config) {
        setError("Unknown category")
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        // Use our API route to avoid CORS issues
        const response = await fetch(`/api/feed?category=${encodeURIComponent(category)}`)

        if (!response.ok) {
          throw new Error("Failed to fetch feed")
        }

        const data = await response.json()
        setPosts(data.posts || [])
      } catch (err) {
        console.error("Error fetching category feed:", err)
        setError("Failed to load feed")
      } finally {
        setIsLoading(false)
      }
    }

    fetchCategoryFeed()
  }, [category, config])

  if (!config) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Category not found</p>
      </div>
    )
  }

  const Icon = config.icon

  return (
    <div className="container max-w-2xl py-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{config.label}</h1>
          <p className="text-sm text-muted-foreground">
            Discover posts about {config.label.toLowerCase()}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="py-12 text-center text-muted-foreground">{error}</div>
      ) : posts.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          No posts found for this category
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <Card key={post.uri} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={post.author.avatar || "/placeholder.svg"}
                      alt={post.author.displayName || post.author.handle}
                    />
                    <AvatarFallback>
                      {(post.author.displayName || post.author.handle)
                        .slice(0, 2)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold truncate">
                        {post.author.displayName || post.author.handle}
                      </span>
                      <span className="text-sm text-muted-foreground truncate">
                        @{post.author.handle}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(post.record.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                    <div className="mt-2">
                      <MarkdownRenderer content={post.record.text} />
                    </div>
                    <div className="mt-3 flex items-center gap-6 text-muted-foreground">
                      <div className="flex items-center gap-1.5 text-sm">
                        <MessageCircle className="h-4 w-4" />
                        <span>{post.replyCount || 0}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm">
                        <Repeat2 className="h-4 w-4" />
                        <span>{post.repostCount || 0}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm">
                        <Heart className="h-4 w-4" />
                        <span>{post.likeCount || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
