"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { useBluesky } from "@/lib/bluesky-context"
import { PostCard } from "@/components/post-card"
import { SignInDialog } from "@/components/sign-in-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {Card, CardContent, CardTitle} from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { VerifiedBadge } from "@/components/verified-badge"
import { HandleLink } from "@/components/handle-link"
import {Loader2, RefreshCw, PenSquare, Settings, Users, Sparkles, Globe, Heart, Star, Bug, Home} from "lucide-react"
import { VerificationPrompt } from "@/components/verification-checkout"
import { ComposePlaceholder } from "@/components/compose-placeholder"
import { FeatureShowcase } from "@/components/feature-showcase"
import Image from "next/image"
import {PageHeader} from "@/components/page-header";
import {DropdownMenuItem} from "@/components/ui/dropdown-menu";

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

function CoffeeWare() {
	return(
		<div className={"flex flex-row"}>
      Socially<span className={"text-red-600"}>Dead</span> is <b>CoffeeWare</b>!
      {" - "}
      <Link
        className={"underline decoration-red-600 underline-offset-4"}
        href={"https://buymeacoffee.com/thewhitewitchtm"}
        target={"_blank"}
      >
          Please support us with somecoffee☕
				</Link>
		</div>
	)
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
        <PageHeader>
            <Home className="h-5 w-5 text-primary" />
            <span>
            Socially<span className={"text-red-600"}>Dead</span>
            </span>
        </PageHeader>
        <main className="container mx-auto px-4 py-2 sm:py-2">
          {/* Hero Section with Login */}
          <div className="text-center mb-1 max-w-4xl mx-auto">
            <p className={"py-2"}>
              <CoffeeWare/>
            </p>
            <div className="flex justify-center mb-1">
              <Image
                src={"/banner.jpg"}
                alt={"SD Banner"}
                width={500}
                height={50}
                priority
              />
            </div>
            <p className="text-lg text-muted-foreground mb-4">
              An <span className="text-primary font-semibold">alternative Bluesky client</span> with powerful features
            </p>
            <p className="text-sm text-muted-foreground mb-1">
              Uses your existing Bluesky account • All your posts, followers, and data stay on Bluesky
            </p>

            {/* Login Card */}
            <Card className="w-full mx-auto border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 shadow-xl mb-1">
              <CardContent className={"className={\"flex gap-2 justify-center flex-wrap"}>
                <SignInDialog
                  trigger={
                    <Button
                      variant={"default"}
                      size="lg"
                    >
                      Sign in with {" "}
                      <svg viewBox="0 0 568 501" className="h-3.5 w-3.5 text-[#0085ff]" fill="currentColor">
                        <path d="M123.121 33.6637C188.241 82.5526 258.281 181.681 284 234.873C309.719 181.681 379.759 82.5526 444.879 33.6637C491.866 -1.61183 568 -28.9064 568 57.9464C568 75.2916 558.055 203.659 552.222 224.501C531.947 296.954 458.067 315.434 392.347 304.249C507.222 323.8 536.444 388.56 473.333 453.32C353.473 576.312 301.061 422.461 287.631 383.039C285.169 374.388 284.017 370.036 284 373.719C283.983 370.036 282.831 374.388 280.369 383.039C266.939 422.461 214.527 576.312 94.6667 453.32C31.5556 388.56 60.7778 323.8 175.653 304.249C109.933 315.434 36.0533 296.954 15.7778 224.501C9.94525 203.659 0 75.2916 0 57.9464C0 -28.9064 76.1345 -1.61183 123.121 33.6637Z"/>
                      </svg>
                      BlueSky
                    </Button>
                  }
                />
                <Button
                  variant={"secondary"}
                  size="lg"
                  asChild
                >
                    <Link
                      href={"https://bsky.app/"}
                      target={"_blank"}
                    >
                    Not on {" "}
                    <svg viewBox="0 0 568 501" className="h-3.5 w-3.5 text-[#0085ff]" fill="currentColor">
                      <path d="M123.121 33.6637C188.241 82.5526 258.281 181.681 284 234.873C309.719 181.681 379.759 82.5526 444.879 33.6637C491.866 -1.61183 568 -28.9064 568 57.9464C568 75.2916 558.055 203.659 552.222 224.501C531.947 296.954 458.067 315.434 392.347 304.249C507.222 323.8 536.444 388.56 473.333 453.32C353.473 576.312 301.061 422.461 287.631 383.039C285.169 374.388 284.017 370.036 284 373.719C283.983 370.036 282.831 374.388 280.369 383.039C266.939 422.461 214.527 576.312 94.6667 453.32C31.5556 388.56 60.7778 323.8 175.653 304.249C109.933 315.434 36.0533 296.954 15.7778 224.501C9.94525 203.659 0 75.2916 0 57.9464C0 -28.9064 76.1345 -1.61183 123.121 33.6637Z"/>
                    </svg>
                    BlueSky?
                    </Link>
                  </Button>
              </CardContent>
            </Card>

            {/* Browse without login */}
            <div>
              <p className="text-sm text-muted-foreground mb-3">Or browse without signing in:</p>
              <div className="flex gap-2 justify-center flex-wrap">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/discover">Discover</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/search">Search</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/feeds">Browse Feeds</Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Feature Showcase */}
          <FeatureShowcase />
          <p>
            <CoffeeWare/>
          </p>
        </main>
      </div>
    )
  }

  // Signed in - show profile and timeline
  try {
    const jsx = (
      <div className="min-h-screen">
        <PageHeader>
          <Home/>
          {user?.displayName}
        </PageHeader>
        <main className="max-w-2xl mx-auto px-0 sm:px-4 py-6">
          <CoffeeWare/>
          {/* Feed Tabs - Horizontal Scrolling (Bluesky Style) */}
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <div className="overflow-x-auto scroll-smooth-x -mx-4 px-4 mb-4">
              <TabsList
                className="inline-flex w-max min-w-full h-11 bg-transparent border-b rounded-none justify-start">
                <TabsTrigger value="following"
                             className="gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4">
                  <Users className="h-4 w-4"/>
                  <span>Following</span>
                </TabsTrigger>
                <TabsTrigger value="all"
                             className="gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4">
                  <Sparkles className="h-4 w-4"/>
                  <span>All</span>
                </TabsTrigger>
                <TabsTrigger value="popular"
                             className="gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4">
                  <Globe className="h-4 w-4"/>
                  <span>Popular</span>
                </TabsTrigger>
                <TabsTrigger value="with_friends"
                             className="gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4">
                  <Users className="h-4 w-4"/>
                  <span>With Friends</span>
                </TabsTrigger>
                <TabsTrigger value="mutuals"
                             className="gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4">
                  <Heart className="h-4 w-4"/>
                  <span>Mutuals</span>
                </TabsTrigger>
                <TabsTrigger value="best_of_follows"
                             className="gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4">
                  <Star className="h-4 w-4"/>
                  <span>Best of Follows</span>
                </TabsTrigger>
              </TabsList>
            </div>
          </Tabs>

          {/* Compose Placeholder */}
          <ComposePlaceholder
            placeholder="What's happening?"
            onSuccess={() => handleTabChange(activeTab)}
          />

          {/* New Posts Indicator - Fixed at top below header */}
          {newPostsAvailable && (
            <div className="fixed top-14 left-0 right-0 z-30 flex justify-center pt-2 pointer-events-none">
              <Button
                onClick={handleShowNewPosts}
                className="rounded-full shadow-lg animate-bounce pointer-events-auto"
                size="sm"
              >
                <RefreshCw className="h-4 w-4 mr-2"/>
                New posts available
              </Button>
            </div>
          )}

          {/* Feed Content */}
          {feedLoading && posts.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground"/>
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
    return jsx
  } catch {
    console.err("JSX Error!")
    return (<></>)
  }
}
