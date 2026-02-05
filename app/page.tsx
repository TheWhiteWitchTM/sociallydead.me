"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { useBluesky } from "@/lib/bluesky-context"
import { PostCard } from "@/components/post-card"
import { PublicFeed } from "@/components/public-feed"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, RefreshCw, PenSquare, Settings } from "lucide-react"

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
  const { isAuthenticated, isLoading, user, getTimeline, login } = useBluesky()
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

  useEffect(() => {
    if (isAuthenticated) {
      loadTimeline()
    }
  }, [isAuthenticated, loadTimeline])

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
          <div className="container flex h-14 items-center px-4">
            <h1 className="text-xl font-bold">Welcome to SociallyDead</h1>
          </div>
        </header>
        <main className="container max-w-2xl px-4 py-6">
          {/* Sign In Card */}
          <Card className="mb-6 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardContent className="p-6">
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
          
          <PublicFeed />
        </main>
      </div>
    )
  }

  // Authenticated - show user profile card and timeline
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between px-4">
          <h1 className="text-xl font-bold">Home</h1>
          <Button onClick={loadTimeline} variant="ghost" size="icon" disabled={feedLoading}>
            <RefreshCw className={`h-4 w-4 ${feedLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </header>
      
      <main className="container max-w-2xl px-4 py-6">
        {/* User Profile Card */}
        {user && (
          <Card className="mb-6">
            <CardContent className="p-0">
              {/* Banner */}
              {user.banner ? (
                <div className="h-24 w-full bg-cover bg-center rounded-t-lg" style={{ backgroundImage: `url(${user.banner})` }} />
              ) : (
                <div className="h-24 w-full bg-gradient-to-r from-primary/30 to-primary/10 rounded-t-lg" />
              )}
              
              <div className="px-4 pb-4">
                {/* Avatar */}
                <div className="-mt-10 mb-3">
                  <Link href="/profile">
                    <Avatar className="h-20 w-20 border-4 border-background cursor-pointer hover:opacity-90 transition-opacity">
                      <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.displayName || user.handle} />
                      <AvatarFallback className="text-xl">
                        {(user.displayName || user.handle).slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                </div>
                
                {/* User Info */}
                <div className="flex items-start justify-between">
                  <div>
                    <Link href="/profile" className="hover:underline">
                      <h2 className="text-lg font-bold">{user.displayName || user.handle}</h2>
                    </Link>
                    <p className="text-sm text-muted-foreground">@{user.handle}</p>
                  </div>
                  <div className="flex gap-2">
                    <Link href="/compose">
                      <Button size="sm">
                        <PenSquare className="h-4 w-4 mr-2" />
                        Post
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
                  <p className="mt-2 text-sm">{user.description}</p>
                )}
                
                {/* Stats */}
                <div className="mt-3 flex gap-4 text-sm">
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
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start mb-4">
            <TabsTrigger value="following">Following</TabsTrigger>
            <TabsTrigger value="discover">Discover</TabsTrigger>
          </TabsList>
          
          <TabsContent value="following" className="mt-0">
            {feedLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <p className="text-muted-foreground">{error}</p>
                <Button onClick={loadTimeline} variant="outline">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
              </div>
            ) : posts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-muted-foreground mb-4">Your timeline is empty</p>
                <p className="text-sm text-muted-foreground">Follow some people to see their posts here!</p>
                <Link href="/search">
                  <Button className="mt-4" variant="outline">
                    Find People
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <PostCard
                    key={post.uri}
                    post={post}
                    isOwnPost={user?.did === post.author.did}
                    onPostUpdated={loadTimeline}
                  />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="discover" className="mt-0">
            <PublicFeed />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
