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
import { VerifiedBadge } from "@/components/verified-badge"
import { HandleLink } from "@/components/handle-link"
import {Loader2, RefreshCw, PenSquare, Settings, Users, Sparkles, Globe, Heart, Star, Bug} from "lucide-react"
import { VerificationPrompt } from "@/components/verification-checkout"

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
  const { isAuthenticated, isLoading, user, getTimeline, getCustomFeed, getProfile } = useBluesky()
  const [posts, setPosts] = useState<Post[]>([])
  const [feedLoading, setFeedLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("following")
  const [newPostsAvailable, setNewPostsAvailable] = useState(false)
  const [latestPostUri, setLatestPostUri] = useState<string | null>(null)
  const [fullProfile, setFullProfile] = useState<{ banner?: string } | null>(null)

  // Load full profile data with banner
  useEffect(() => {
    if (isAuthenticated && user) {
      getProfile(user.handle).then((profile) => {
        setFullProfile(profile)
      }).catch(() => {
        // Silently fail
      })
    }
  }, [isAuthenticated, user, getProfile])

  const loadTimeline = useCallback(async (isBackgroundRefresh = false) => {
    if (!isAuthenticated) return
    
    if (!isBackgroundRefresh) {
      setFeedLoading(true)
      setError(null)
    }
    
    try {
      const result = await getTimeline()
      
      if (isBackgroundRefresh && result.posts.length > 0 && latestPostUri) {
        // Check if there are new posts
        const firstPostUri = result.posts[0].uri
        if (firstPostUri !== latestPostUri) {
          setNewPostsAvailable(true)
        }
      } else {
        setPosts(result.posts)
        setNewPostsAvailable(false)
        if (result.posts.length > 0) {
          setLatestPostUri(result.posts[0].uri)
        }
      }
    } catch (err) {
      if (!isBackgroundRefresh) {
        setError(err instanceof Error ? err.message : "Failed to load timeline")
      }
    } finally {
      if (!isBackgroundRefresh) {
        setFeedLoading(false)
      }
    }
  }, [isAuthenticated, getTimeline, latestPostUri])

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

  const handleShowNewPosts = useCallback(async () => {
    setNewPostsAvailable(false)
    setFeedLoading(true)
    try {
      const result = await getTimeline()
      setPosts(result.posts)
      if (result.posts.length > 0) {
        setLatestPostUri(result.posts[0].uri)
      }
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load timeline")
    } finally {
      setFeedLoading(false)
    }
  }, [getTimeline])

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab)
    setNewPostsAvailable(false)
    
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
      
      // Background refresh every 30 seconds to check for new posts
      const interval = setInterval(() => {
        if (activeTab === 'following') {
          loadTimeline(true)
        }
      }, 30000)
      
      return () => clearInterval(interval)
    }
  }, [isAuthenticated, isLoading, loadTimeline, activeTab])

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
            <div className="flex items-center gap-2">
              {/* Bluesky butterfly icon */}
              <svg viewBox="0 0 568 501" className="h-6 w-6 text-[#0085ff]" fill="currentColor">
                <path d="M123.121 33.6637C188.241 82.5526 258.281 181.681 284 234.873C309.719 181.681 379.759 82.5526 444.879 33.6637C491.866 -1.61183 568 -28.9064 568 57.9464C568 75.2916 558.055 203.659 552.222 224.501C531.947 296.954 458.067 315.434 392.347 304.249C507.222 323.8 536.444 388.56 473.333 453.32C353.473 576.312 301.061 422.461 287.631 googled383.039C285.169 374.388 284.017 370.036 284 googled373.719C283.983 370.036 282.831 374.388 280.369 googled383.039C266.939 422.461 214.527 576.312 94.6667 453.32C31.5556 388.56 60.7778 323.8 175.653 304.249C109.933 315.434 36.0533 296.954 15.7778 224.501C9.94525 203.659 0 75.2916 0 57.9464C0 -28.9064 76.1345 -1.61183 123.121 33.6637Z"/>
              </svg>
            </div>
            <SignInDialog
              trigger={
                <Button variant="default" size="sm" className="gap-2">
                  <svg viewBox="0 0 568 501" className="h-4 w-4" fill="currentColor">
                    <path d="M123.121 33.6637C188.241 82.5526 258.281 181.681 284 234.873C309.719 181.681 379.759 82.5526 444.879 33.6637C491.866 -1.61183 568 -28.9064 568 57.9464C568 75.2916 558.055 203.659 552.222 224.501C531.947 296.954 458.067 315.434 392.347 304.249C507.222 323.8 536.444 388.56 473.333 453.32C353.473 576.312 301.061 422.461 287.631 383.039C285.169 374.388 284.017 370.036 284 373.719C283.983 370.036 282.831 374.388 280.369 383.039C266.939 422.461 214.527 576.312 94.6667 453.32C31.5556 388.56 60.7778 323.8 175.653 304.249C109.933 315.434 36.0533 296.954 15.7778 224.501C9.94525 203.659 0 75.2916 0 57.9464C0 -28.9064 76.1345 -1.61183 123.121 33.6637Z"/>
                  </svg>
                  Sign in with Bluesky
                </Button>
              }
            />
          </div>
        </header>

        <main className="flex flex-col items-center justify-center px-4 py-16">
          <Card className="w-full max-w-md border-[#0085ff]/20 bg-gradient-to-br from-[#0085ff]/5 to-[#0085ff]/10">
            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-col items-center text-center">
                {/* Bluesky butterfly logo */}
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#0085ff] mb-6">
                  <svg viewBox="0 0 568 501" className="h-10 w-10 text-white" fill="currentColor">
                    <path d="M123.121 33.6637C188.241 82.5526 258.281 181.681 284 234.873C309.719 181.681 379.759 82.5526 444.879 33.6637C491.866 -1.61183 568 -28.9064 568 57.9464C568 75.2916 558.055 203.659 552.222 224.501C531.947 296.954 458.067 315.434 392.347 304.249C507.222 323.8 536.444 388.56 473.333 453.32C353.473 576.312 301.061 422.461 287.631 383.039C285.169 374.388 284.017 370.036 284 373.719C283.983 370.036 282.831 374.388 280.369 383.039C266.939 422.461 214.527 576.312 94.6667 453.32C31.5556 388.56 60.7778 323.8 175.653 304.249C109.933 315.434 36.0533 296.954 15.7778 224.501C9.94525 203.659 0 75.2916 0 57.9464C0 -28.9064 76.1345 -1.61183 123.121 33.6637Z"/>
                  </svg>
                </div>
                <h2 className="text-2xl font-bold mb-3">Welcome to SociallyDead</h2>
                <p className="text-muted-foreground mb-6">
                  A feature-rich Bluesky client with markdown support, multiple feeds, and more. Sign in with your Bluesky account to get started.
                </p>
                <SignInDialog
                  trigger={
                    <Button size="lg" className="w-full gap-2 bg-[#0085ff] hover:bg-[#0085ff]/90">
                      <svg viewBox="0 0 568 501" className="h-5 w-5" fill="currentColor">
                        <path d="M123.121 33.6637C188.241 82.5526 258.281 181.681 284 234.873C309.719 181.681 379.759 82.5526 444.879 33.6637C491.866 -1.61183 568 -28.9064 568 57.9464C568 75.2916 558.055 203.659 552.222 224.501C531.947 296.954 458.067 315.434 392.347 304.249C507.222 323.8 536.444 388.56 473.333 453.32C353.473 576.312 301.061 422.461 287.631 383.039C285.169 374.388 284.017 370.036 284 373.719C283.983 370.036 282.831 374.388 280.369 383.039C266.939 422.461 214.527 576.312 94.6667 453.32C31.5556 388.56 60.7778 323.8 175.653 304.249C109.933 315.434 36.0533 296.954 15.7778 224.501C9.94525 203.659 0 75.2916 0 57.9464C0 -28.9064 76.1345 -1.61183 123.121 33.6637Z"/>
                      </svg>
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
          {/* User avatar and handle */}
          {user && (
            <Link href="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.displayName || user.handle} />
                <AvatarFallback className="text-xs">
                  {(user.displayName || user.handle).slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="font-semibold text-sm hidden sm:inline">@{user.handle}</span>
            </Link>
          )}
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

      <main className="max-w-2xl mx-auto px-0 sm:px-4 py-6">
        {/* User Profile Card */}
        {user && (
          <Card className="mb-6 overflow-hidden">
            {/* Banner */}
            <div className="relative">
              {(fullProfile?.banner || user.banner) ? (
                <div 
                  className="h-24 sm:h-32 w-full bg-cover bg-center" 
                  style={{ backgroundImage: `url(${fullProfile?.banner || user.banner})` }} 
                />
              ) : (
                <div className="h-24 sm:h-32 w-full bg-gradient-to-r from-primary/30 to-primary/10" />
              )}
              {/* Avatar overlapping banner */}
              <div className="absolute -bottom-8 left-4">
                <Avatar className="h-16 w-16 border-4 border-card">
                  <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.displayName || user.handle} />
                  <AvatarFallback className="text-lg">
                    {(user.displayName || user.handle).slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              {/* Edit button on banner */}
              <div className="absolute top-2 right-2">
                <Button variant="secondary" size="sm" asChild className="bg-background/80 hover:bg-background">
                  <Link href="/profile">
                    <Settings className="h-4 w-4 mr-1" />
                  </Link>
                </Button>
	              <Button variant="secondary" size="sm" asChild className="bg-background/80 hover:bg-background">
		              <Link href="/debug">
			              <Bug className="h-4 w-4 mr-1" />
		              </Link>
	              </Button>
              </div>
            </div>
            <CardContent className="pt-10 p-4">
              <div className="flex-1 min-w-0">
                <div>
                  <h2 className="font-bold text-lg truncate inline-flex items-center gap-1.5">
                    {user.displayName || user.handle}
                    <VerifiedBadge handle={user.handle} did={user.did} className="h-5 w-5" />
                  </h2>
                  <HandleLink handle={user.handle} className="text-sm" />
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
                <VerificationPrompt className="mt-2" />
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

        {/* New Posts Indicator */}
        {newPostsAvailable && (
          <div className="sticky top-16 z-20 flex justify-center mb-4">
            <Button 
              onClick={handleShowNewPosts}
              className="rounded-full shadow-lg animate-bounce"
              size="sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              New posts available
            </Button>
          </div>
        )}

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
