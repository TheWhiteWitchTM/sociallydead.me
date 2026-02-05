"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { useBluesky } from "@/lib/bluesky-context"
import { PostCard } from "@/components/post-card"
import { PublicPostCard } from "@/components/public-post-card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, RefreshCw, PenSquare, Settings, Users, Sparkles, Newspaper, Gamepad2, Globe } from "lucide-react"

// Known working Bluesky feed URIs
const KNOWN_FEEDS = {
  discover: "at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/whats-hot",
  news: "at://did:plc:kkf4naxqmweop7dv4l2iqqf5/app.bsky.feed.generator/verified-news",
  popular: "at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/hot-classic",
  science: "at://did:plc:jfhpnnst6flqway4eaeqzj2a/app.bsky.feed.generator/for-science",
  art: "at://did:plc:xov6daozlwtbqvgj3ypvczlp/app.bsky.feed.generator/art",
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
  reason?: {
    $type: string
    by?: {
      did: string
      handle: string
      displayName?: string
      avatar?: string
    }
  }
}

export default function HomePage() {
  const { isAuthenticated, isLoading, user, getTimeline, getCustomFeed, getPublicFeed, login } = useBluesky()
  const [posts, setPosts] = useState<Post[]>([])
  const [feedLoading, setFeedLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("following")

  const loadTimeline = useCallback(async () => {
    if (!isAuthenticated) return
    
    setFeedLoading(true)
    setError(null)
    
    try {
      const result = await getTimeline()
      setPosts(result.posts)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load timeline")
    } finally {
      setFeedLoading(false)
    }
  }, [isAuthenticated, getTimeline])

  const loadFeed = useCallback(async (feedUri: string) => {
    setFeedLoading(true)
    setError(null)
    
    try {
      const result = await getCustomFeed(feedUri)
      setPosts(result.posts)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load feed")
    } finally {
      setFeedLoading(false)
    }
  }, [getCustomFeed])

  const loadPublicFeed = useCallback(async () => {
    setFeedLoading(true)
    setError(null)
    
    try {
      const feed = await getPublicFeed()
      setPosts(feed)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load discover feed")
    } finally {
      setFeedLoading(false)
    }
  }, [getPublicFeed])

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab)
    
    if (tab === "following" && isAuthenticated) {
      loadTimeline()
    } else if (tab === "discover") {
      loadPublicFeed()
    } else if (tab === "news") {
      loadFeed(KNOWN_FEEDS.news)
    } else if (tab === "popular") {
      loadFeed(KNOWN_FEEDS.popular)
    } else if (tab === "science") {
      loadFeed(KNOWN_FEEDS.science)
    } else if (tab === "art") {
      loadFeed(KNOWN_FEEDS.art)
    }
  }, [isAuthenticated, loadTimeline, loadFeed, loadPublicFeed])

  const handleRefresh = () => {
    handleTabChange(activeTab)
  }

  useEffect(() => {
    if (isAuthenticated) {
      loadTimeline()
    } else {
      loadPublicFeed()
      setActiveTab("discover")
    }
  }, [isAuthenticated, loadTimeline, loadPublicFeed])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Not authenticated - show sign in prompt and discover feed
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen">
        <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-14 items-center justify-between px-4">
            <h1 className="text-xl font-bold">SociallyDead</h1>
            <Button onClick={() => login()} variant="default" size="sm">
              Sign In
            </Button>
          </div>
        </header>
        <main className="mx-auto max-w-2xl px-2 sm:px-4 py-6">
          {/* Sign In Card */}
          <Card className="mb-6 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary mb-4">
                  <span className="text-2xl font-bold text-primary-foreground">SD</span>
                </div>
                <h2 className="text-2xl font-bold mb-2">Join the conversation</h2>
                <p className="text-muted-foreground mb-4 max-w-sm">
                  Sign in with your Bluesky account to see your timeline, post updates, and connect with others.
                </p>
                <Button onClick={() => login()} size="lg" className="w-full max-w-xs">
                  Sign in with Bluesky
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Feed Tabs for non-authenticated users */}
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="w-full justify-start mb-4 overflow-x-auto flex-nowrap">
              <TabsTrigger value="discover" className="gap-1.5">
                <Sparkles className="h-4 w-4" />
                <span className="hidden sm:inline">Discover</span>
              </TabsTrigger>
              <TabsTrigger value="news" className="gap-1.5">
                <Newspaper className="h-4 w-4" />
                <span className="hidden sm:inline">News</span>
              </TabsTrigger>
              <TabsTrigger value="popular" className="gap-1.5">
                <Globe className="h-4 w-4" />
                <span className="hidden sm:inline">Popular</span>
              </TabsTrigger>
              <TabsTrigger value="science" className="gap-1.5">
                <Gamepad2 className="h-4 w-4" />
                <span className="hidden sm:inline">Science</span>
              </TabsTrigger>
              <TabsTrigger value="art" className="gap-1.5">
                <Sparkles className="h-4 w-4" />
                <span className="hidden sm:inline">Art</span>
              </TabsTrigger>
            </TabsList>
            
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold capitalize">{activeTab}</h2>
              <Button onClick={handleRefresh} variant="ghost" size="sm" disabled={feedLoading}>
                <RefreshCw className={`h-4 w-4 ${feedLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            
            {feedLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <p className="text-muted-foreground">{error}</p>
                <Button onClick={handleRefresh} variant="outline">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
              </div>
            ) : posts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-muted-foreground">No posts found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <PublicPostCard key={post.uri} post={post} />
                ))}
              </div>
            )}
          </Tabs>
        </main>
      </div>
    )
  }

  // Authenticated - show user profile card and timeline
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center justify-between px-4">
          <h1 className="text-xl font-bold">Home</h1>
          <Button onClick={handleRefresh} variant="ghost" size="icon" disabled={feedLoading}>
            <RefreshCw className={`h-4 w-4 ${feedLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </header>
      
      <main className="mx-auto max-w-2xl px-2 sm:px-4 py-6">
        {/* User Profile Card */}
        {user && (
          <Card className="mb-6">
            <CardContent className="p-0">
              {/* Banner */}
              {user.banner ? (
                <div className="h-24 sm:h-32 w-full bg-cover bg-center rounded-t-lg" style={{ backgroundImage: `url(${user.banner})` }} />
              ) : (
                <div className="h-24 sm:h-32 w-full bg-gradient-to-r from-primary/30 to-primary/10 rounded-t-lg" />
              )}
              
              <div className="px-3 sm:px-4 pb-4">
                {/* Avatar */}
                <div className="-mt-10 sm:-mt-12 mb-3">
                  <Link href="/profile">
                    <Avatar className="h-20 w-20 sm:h-24 sm:w-24 border-4 border-background cursor-pointer hover:opacity-90 transition-opacity">
                      <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.displayName || user.handle} />
                      <AvatarFallback className="text-xl">
                        {(user.displayName || user.handle).slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                </div>
                
                {/* User Info */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link href="/profile" className="hover:underline">
                      <h2 className="text-lg font-bold truncate">{user.displayName || user.handle}</h2>
                    </Link>
                    <p className="text-sm text-muted-foreground">@{user.handle}</p>
                  </div>
                  <div className="flex gap-2">
                    <Link href="/compose">
                      <Button size="sm">
                        <PenSquare className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Post</span>
                      </Button>
                    </Link>
                    <Link href="/settings">
                      <Button size="sm" variant="outline">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
                
                {/* Description */}
                {user.description && (
                  <p className="mt-2 text-sm line-clamp-2">{user.description}</p>
                )}
                
                {/* Stats */}
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  <Link href="/profile?tab=following" className="hover:underline">
                    <span className="font-semibold">{user.followsCount || 0}</span>
                    <span className="text-muted-foreground ml-1">Following</span>
                  </Link>
                  <Link href="/profile?tab=followers" className="hover:underline">
                    <span className="font-semibold">{user.followersCount || 0}</span>
                    <span className="text-muted-foreground ml-1">Followers</span>
                  </Link>
                  <div>
                    <span className="font-semibold">{user.postsCount || 0}</span>
                    <span className="text-muted-foreground ml-1">Posts</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Feed Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="w-full justify-start mb-4 overflow-x-auto flex-nowrap">
            <TabsTrigger value="following" className="gap-1.5">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Following</span>
            </TabsTrigger>
            <TabsTrigger value="discover" className="gap-1.5">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Discover</span>
            </TabsTrigger>
            <TabsTrigger value="news" className="gap-1.5">
              <Newspaper className="h-4 w-4" />
              <span className="hidden sm:inline">News</span>
            </TabsTrigger>
            <TabsTrigger value="popular" className="gap-1.5">
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">Popular</span>
            </TabsTrigger>
            <TabsTrigger value="science" className="gap-1.5">
              <Gamepad2 className="h-4 w-4" />
              <span className="hidden sm:inline">Science</span>
            </TabsTrigger>
            <TabsTrigger value="art" className="gap-1.5">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Art</span>
            </TabsTrigger>
          </TabsList>
          
          {feedLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <p className="text-muted-foreground">{error}</p>
              <Button onClick={handleRefresh} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </div>
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground mb-4">
                {activeTab === "following" 
                  ? "Your timeline is empty. Follow some people to see their posts!" 
                  : "No posts found in this feed"}
              </p>
              {activeTab === "following" && (
                <Link href="/search">
                  <Button variant="outline">
                    Find People
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard
                  key={post.uri}
                  post={post}
                  isOwnPost={user?.did === post.author.did}
                  onPostUpdated={handleRefresh}
                />
              ))}
            </div>
          )}
        </Tabs>
      </main>
    </div>
  )
}
