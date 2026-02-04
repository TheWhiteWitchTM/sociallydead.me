"use client"

import { useState } from "react"
import { useBluesky } from "@/lib/bluesky-context"
import { SignInPrompt } from "@/components/sign-in-prompt"
import { PostCard } from "@/components/post-card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Search } from "lucide-react"

interface SearchResult {
  posts: Array<{
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
    replyCount: number
    repostCount: number
    likeCount: number
    viewer?: {
      like?: string
      repost?: string
    }
  }>
  actors: Array<{
    did: string
    handle: string
    displayName?: string
    avatar?: string
    description?: string
  }>
}

export default function SearchPage() {
  const { agent, user, isAuthenticated, isLoading: authLoading } = useBluesky()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult>({ posts: [], actors: [] })
  const [isSearching, setIsSearching] = useState(false)

  const handleSearch = async () => {
    if (!agent || !query.trim()) return

    setIsSearching(true)
    try {
      const [postsRes, actorsRes] = await Promise.all([
        agent.app.bsky.feed.searchPosts({ q: query, limit: 25 }),
        agent.app.bsky.actor.searchActors({ q: query, limit: 10 }),
      ])

      setResults({
        posts: postsRes.data.posts.map((post) => ({
          uri: post.uri,
          cid: post.cid,
          author: {
            did: post.author.did,
            handle: post.author.handle,
            displayName: post.author.displayName,
            avatar: post.author.avatar,
          },
          record: post.record as SearchResult["posts"][0]["record"],
          replyCount: post.replyCount ?? 0,
          repostCount: post.repostCount ?? 0,
          likeCount: post.likeCount ?? 0,
          viewer: post.viewer,
        })),
        actors: actorsRes.data.actors.map((actor) => ({
          did: actor.did,
          handle: actor.handle,
          displayName: actor.displayName,
          avatar: actor.avatar,
          description: actor.description,
        })),
      })
    } catch (error) {
      console.error("Search failed:", error)
    } finally {
      setIsSearching(false)
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
    return <SignInPrompt title="Search" description="Sign in to search posts and users" />
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center px-4">
          <h1 className="text-xl font-bold">Search</h1>
        </div>
      </header>

      <main className="container max-w-2xl px-4 py-6">
        <div className="flex gap-2 mb-6">
          <Input
            placeholder="Search posts and users..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <Button onClick={handleSearch} disabled={isSearching}>
            {isSearching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>

        {(results.posts.length > 0 || results.actors.length > 0) && (
          <Tabs defaultValue="posts">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="posts">Posts ({results.posts.length})</TabsTrigger>
              <TabsTrigger value="users">Users ({results.actors.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="posts" className="mt-4 space-y-4">
              {results.posts.map((post) => (
                <PostCard
                  key={post.uri}
                  post={post}
                  isOwnPost={user?.did === post.author.did}
                  onPostUpdated={handleSearch}
                />
              ))}
            </TabsContent>

            <TabsContent value="users" className="mt-4 space-y-4">
              {results.actors.map((actor) => (
                <Card key={actor.did}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={actor.avatar || "/placeholder.svg"} alt={actor.displayName || actor.handle} />
                        <AvatarFallback>
                          {(actor.displayName || actor.handle).slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{actor.displayName || actor.handle}</p>
                        <p className="text-sm text-muted-foreground">@{actor.handle}</p>
                        {actor.description && (
                          <p className="mt-1 text-sm line-clamp-2">{actor.description}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        )}

        {query && !isSearching && results.posts.length === 0 && results.actors.length === 0 && (
          <p className="text-center text-muted-foreground py-12">No results found</p>
        )}
      </main>
    </div>
  )
}
