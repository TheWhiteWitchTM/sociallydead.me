"use client"

import { useEffect, useState, useCallback } from "react"
import { useBluesky } from "@/lib/bluesky-context"
import { PostCard } from "@/components/post-card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, RefreshCw, Plus, Check, Heart, Rss, ArrowLeft } from "lucide-react"

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
  viewer?: {
    like?: string
  }
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
  embed?: {
    $type: string
    record?: {
      uri: string
      cid: string
      author: {
        did: string
        handle: string
        displayName?: string
        avatar?: string
      }
      value: {
        text: string
        createdAt: string
      }
    }
    images?: Array<{
      thumb: string
      fullsize: string
      alt: string
    }>
  }
  replyCount: number
  repostCount: number
  likeCount: number
  viewer?: {
    like?: string
    repost?: string
  }
}

export default function FeedsPage() {
  const { 
    isAuthenticated, 
    isLoading: authLoading, 
    user,
    getSavedFeeds,
    getPopularFeeds,
    getCustomFeed,
    saveFeed,
    unsaveFeed,
  } = useBluesky()
  
  const [savedFeeds, setSavedFeeds] = useState<FeedGenerator[]>([])
  const [popularFeeds, setPopularFeeds] = useState<FeedGenerator[]>([])
  const [selectedFeed, setSelectedFeed] = useState<FeedGenerator | null>(null)
  const [feedPosts, setFeedPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [postsLoading, setPostsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("saved")
  const [savingFeed, setSavingFeed] = useState<string | null>(null)

  const loadSavedFeeds = useCallback(async () => {
    if (!isAuthenticated) return
    
    try {
      const feeds = await getSavedFeeds()
      setSavedFeeds(feeds)
    } catch (err) {
      console.error("Failed to load saved feeds:", err)
    }
  }, [isAuthenticated, getSavedFeeds])

  const loadPopularFeeds = useCallback(async () => {
    try {
      const result = await getPopularFeeds()
      setPopularFeeds(result.feeds)
    } catch (err) {
      console.error("Failed to load popular feeds:", err)
    }
  }, [getPopularFeeds])

  const loadAll = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      await Promise.all([
        isAuthenticated ? loadSavedFeeds() : Promise.resolve(),
        loadPopularFeeds(),
      ])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load feeds")
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated, loadSavedFeeds, loadPopularFeeds])

  const loadFeedPosts = useCallback(async (feedUri: string) => {
    setPostsLoading(true)
    try {
      const result = await getCustomFeed(feedUri)
      setFeedPosts(result.posts)
    } catch (err) {
      console.error("Failed to load feed posts:", err)
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

  useEffect(() => {
    loadAll()
  }, [loadAll])

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

        <main className="max-w-2xl mx-auto px-4 py-6">
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
                  <p className="text-sm text-muted-foreground">
                    by @{selectedFeed.creator.handle}
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
                <PostCard
                  key={post.uri}
                  post={post}
                  isOwnPost={user?.did === post.author.did}
                  onPostUpdated={() => loadFeedPosts(selectedFeed.uri)}
                />
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
          <h1 className="text-xl font-bold">Feeds</h1>
          <Button onClick={loadAll} variant="ghost" size="icon" disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={loadAll} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full justify-start mb-4">
              {isAuthenticated && <TabsTrigger value="saved">My Feeds</TabsTrigger>}
              <TabsTrigger value="discover">Discover</TabsTrigger>
            </TabsList>
            
            {isAuthenticated && (
              <TabsContent value="saved" className="mt-0">
                {savedFeeds.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Rss className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No saved feeds yet</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Discover and save feeds to customize your experience
                    </p>
                    <Button 
                      onClick={() => setActiveTab("discover")} 
                      className="mt-4"
                      variant="outline"
                    >
                      Discover Feeds
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {savedFeeds.map((feed) => (
                      <FeedCard 
                        key={feed.uri} 
                        feed={feed} 
                        onClick={() => handleSelectFeed(feed)}
                        isSaved={true}
                        onSave={() => handleSaveFeed(feed)}
                        isSaving={savingFeed === feed.uri}
                        showSaveButton={isAuthenticated}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            )}
            
            <TabsContent value="discover" className="mt-0">
              {popularFeeds.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-muted-foreground">No feeds found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {popularFeeds.map((feed) => (
                    <FeedCard 
                      key={feed.uri} 
                      feed={feed} 
                      onClick={() => handleSelectFeed(feed)}
                      isSaved={savedFeeds.some(f => f.uri === feed.uri)}
                      onSave={() => handleSaveFeed(feed)}
                      isSaving={savingFeed === feed.uri}
                      showSaveButton={isAuthenticated}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  )
}

function FeedCard({ 
  feed, 
  onClick, 
  isSaved, 
  onSave, 
  isSaving,
  showSaveButton,
}: { 
  feed: FeedGenerator
  onClick: () => void
  isSaved: boolean
  onSave: () => void
  isSaving: boolean
  showSaveButton: boolean
}) {
  return (
    <Card 
      className="cursor-pointer hover:bg-accent/50 transition-colors"
      onClick={onClick}
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
                <p className="text-sm text-muted-foreground">
                  by @{feed.creator.handle}
                </p>
              </div>
              {showSaveButton && (
                <Button 
                  size="icon"
                  variant={isSaved ? "secondary" : "outline"}
                  onClick={(e) => {
                    e.stopPropagation()
                    onSave()
                  }}
                  disabled={isSaving}
                  className="shrink-0"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isSaved ? (
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
  )
}
