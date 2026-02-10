"use client"

import { useState, useCallback, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { useBluesky } from "@/lib/bluesky-context"
import { PostCard } from "@/components/post-card"
import { PublicPostCard } from "@/components/public-post-card"
import { VerifiedBadge } from "@/components/verified-badge"
import { HandleLink } from "@/components/handle-link"
import { UserHoverCard } from "@/components/user-hover-card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, ArrowLeft, ExternalLink, Calendar, MoreHorizontal, UserPlus, UserMinus, Ban, BellOff, MessageCircle, Pin, Star, FileText, Image, X, Plus, Rss, ListIcon, Package, Heart } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface UserProfile {
  did: string
  handle: string
  displayName?: string
  avatar?: string
  banner?: string
  description?: string
  followersCount?: number
  followsCount?: number
  postsCount?: number
  pinnedPost?: {
    uri: string
    cid: string
  }
  viewer?: {
    muted?: boolean
    blockedBy?: boolean
    blocking?: string
    following?: string
    followedBy?: string
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

export default function UserProfilePage() {
  const params = useParams()
  const handle = params.handle as string
  
  const { 
    user, 
    isAuthenticated, 
    isLoading: authLoading,
    getProfile,
    getPost,
    getUserPosts,
    getUserReplies,
    getUserMedia,
    followUser,
    unfollowUser,
    blockUser,
    unblockUser,
    muteUser,
    unmuteUser,
    startConversation,
    getFollowers,
    getFollowing,
    getHighlights,
    removeHighlight,
    getArticles,
    getActorFeeds,
    getLists,
    getStarterPacks,
  } = useBluesky()
  
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [pinnedPostData, setPinnedPostData] = useState<Post | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [postsLoading, setPostsLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("posts")
  const [error, setError] = useState<string | null>(null)
  
  // Followers/Following modal state
  const [showFollowersModal, setShowFollowersModal] = useState(false)
  const [showFollowingModal, setShowFollowingModal] = useState(false)
  const [followers, setFollowers] = useState<UserProfile[]>([])
  const [following, setFollowing] = useState<UserProfile[]>([])
  const [listLoading, setListLoading] = useState(false)
  
  // Highlights and Articles (SociallyDead exclusive)
  const [highlights, setHighlights] = useState<Array<{ uri: string; postUri: string; postCid: string; createdAt: string }>>([])
  const [highlightPosts, setHighlightPosts] = useState<Post[]>([])
  const [articles, setArticles] = useState<Array<{ uri: string; rkey: string; title: string; content: string; createdAt: string }>>([])
  const [highlightLoading, setHighlightLoading] = useState(false)
  
  // Feeds, Lists, Starter Packs state
  const [feeds, setFeeds] = useState<Array<{ uri: string; displayName: string; description?: string; avatar?: string; likeCount?: number; creator: { handle: string; displayName?: string } }>>([])
  const [lists, setLists] = useState<Array<{ uri: string; name: string; purpose: string; description?: string; avatar?: string; listItemCount?: number }>>([])
  const [starterPacks, setStarterPacks] = useState<Array<{ uri: string; cid: string; record: { name: string; description?: string; createdAt: string } }>>([])
  const [feedsLoading, setFeedsLoading] = useState(false)
  const [listsLoading, setListsLoading] = useState(false)
  const [starterPacksLoading, setStarterPacksLoading] = useState(false)

  const isOwnProfile = user?.handle === handle || user?.did === handle

const loadProfile = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Handle can be either a handle or a DID - getProfile handles both
      const profileData = await getProfile(handle)
      if (!profileData) {
        setError("Profile not found")
        setIsLoading(false)
        return
      }
      setProfile(profileData as UserProfile)
      
      // Fetch pinned post if exists
      if (profileData.pinnedPost?.uri) {
        try {
          const pinnedPost = await getPost(profileData.pinnedPost.uri)
          setPinnedPostData(pinnedPost as Post | null)
        } catch {
          // Pinned post might be deleted
          setPinnedPostData(null)
        }
      } else {
        setPinnedPostData(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile")
    } finally {
      setIsLoading(false)
    }
  }, [handle, getProfile, getPost])

  const loadHighlightsAndArticles = useCallback(async () => {
    if (!profile) return
    setHighlightLoading(true)
    
    try {
      // Load highlights
      const highlightData = await getHighlights(profile.did)
      setHighlights(highlightData)
      
      // Load the actual posts for highlights
      const highlightPostPromises = highlightData.map(h => getPost(h.postUri))
      const posts = await Promise.all(highlightPostPromises)
      setHighlightPosts(posts.filter((p): p is Post => p !== null))
      
      // Load articles
      const articleData = await getArticles(profile.did)
      setArticles(articleData)
    } catch (error) {
      console.error("Failed to load highlights/articles:", error)
    } finally {
      setHighlightLoading(false)
    }
  }, [profile, getHighlights, getArticles, getPost])

  // Load highlights and articles when profile loads
  useEffect(() => {
    if (profile) {
      loadHighlightsAndArticles()
    }
  }, [profile, loadHighlightsAndArticles])

  const loadFeeds = useCallback(async () => {
    if (!profile) return
    setFeedsLoading(true)
    try {
      const data = await getActorFeeds(profile.did)
      setFeeds(data as typeof feeds)
    } catch (error) {
      console.error("Failed to load feeds:", error)
    } finally {
      setFeedsLoading(false)
    }
  }, [profile, getActorFeeds])

  const loadLists = useCallback(async () => {
    if (!profile) return
    setListsLoading(true)
    try {
      const data = await getLists(profile.did)
      setLists(data as typeof lists)
    } catch (error) {
      console.error("Failed to load lists:", error)
    } finally {
      setListsLoading(false)
    }
  }, [profile, getLists])

  const loadStarterPacks = useCallback(async () => {
    if (!profile) return
    setStarterPacksLoading(true)
    try {
      const data = await getStarterPacks(profile.did)
      setStarterPacks(data as typeof starterPacks)
    } catch (error) {
      console.error("Failed to load starter packs:", error)
    } finally {
      setStarterPacksLoading(false)
    }
  }, [profile, getStarterPacks])

  // Auto-load feeds, lists, and starter packs so tabs only show when content exists
  useEffect(() => {
    if (profile) {
      loadFeeds()
      loadLists()
      loadStarterPacks()
    }
  }, [profile, loadFeeds, loadLists, loadStarterPacks])

  const loadPosts = useCallback(async (type: string) => {
    if (!profile) return
    setPostsLoading(true)
    
    try {
      let fetchedPosts: Post[]
      
      switch (type) {
        case "posts":
          fetchedPosts = await getUserPosts(profile.did)
          break
        case "replies":
          fetchedPosts = await getUserReplies(profile.did)
          break
        case "media":
          fetchedPosts = await getUserMedia(profile.did)
          break
        default:
          fetchedPosts = await getUserPosts(profile.did)
      }
      
      setPosts(fetchedPosts)
    } catch (err) {
      console.error("Failed to load posts:", err)
    } finally {
      setPostsLoading(false)
    }
  }, [profile, getUserPosts, getUserReplies, getUserMedia])

  const loadFollowers = useCallback(async () => {
    if (!profile) return
    setListLoading(true)
    try {
      const result = await getFollowers(profile.handle)
      setFollowers(result.followers as UserProfile[])
    } catch (error) {
      console.error("Failed to load followers:", error)
    } finally {
      setListLoading(false)
    }
  }, [profile, getFollowers])

  const loadFollowing = useCallback(async () => {
    if (!profile) return
    setListLoading(true)
    try {
      const result = await getFollowing(profile.handle)
      setFollowing(result.following as UserProfile[])
    } catch (error) {
      console.error("Failed to load following:", error)
    } finally {
      setListLoading(false)
    }
  }, [profile, getFollowing])

const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    if (tab === "posts" || tab === "replies" || tab === "media") {
      loadPosts(tab)
    } else if (tab === "feeds") {
      loadFeeds()
    } else if (tab === "lists") {
      loadLists()
    } else if (tab === "starterpacks") {
      loadStarterPacks()
    }
  }

  const handleFollow = async () => {
    if (!profile || !isAuthenticated) return
    setActionLoading(true)
    
    try {
      if (profile.viewer?.following) {
        await unfollowUser(profile.viewer.following)
        setProfile(prev => prev ? {
          ...prev,
          followersCount: (prev.followersCount || 0) - 1,
          viewer: { ...prev.viewer, following: undefined }
        } : null)
      } else {
        const followUri = await followUser(profile.did)
        setProfile(prev => prev ? {
          ...prev,
          followersCount: (prev.followersCount || 0) + 1,
          viewer: { ...prev.viewer, following: followUri }
        } : null)
      }
    } catch (error) {
      console.error("Follow action failed:", error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleBlock = async () => {
    if (!profile || !isAuthenticated) return
    setActionLoading(true)
    
    try {
      if (profile.viewer?.blocking) {
        await unblockUser(profile.viewer.blocking)
        setProfile(prev => prev ? {
          ...prev,
          viewer: { ...prev.viewer, blocking: undefined }
        } : null)
      } else {
        const blockUri = await blockUser(profile.did)
        setProfile(prev => prev ? {
          ...prev,
          viewer: { ...prev.viewer, blocking: blockUri, following: undefined }
        } : null)
      }
    } catch (error) {
      console.error("Block action failed:", error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleMute = async () => {
    if (!profile || !isAuthenticated) return
    setActionLoading(true)
    
    try {
      if (profile.viewer?.muted) {
        await unmuteUser(profile.did)
        setProfile(prev => prev ? {
          ...prev,
          viewer: { ...prev.viewer, muted: false }
        } : null)
      } else {
        await muteUser(profile.did)
        setProfile(prev => prev ? {
          ...prev,
          viewer: { ...prev.viewer, muted: true }
        } : null)
      }
    } catch (error) {
      console.error("Mute action failed:", error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleMessage = async () => {
    if (!profile || !isAuthenticated) return
    try {
      await startConversation(profile.did)
      window.location.href = "/messages"
    } catch (error) {
      console.error("Failed to start conversation:", error)
    }
  }

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  useEffect(() => {
    if (profile && activeTab !== "followers" && activeTab !== "following") {
      loadPosts(activeTab)
    }
  }, [profile, activeTab, loadPosts])

  // Redirect to own profile page if viewing own profile (only client-side)
  useEffect(() => {
    if (isOwnProfile && !authLoading) {
      window.location.href = "/profile"
    }
  }, [isOwnProfile, authLoading])

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (isOwnProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen">
        <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-14 items-center gap-4 px-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-lg font-bold">Profile</h1>
          </div>
        </header>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground">{error || "Profile not found"}</p>
          <Link href="/" className="mt-4">
            <Button variant="outline">Go Home</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center gap-4 px-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold truncate inline-flex items-center gap-1">
                {profile.displayName || profile.handle}
                <VerifiedBadge handle={profile.handle} did={profile.did} className="ml-0.5" />
              </h1>
              <p className="text-xs text-muted-foreground">{profile.postsCount || 0} posts</p>
            </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl">
        {/* Profile Header */}
        <div className="relative">
          {/* Banner */}
          {profile.banner ? (
            <div 
              className="h-32 sm:h-48 w-full bg-cover bg-center" 
              style={{ backgroundImage: `url(${profile.banner})` }} 
            />
          ) : (
            <div className="h-32 sm:h-48 w-full bg-gradient-to-r from-primary/30 to-primary/10" />
          )}
          
          {/* Avatar */}
          <div className="absolute -bottom-16 left-4">
            <div className="relative">
              <Avatar className="h-24 w-24 sm:h-32 sm:w-32 border-4 border-background">
                <AvatarImage src={profile.avatar || "/placeholder.svg"} alt={profile.displayName || profile.handle} />
                <AvatarFallback className="text-2xl sm:text-3xl">
                  {(profile.displayName || profile.handle).slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <VerifiedBadge 
                handle={profile.handle} 
                did={profile.did}
                className="absolute right-0 bottom-0 scale-125 origin-bottom-right bg-background rounded-full border-2 border-background" 
              />
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="absolute right-4 bottom-4 flex gap-2">
            {isAuthenticated && (
              <>
                <Button 
                  variant={profile.viewer?.following ? "secondary" : "default"}
                  size="sm"
                  onClick={handleFollow}
                  disabled={actionLoading || !!profile.viewer?.blocking}
                >
                  {actionLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : profile.viewer?.following ? (
                    <>
                      <UserMinus className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Following</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Follow</span>
                    </>
                  )}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="h-9 w-9">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleMessage}>
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Message
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleMute}>
                      <BellOff className="mr-2 h-4 w-4" />
                      {profile.viewer?.muted ? "Unmute" : "Mute"}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={handleBlock}
                      className={profile.viewer?.blocking ? "" : "text-destructive"}
                    >
                      <Ban className="mr-2 h-4 w-4" />
                      {profile.viewer?.blocking ? "Unblock" : "Block"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </div>
        
        {/* Profile Info */}
        <div className="px-4 pt-18 pb-3">
          <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold inline-flex items-center gap-1.5">
                  {profile.displayName || profile.handle}
                  <VerifiedBadge handle={profile.handle} did={profile.did} className="h-5 w-5 ml-0.5" />
                </h2>
                <HandleLink handle={profile.handle} />
              </div>
          </div>
          
          {/* Relationship badges */}
          {(profile.viewer?.followedBy || profile.viewer?.blocking || profile.viewer?.muted) && (
            <div className="flex flex-wrap gap-2 mt-2">
              {profile.viewer?.followedBy && (
                <span className="text-xs bg-muted px-2 py-1 rounded">Follows you</span>
              )}
              {profile.viewer?.blocking && (
                <span className="text-xs bg-destructive/10 text-destructive px-2 py-1 rounded">Blocked</span>
              )}
              {profile.viewer?.muted && (
                <span className="text-xs bg-muted px-2 py-1 rounded">Muted</span>
              )}
            </div>
          )}
          
          {profile.description && (
            <p className="mt-3 whitespace-pre-wrap">{profile.description}</p>
          )}
          
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-sm text-muted-foreground">
            <a 
              href={`https://bsky.app/profile/${profile.handle}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              <span>View on Bluesky</span>
            </a>
          </div>
          
{/* Stats */}
          <div className="flex gap-4 mt-3 text-sm">
            <button
              onClick={() => {
                setShowFollowingModal(true)
                loadFollowing()
              }}
              className="hover:underline"
            >
              <span className="font-semibold">{profile.followsCount || 0}</span>
              <span className="text-muted-foreground ml-1">Following</span>
            </button>
            <button
              onClick={() => {
                setShowFollowersModal(true)
                loadFollowers()
              }}
              className="hover:underline"
            >
              <span className="font-semibold">{profile.followersCount || 0}</span>
              <span className="text-muted-foreground ml-1">Followers</span>
            </button>
          </div>
        </div>

        {/* Profile Tabs - X/Twitter Style */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="px-2 sm:px-4">
          <div className="overflow-x-auto -mx-2 sm:-mx-4 px-2 sm:px-4" style={{ WebkitOverflowScrolling: 'touch' }}>
            <TabsList className="inline-flex w-max gap-0">
              <TabsTrigger value="posts" className="flex-none text-xs sm:text-sm px-2.5 sm:px-3">Posts</TabsTrigger>
              <TabsTrigger value="replies" className="flex-none text-xs sm:text-sm px-2.5 sm:px-3">Replies</TabsTrigger>
              {highlightPosts.length > 0 && (
                <TabsTrigger value="highlights" className="flex-none flex items-center gap-1 text-xs sm:text-sm px-2.5 sm:px-3">
                  <Star className="h-3 w-3 shrink-0" />
                  Highlights
                </TabsTrigger>
              )}
              {articles.length > 0 && (
                <TabsTrigger value="articles" className="flex-none flex items-center gap-1 text-xs sm:text-sm px-2.5 sm:px-3">
                  <FileText className="h-3 w-3 shrink-0" />
                  Articles
                </TabsTrigger>
              )}
              <TabsTrigger value="media" className="flex-none flex items-center gap-1 text-xs sm:text-sm px-2.5 sm:px-3">
                <Image className="h-3 w-3 shrink-0" />
                Media
              </TabsTrigger>
              {feeds.length > 0 && (
                <TabsTrigger value="feeds" className="flex-none flex items-center gap-1 text-xs sm:text-sm px-2.5 sm:px-3">
                  <Rss className="h-3 w-3 shrink-0" />
                  Feeds
                </TabsTrigger>
              )}
              {lists.length > 0 && (
                <TabsTrigger value="lists" className="flex-none flex items-center gap-1 text-xs sm:text-sm px-2.5 sm:px-3">
                  <ListIcon className="h-3 w-3 shrink-0" />
                  Lists
                </TabsTrigger>
              )}
              {starterPacks.length > 0 && (
                <TabsTrigger value="starterpacks" className="flex-none flex items-center gap-1 text-xs sm:text-sm px-2.5 sm:px-3">
                  <Package className="h-3 w-3 shrink-0" />
                  Packs
                </TabsTrigger>
              )}
            </TabsList>
          </div>
          
          <TabsContent value="posts" className="mt-4">
            {/* Pinned Post */}
            {pinnedPostData && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2 px-2 text-sm text-muted-foreground">
                  <Pin className="h-4 w-4" />
                  <span>Pinned</span>
                </div>
                {isAuthenticated ? (
                  <PostCard 
                    post={pinnedPostData} 
                    isOwnPost={isOwnProfile}
                    isPinned={true}
                    onPostUpdated={loadProfile}
                  />
                ) : (
                  <PublicPostCard post={pinnedPostData} />
                )}
              </div>
            )}
            <PostsList 
              posts={posts.filter(p => p.uri !== pinnedPostData?.uri)} 
              loading={postsLoading} 
              isAuthenticated={isAuthenticated} 
              userId={user?.did}
              pinnedPostUri={pinnedPostData?.uri}
              isOwnProfile={isOwnProfile}
              onPostUpdated={loadProfile}
            />
          </TabsContent>
      
          <TabsContent value="replies" className="mt-4">
            <PostsList posts={posts} loading={postsLoading} isAuthenticated={isAuthenticated} userId={user?.did} isOwnProfile={isOwnProfile} onPostUpdated={loadProfile} />
          </TabsContent>
          
          <TabsContent value="highlights" className="mt-4">
            {highlightLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : highlightPosts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Star className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No highlights yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {highlightPosts.map((post, index) => (
                  <div key={post.uri} className="relative">
                    {isAuthenticated ? (
                      <PostCard post={post} isOwnPost={false} />
                    ) : (
                      <PublicPostCard post={post} />
                    )}
                    {isOwnProfile && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6 bg-background/80 hover:bg-destructive hover:text-destructive-foreground"
                        onClick={async () => {
                          try {
                            await removeHighlight(highlights[index].uri)
                            loadHighlightsAndArticles()
                          } catch (err) {
                            console.error("Failed to remove highlight:", err)
                          }
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="articles" className="mt-4">
            {highlightLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : articles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No articles yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {articles.map((article) => (
                  <Link key={article.uri} href={`/articles/${article.rkey}`}>
                    <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                      <CardContent className="p-4">
                        <h4 className="font-semibold line-clamp-1">{article.title}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {article.content.slice(0, 150)}...
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {formatDistanceToNow(new Date(article.createdAt), { addSuffix: true })}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>
              
          <TabsContent value="media" className="mt-4">
            {postsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <MediaGrid posts={posts} />
            )}
          </TabsContent>

          {/* Feeds Tab */}
          <TabsContent value="feeds" className="mt-4">
            {feedsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : feeds.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Rss className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No custom feeds</p>
              </div>
            ) : (
              <div className="space-y-2">
                {feeds.map((feed) => (
                  <Link key={feed.uri} href={`/feeds/${encodeURIComponent(feed.uri)}`}>
                    <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                      <CardContent className="p-3 flex items-center gap-3">
                        {feed.avatar ? (
                          <img src={feed.avatar} alt="" className="h-10 w-10 rounded-lg object-cover" />
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Rss className="h-5 w-5 text-primary" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">{feed.displayName}</p>
                          <p className="text-sm text-muted-foreground truncate">by {feed.creator.displayName || feed.creator.handle}</p>
                          {feed.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{feed.description}</p>
                          )}
                        </div>
                        {feed.likeCount !== undefined && feed.likeCount > 0 && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                            <Heart className="h-3 w-3" />
                            {feed.likeCount.toLocaleString()}
                          </span>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Lists Tab */}
          <TabsContent value="lists" className="mt-4">
            {listsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : lists.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ListIcon className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No lists</p>
              </div>
            ) : (
              <div className="space-y-2">
                {lists.map((list) => (
                  <Link key={list.uri} href={`/lists/${encodeURIComponent(list.uri)}`}>
                    <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                      <CardContent className="p-3 flex items-center gap-3">
                        {list.avatar ? (
                          <img src={list.avatar} alt="" className="h-10 w-10 rounded-lg object-cover" />
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <ListIcon className="h-5 w-5 text-primary" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">{list.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {list.purpose === "app.bsky.graph.defs#modlist" ? "Moderation list" : "Curation list"}
                            {list.listItemCount !== undefined && ` · ${list.listItemCount} members`}
                          </p>
                          {list.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{list.description}</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Starter Packs Tab */}
          <TabsContent value="starterpacks" className="mt-4">
            {starterPacksLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : starterPacks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Package className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No starter packs</p>
              </div>
            ) : (
              <div className="space-y-2">
                {starterPacks.map((sp) => (
                  <Card key={sp.uri} className="hover:bg-accent/50 transition-colors">
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Package className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{sp.record.name}</p>
                        {sp.record.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">{sp.record.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatDistanceToNow(new Date(sp.record.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Followers Modal */}
      <Dialog open={showFollowersModal} onOpenChange={setShowFollowersModal}>
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Followers</DialogTitle>
          </DialogHeader>
          {listLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : followers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground">No followers yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {followers.map((follower) => (
                <UserCard key={follower.did} user={follower} onNavigate={() => setShowFollowersModal(false)} />
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Following Modal */}
      <Dialog open={showFollowingModal} onOpenChange={setShowFollowingModal}>
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Following</DialogTitle>
          </DialogHeader>
          {listLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : following.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground">Not following anyone yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {following.map((followed) => (
                <UserCard key={followed.did} user={followed} onNavigate={() => setShowFollowingModal(false)} />
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function PostsList({ 
  posts, 
  loading, 
  isAuthenticated, 
  userId,
  pinnedPostUri,
  isOwnProfile,
  onPostUpdated,
}: { 
  posts: Post[]
  loading: boolean
  isAuthenticated: boolean
  userId?: string
  pinnedPostUri?: string
  isOwnProfile?: boolean
  onPostUpdated?: () => void
}) {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">No posts yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        isAuthenticated ? (
          <PostCard
            key={post.uri}
            post={post}
            isOwnPost={userId === post.author.did}
            isPinned={post.uri === pinnedPostUri}
            onPostUpdated={isOwnProfile ? onPostUpdated : undefined}
          />
        ) : (
          <PublicPostCard key={post.uri} post={post as any} />
        )
      ))}
    </div>
  )
}

function UserCard({ user, onNavigate, showUnfollow }: { user: UserProfile; onNavigate?: () => void; showUnfollow?: boolean }) {
  const { unfollowUser, followUser, isAuthenticated } = useBluesky()
  const [followUri, setFollowUri] = useState(user.viewer?.following)
  const [isLoading, setIsLoading] = useState(false)

  const handleToggleFollow = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsLoading(true)
    try {
      if (followUri) {
        await unfollowUser(followUri)
        setFollowUri(undefined)
      } else {
        const uri = await followUser(user.did)
        setFollowUri(uri)
      }
    } catch (error) {
      console.error("Failed to toggle follow:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="hover:bg-accent/50 transition-colors">
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <UserHoverCard handle={user.handle}>
            <Link href={`/profile/${user.handle}`} onClick={onNavigate} className="shrink-0">
              <Avatar className="h-10 w-10 cursor-pointer hover:opacity-80 transition-opacity">
                <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.displayName || user.handle} />
                <AvatarFallback>
                  {(user.displayName || user.handle).slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Link>
          </UserHoverCard>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <UserHoverCard handle={user.handle}>
                <Link href={`/profile/${user.handle}`} onClick={onNavigate} className="font-semibold truncate hover:underline">
                  {user.displayName || user.handle}
                </Link>
              </UserHoverCard>
              <VerifiedBadge handle={user.handle} did={user.did} />
            </div>
            <HandleLink handle={user.handle} className="text-sm" />
            {user.description && (
              <p className="text-sm mt-0.5 line-clamp-1 text-muted-foreground">{user.description}</p>
            )}
          </div>
          {isAuthenticated && (
            <Button
              variant={followUri ? "outline" : "default"}
              size="sm"
              className="shrink-0 h-8"
              onClick={handleToggleFollow}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : followUri ? (
                <>
                  <UserMinus className="h-3.5 w-3.5 mr-1" />
                  Unfollow
                </>
              ) : (
                <>
                  <UserPlus className="h-3.5 w-3.5 mr-1" />
                  Follow
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function MediaGrid({ posts }: { posts: Post[] }) {
  // Extract all images from posts
  const allMedia = posts.flatMap(post => {
    if (post.embed?.images) {
      return post.embed.images.map(img => ({
        postUri: post.uri,
        authorHandle: post.author.handle,
        thumb: img.thumb,
        fullsize: img.fullsize,
        alt: img.alt,
      }))
    }
    return []
  })

  if (allMedia.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Image className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No media posts yet</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-1 sm:gap-2">
      {allMedia.map((media, index) => (
        <Link 
          key={`${media.postUri}-${index}`}
          href={`/profile/${media.authorHandle}/post/${media.postUri.split('/').pop()}`}
          className="aspect-square relative overflow-hidden rounded-md bg-muted hover:opacity-90 transition-opacity"
        >
          <img
            src={media.thumb}
            alt={media.alt || "Media"}
            className="w-full h-full object-cover"
          />
        </Link>
      ))}
    </div>
  )
}
