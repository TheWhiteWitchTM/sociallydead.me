"use client"

import { useParams } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { useBluesky } from "@/lib/bluesky-context"
import { PostCard } from "@/components/post-card"
import { PublicPostCard } from "@/components/public-post-card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { VerifiedBadge } from "@/components/verified-badge"
import { HandleLink } from "@/components/handle-link"
import { UserHoverCard } from "@/components/user-hover-card"
import { Loader2, RefreshCw, Rss, ArrowLeft, Heart, Plus, Check } from "lucide-react"

export default function FeedPage() {
  const params = useParams()
  const feedUri = decodeURIComponent(params.feed as string)
  
  const { 
    isAuthenticated, 
    isLoading: authLoading,
    user,
    getFeedGenerator,
    getCustomFeed,
    getSavedFeeds,
    saveFeed,
    unsaveFeed,
  } = useBluesky()

  const [feed, setFeed] = useState<any>(null)
  const [posts, setPosts] = useState<any[]>([])
  const [savedFeeds, setSavedFeeds] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [postsLoading, setPostsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savingFeed, setSavingFeed] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("posts")

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const feedData = await getFeedGenerator(feedUri)
      setFeed(feedData)
      
      if (isAuthenticated) {
        const saved = await getSavedFeeds()
        setSavedFeeds(saved)
      }
      
      await loadPosts()
    } catch (err) {
      console.error("Failed to load feed:", err)
      setError(err instanceof Error ? err.message : "Failed to load feed")
    } finally {
      setIsLoading(false)
    }
  }, [feedUri, getFeedGenerator, isAuthenticated, getSavedFeeds])

  const loadPosts = async () => {
    setPostsLoading(true)
    try {
      const result = await getCustomFeed(feedUri)
      setPosts(result.posts)
    } catch (err) {
      console.error("Failed to load posts:", err)
    } finally {
      setPostsLoading(false)
    }
  }

  const handleSaveFeed = async () => {
    if (!isAuthenticated || !feed) return
    
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
    loadData()
  }, [loadData])

  if (authLoading || (isLoading && !feed)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !feed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 gap-4">
        <p className="text-muted-foreground">{error || "Feed not found"}</p>
        <Link href="/feeds">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Feeds
          </Button>
        </Link>
      </div>
    )
  }

  const isSaved = savedFeeds.some(f => f.uri === feed.uri)

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center gap-4 px-4">
          <Link href="/feeds">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold truncate flex items-center gap-2">
              <Rss className="h-4 w-4 shrink-0" />
              {feed.displayName}
            </h1>
          </div>
          <Button onClick={loadPosts} variant="ghost" size="icon" disabled={postsLoading}>
            <RefreshCw className={`h-4 w-4 ${postsLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto">
        {/* Feed Header Info */}
        <div className="p-4 sm:p-6 border-b border-border">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
              <AvatarImage src={feed.avatar || "/placeholder.svg"} />
              <AvatarFallback>
                <Rss className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold">{feed.displayName}</h2>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                    <span>by</span>
                    <UserHoverCard handle={feed.creator.handle}>
                      <Link href={`/profile/${feed.creator.handle}`} className="font-medium hover:underline flex items-center gap-1">
                        {feed.creator.displayName || feed.creator.handle}
                        <VerifiedBadge handle={feed.creator.handle} did={feed.creator.did} />
                      </Link>
                    </UserHoverCard>
                  </div>
                </div>
                {isAuthenticated && (
                  <Button 
                    variant={isSaved ? "secondary" : "default"}
                    size="sm"
                    onClick={handleSaveFeed}
                    disabled={savingFeed === feed.uri}
                  >
                    {savingFeed === feed.uri ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : isSaved ? (
                      <Check className="h-4 w-4 mr-2" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    {isSaved ? "Saved" : "Save Feed"}
                  </Button>
                )}
              </div>
              
              {feed.description && (
                <p className="text-sm mt-3 whitespace-pre-wrap">{feed.description}</p>
              )}
              
              <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Heart className="h-4 w-4" />
                  <span>{feed.likeCount?.toLocaleString() || 0} likes</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-12 p-0">
            <TabsTrigger 
              value="posts" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 h-full"
            >
              Posts
            </TabsTrigger>
            <TabsTrigger 
              value="people" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 h-full"
            >
              People
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="p-0 m-0">
            {postsLoading && posts.length === 0 ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : posts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-muted-foreground">No posts found in this feed</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {posts.map((post) => (
                  isAuthenticated ? (
                    <PostCard
                      key={post.uri}
                      post={post}
                      isOwnPost={user?.did === post.author.did}
                      onPostUpdated={loadPosts}
                    />
                  ) : (
                    <PublicPostCard key={post.uri} post={post} />
                  )
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="people" className="p-4">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground mb-4">Feed Creator</p>
              <UserCard user={{
                did: feed.creator.did,
                handle: feed.creator.handle,
                displayName: feed.creator.displayName,
                avatar: feed.creator.avatar,
                description: "", // We don't have it here but UserCard should handle it
              }} />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

function UserCard({ user }: { user: any }) {
  const { followUser, unfollowUser, isAuthenticated } = useBluesky()
  const [isFollowing, setIsFollowing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // This is a simplified version of UserCard since we don't have full profile data
  return (
    <Card className="hover:bg-accent/50 transition-colors">
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <UserHoverCard handle={user.handle}>
            <Link href={`/profile/${user.handle}`} className="shrink-0 relative">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.avatar || "/placeholder.svg"} />
                <AvatarFallback>
                  {(user.displayName || user.handle).slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <VerifiedBadge 
                handle={user.handle} 
                did={user.did}
                className="absolute -right-1 -bottom-1 scale-50 origin-bottom-right bg-background rounded-full" 
              />
            </Link>
          </UserHoverCard>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <UserHoverCard handle={user.handle}>
                <Link href={`/profile/${user.handle}`} className="font-semibold truncate hover:underline">
                  {user.displayName || user.handle}
                </Link>
              </UserHoverCard>
              <VerifiedBadge handle={user.handle} did={user.did} />
            </div>
            <HandleLink handle={user.handle} className="text-sm" />
          </div>
          <Link href={`/profile/${user.handle}`}>
            <Button variant="outline" size="sm">
              View Profile
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}