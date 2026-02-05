"use client"

import { useState } from "react"
import Link from "next/link"
import { useBluesky } from "@/lib/bluesky-context"
import { PostCard } from "@/components/post-card"
import { PublicPostCard } from "@/components/public-post-card"
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
  const { user, isAuthenticated, searchPosts, searchActors } = useBluesky()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult>({ posts: [], actors: [] })
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = async () => {
    if (!query.trim()) return

    setIsSearching(true)
    setHasSearched(true)
    
    try {
      const [postsRes, actorsRes] = await Promise.all([
        searchPosts(query),
        searchActors(query),
      ])

      setResults({
        posts: postsRes.posts,
        actors: actorsRes.actors,
      })
    } catch (error) {
      console.error("Search failed:", error)
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-4">
          <h1 className="text-xl font-bold">Search</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-2 sm:px-4 py-6">
        <div className="flex gap-2 mb-6">
          <Input
            placeholder="Search posts and users..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <Button onClick={handleSearch} disabled={isSearching || !query.trim()}>
            {isSearching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>

        {isSearching ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (results.posts.length > 0 || results.actors.length > 0) ? (
          <Tabs defaultValue="posts">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="posts">Posts ({results.posts.length})</TabsTrigger>
              <TabsTrigger value="users">Users ({results.actors.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="posts" className="mt-4 space-y-4">
              {results.posts.map((post) => (
                isAuthenticated ? (
                  <PostCard
                    key={post.uri}
                    post={post}
                    isOwnPost={user?.did === post.author.did}
                    onPostUpdated={handleSearch}
                  />
                ) : (
                  <PublicPostCard key={post.uri} post={post} />
                )
              ))}
            </TabsContent>

            <TabsContent value="users" className="mt-4 space-y-4">
              {results.actors.map((actor) => (
                <Link key={actor.did} href={`/profile/${actor.handle}`}>
                  <Card className="hover:bg-accent/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={actor.avatar || "/placeholder.svg"} alt={actor.displayName || actor.handle} />
                          <AvatarFallback>
                            {(actor.displayName || actor.handle).slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">{actor.displayName || actor.handle}</p>
                          <p className="text-sm text-muted-foreground">@{actor.handle}</p>
                          {actor.description && (
                            <p className="mt-1 text-sm line-clamp-2 text-muted-foreground">{actor.description}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </TabsContent>
          </Tabs>
        ) : hasSearched ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No results found for "{query}"</p>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Search for posts and users on Bluesky</p>
          </div>
        )}
      </main>
    </div>
  )
}
