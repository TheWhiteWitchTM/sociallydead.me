"use client"

import { useParams } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import { useBluesky } from "@/lib/bluesky-context"
import { PostCard } from "@/components/post-card"
import { PublicPostCard } from "@/components/public-post-card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { VerifiedBadge } from "@/components/verified-badge"
import { HandleLink } from "@/components/handle-link"
import { Loader2, RefreshCw, Vote, Gamepad2, Cpu, Heart, Rss, Newspaper, Search, ArrowLeft, Plus, Check, BeerOff, Video } from "lucide-react"

const categoryConfig: Record<string, { label: string; icon: React.ElementType; searchQuery: string }> = {
  news: {
    label: "News",
    icon: Newspaper,
    searchQuery: "news",
  },
  politics: {
    label: "Politics",
    icon: Vote,
    searchQuery: "politics",
  },
  games: {
    label: "Games",
    icon: Gamepad2,
    searchQuery: "gaming",
  },
  tech: {
    label: "Tech",
    icon: Cpu,
    searchQuery: "tech",
  },
  video: {
    label: "Video",
    icon: Video,
    searchQuery: "video",
  },
  adult: {
    label: "Adult",
    icon: BeerOff,
    searchQuery: "adult",
  },
}

interface FeedGenerator {
  uri: string
  cid: string
  did: string
  creator: {
    did: string
    handle: string
    displayName?: string
    avatar?: string
  }
  displayName: string
  description?: string
  avatar?: string
  likeCount?: number
  indexedAt: string
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

export default function FeedCategoryPage() {
  const params = useParams()
  const category = params.category as string
  const config = categoryConfig[category]

  const { 
    isAuthenticated, 
    isLoading: authLoading,
    user,
    searchFeedGenerators,
    getCustomFeed,
    getSavedFeeds,
    saveFeed,
    unsaveFeed,
  } = useBluesky()

  const [feeds, setFeeds] = useState<FeedGenerator[]>([])
  const [savedFeeds, setSavedFeeds] = useState<FeedGenerator[]>([])
  const [selectedFeed, setSelectedFeed] = useState<FeedGenerator | null>(null)
  const [feedPosts, setFeedPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [postsLoading, setPostsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [savingFeed, setSavingFeed] = useState<string | null>(null)

  const loadFeeds = useCallback(async () => {
    if (!config) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const query = searchQuery.trim() || config.searchQuery
      const result = await searchFeedGenerators(query)
      setFeeds(result.feeds)
      
      // Load saved feeds if authenticated
      if (isAuthenticated) {
        const saved = await getSavedFeeds()
        setSavedFeeds(saved)
      }
    } catch (err) {
      console.error("Failed to load feeds:", err)
      setError(err instanceof Error ? err.message : "Failed to load feeds")
    } finally {
      setIsLoading(false)
    }
  }, [config, searchQuery, searchFeedGenerators, isAuthenticated, getSavedFeeds])

  const loadFeedPosts = useCallback(async (feedUri: string) => {
    setPostsLoading(true)
    try {
      const result = await getCustomFeed(feedUri)
      setFeedPosts(result.posts)
    } catch (err) {
      console.error("Failed to load feed posts:", err)
      setError(err instanceof Error ? err.message : "Failed to load posts")
    } finally {
      setPostsLoading(false)
    }
  }, [getCustomFeed])

  const handleSelectFeed = (feed: FeedGenerator) => {
    setSelectedFeed(feed)
    loadFeedPosts(feed.uri)
  }

  const handleSaveFeed = async (feed: FeedGenerator) => {
    if (!isAuthenticated) return
    
    setSavingFeed(feed.uri)
    try {
      const isSaved = savedFeeds.some(f => f.uri === feed.uri)
      
      if (isSaved) {
        await unsaveFeed(feed.uri)
        setSavedFeeds(prev => prev.filter(f => f.uri !== feed.uri))
      } else {
        await saveFeed(feed.uri)
        setSavedFeeds(prev => [...prev, feed])
      }
    } catch (error) {
      console.error("Failed to save/unsave feed:", error)
    } finally {
      setSavingFeed(null)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    loadFeeds()
  }

  useEffect(() => {
    loadFeeds()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!config) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Category not found</p>
      </div>
    )
  }

  const Icon = config.icon

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Show feed content if a feed is selected
  if (selectedFeed) {
    return (
      <div className="min-h-screen">
        <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-14 items-center gap-4 px-4">
            <Button variant="ghost" size="icon" onClick={() => setSelectedFeed(null)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Avatar className="h-8 w-8">
                <AvatarImage src={selectedFeed.avatar || "/placeholder.svg"} />
                <AvatarFallback>
                  <Rss className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <h1 className="text-xl font-bold truncate">{selectedFeed.displayName}</h1>
            </div>
            <Button onClick={() => loadFeedPosts(selectedFeed.uri)} variant="ghost" size="icon" disabled={postsLoading}>
              <RefreshCw className={`h-4 w-4 ${postsLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-0 sm:px-4 py-6">
          {/* Feed Info */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedFeed.avatar || "/placeholder.svg"} />
                  <AvatarFallback>
                    <Rss className="h-8 w-8" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold">{selectedFeed.displayName}</h2>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    by <HandleLink handle={selectedFeed.creator.handle} className="text-sm" />
                    <VerifiedBadge handle={selectedFeed.creator.handle} />
                  </p>
                  {selectedFeed.description && (
                    <p className="text-sm mt-2">{selectedFeed.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Heart className="h-4 w-4" />
                      <span>{selectedFeed.likeCount || 0} likes</span>
                    </div>
                    {isAuthenticated && (
                      <Button 
                        size="sm" 
                        variant={savedFeeds.some(f => f.uri === selectedFeed.uri) ? "secondary" : "default"}
                        onClick={() => handleSaveFeed(selectedFeed)}
                        disabled={savingFeed === selectedFeed.uri}
                      >
                        {savingFeed === selectedFeed.uri ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : savedFeeds.some(f => f.uri === selectedFeed.uri) ? (
                          <Check className="h-4 w-4 mr-2" />
                        ) : (
                          <Plus className="h-4 w-4 mr-2" />
                        )}
                        {savedFeeds.some(f => f.uri === selectedFeed.uri) ? "Saved" : "Save Feed"}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Posts */}
          {postsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : feedPosts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground">No posts in this feed yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {feedPosts.map((post) => (
                isAuthenticated ? (
                  <PostCard
                    key={post.uri}
                    post={post}
                    isOwnPost={user?.did === post.author.did}
                    onPostUpdated={() => loadFeedPosts(selectedFeed.uri)}
                  />
                ) : (
                  <PublicPostCard key={post.uri} post={post} />
                )
              ))}
            </div>
          )}
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Icon className="h-5 w-5" />
            <h1 className="text-xl font-bold">{config.label} Feeds</h1>
          </div>
          <Button onClick={loadFeeds} variant="ghost" size="icon" disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-0 sm:px-4 py-6">
        {/* Search */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={`Search ${config.label.toLowerCase()} feeds...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit" disabled={isLoading}>
              Search
            </Button>
          </div>
        </form>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={loadFeeds} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </div>
        ) : feeds.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Rss className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No feeds found</p>
            <p className="text-sm text-muted-foreground mt-2">
              Try a different search term
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {feeds.map((feed) => (
              <Card 
                key={feed.uri}
                className="cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => handleSelectFeed(feed)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={feed.avatar || "/placeholder.svg"} />
                      <AvatarFallback>
                        <Rss className="h-6 w-6" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold">{feed.displayName}</h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            by <HandleLink handle={feed.creator.handle} className="text-sm" />
                            <VerifiedBadge handle={feed.creator.handle} />
                          </p>
                        </div>
                        {isAuthenticated && (
                          <Button 
                            size="icon"
                            variant={savedFeeds.some(f => f.uri === feed.uri) ? "secondary" : "outline"}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleSaveFeed(feed)
                            }}
                            disabled={savingFeed === feed.uri}
                            className="shrink-0"
                          >
                            {savingFeed === feed.uri ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : savedFeeds.some(f => f.uri === feed.uri) ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Plus className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>
                      {feed.description && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {feed.description}
                        </p>
                      )}
                      <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                        <Heart className="h-3 w-3" />
                        <span>{feed.likeCount || 0} likes</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
