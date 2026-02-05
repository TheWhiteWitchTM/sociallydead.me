"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { useBluesky } from "@/lib/bluesky-context"
import { PostCard } from "@/components/post-card"
import { SignInDialog } from "@/components/sign-in-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, RefreshCw, PenSquare, Settings, Users, Sparkles, Globe, Heart, Star } from "lucide-react"

// Official Bluesky feed URIs
const BLUESKY_DID = "did:plc:z72i7hdynmk6r22z27h6tvur"
const KNOWN_FEEDS = {
  popular: `at://${BLUESKY_DID}/app.bsky.feed.generator/hot-classic`,
  whats_hot: `at://${BLUESKY_DID}/app.bsky.feed.generator/whats-hot`,
  with_friends: `at://${BLUESKY_DID}/app.bsky.feed.generator/with-friends`,
  mutuals: `at://${BLUESKY_DID}/app.bsky.feed.generator/mutuals`,
  best_of_follows: `at://${BLUESKY_DID}/app.bsky.feed.generator/best-of-follows`,
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
  const { isAuthenticated, isLoading, user, getTimeline, getCustomFeed } = useBluesky()
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

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab)
    
    switch (tab) {
      case "following":
        loadTimeline()
        break
      case "all":
        loadFeed(KNOWN_FEEDS.whats_hot)
        break
      case "popular":
        loadFeed(KNOWN_FEEDS.popular)
        break
      case "with_friends":
        loadFeed(KNOWN_FEEDS.with_friends)
        break
      case "mutuals":
        loadFeed(KNOWN_FEEDS.mutuals)
        break
      case "best_of_follows":
        loadFeed(KNOWN_FEEDS.best_of_follows)
        break
      default:
        loadTimeline()
    }
  }, [loadTimeline, loadFeed])

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      loadTimeline()
    }
  }, [isAuthenticated, isLoading, loadTimeline])

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Not signed in - show sign in prompt
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen">
        <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-14 items-center justify-between px-4">
            <h1 className="text-xl font-bold">SociallyDead</h1>
            <SignInDialog
              trigger={
                <Button variant="default" size="sm">
                  Sign In
                </Button>
              }
            />
          </div>
        </header>

        <main className="flex flex-col items-center justify-center px-4 py-16">
          <Card className="w-full max-w-md border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary mb-6">
                  <span className="text-3xl font-bold text-primary-foreground">SD</span>
                </div>
                <h2 className="text-2xl font-bold mb-3">Welcome to SociallyDead</h2>
                <p className="text-muted-foreground mb-6">
                  A feature-rich Bluesky client with markdown support, multiple feeds, and more. Sign in with your Bluesky account to get started.
                </p>
                <SignInDialog
                  trigger={
                    <Button size="lg" className="w-full">
                      Sign in with Bluesky
                    </Button>
                  }
                />
                <p className="mt-4 text-xs text-muted-foreground">
                  Uses secure OAuth - we never see your password
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="mt-8 text-center">
            <p className="text-muted-foreground mb-4">Want to browse without signing in?</p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Button variant="outline" asChild>
                <Link href="/discover">Discover Feed</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/search">Search</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/feeds">Browse Feeds</Link>
              </Button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Signed in - show profile and timeline
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center justify-between px-4">
          <h1 className="text-xl font-bold">Home</h1>
          <div className="flex items-center gap-2">
            <Button onClick={() => handleTabChange(activeTab)} variant="ghost" size="icon" disabled={feedLoading}>
              <RefreshCw className={`h-4 w-4 ${feedLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button asChild variant="default" size="sm">
              <Link href="/compose">
                <PenSquare className="h-4 w-4 mr-2" />
                Post
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-2 sm:px-4 py-6">
        {/* User Profile Card */}
        {user && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.displayName || user.handle} />
                  <AvatarFallback className="text-lg">
                    {(user.displayName || user.handle).slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="font-bold text-lg truncate">{user.displayName || user.handle}</h2>
                      <p className="text-muted-foreground text-sm">@{user.handle}</p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/profile">
                        <Settings className="h-4 w-4 mr-1" />
                        Edit
                      </Link>
                    </Button>
                  </div>
                  {user.description && (
                    <p className="mt-2 text-sm line-clamp-2">{user.description}</p>
                  )}
                  <div className="flex gap-4 mt-3 text-sm">
                    <Link href="/profile?tab=followers" className="hover:underline">
                      <strong>{user.followersCount ?? 0}</strong> followers
                    </Link>
                    <Link href="/profile?tab=following" className="hover:underline">
                      <strong>{user.followsCount ?? 0}</strong> following
                    </Link>
                    <Link href="/profile" className="hover:underline">
                      <strong>{user.postsCount ?? 0}</strong> posts
                    </Link>
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
            <TabsTrigger value="all" className="gap-1.5">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">All</span>
            </TabsTrigger>
            <TabsTrigger value="popular" className="gap-1.5">
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">Popular</span>
            </TabsTrigger>
            <TabsTrigger value="with_friends" className="gap-1.5">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">With Friends</span>
            </TabsTrigger>
            <TabsTrigger value="mutuals" className="gap-1.5">
              <Heart className="h-4 w-4" />
              <span className="hidden sm:inline">Mutuals</span>
            </TabsTrigger>
            <TabsTrigger value="best_of_follows" className="gap-1.5">
              <Star className="h-4 w-4" />
              <span className="hidden sm:inline">Best of Follows</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Feed Content */}
        {feedLoading && posts.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={() => handleTabChange(activeTab)}>Try Again</Button>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No posts to show</p>
            <Button asChild>
              <Link href="/compose">Create your first post</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard 
                key={post.uri} 
                post={post} 
                isOwnPost={user?.did === post.author.did}
                onPostUpdated={() => handleTabChange(activeTab)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
