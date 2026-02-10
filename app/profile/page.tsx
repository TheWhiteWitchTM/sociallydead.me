"use client"

import { useState, useCallback, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { useBluesky } from "@/lib/bluesky-context"
import { SignInPrompt } from "@/components/sign-in-prompt"
import { PostCard } from "@/components/post-card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Bug, Loader2, Settings, Camera, ArrowLeft, ExternalLink, Calendar, Star, FileText, Image, Plus, X, Pin, Rss, ListIcon, Package, Heart, UserPlus, UserMinus } from "lucide-react"
import { VerificationPrompt } from "@/components/verification-checkout"
import { formatDistanceToNow } from "date-fns"
import { VerifiedBadge } from "@/components/verified-badge"
import { HandleLink } from "@/components/handle-link"
import { UserHoverCard } from "@/components/user-hover-card"

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

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <ProfileContent />
    </Suspense>
  )
}

interface FullProfile {
  did: string
  handle: string
  displayName?: string
  avatar?: string
  banner?: string
  description?: string
  followersCount?: number
  followsCount?: number
  postsCount?: number
  pinnedPost?: { uri: string; cid: string }
}

function ProfileContent() {
  const { 
    user, 
    isAuthenticated, 
    isLoading,
    updateProfile,
    getFollowers,
    getFollowing,
    getUserPosts,
    getUserReplies,
    getUserMedia,
    getPost,
    getHighlights,
    removeHighlight,
    getArticles,
    getProfile,
    getActorFeeds,
    getLists,
    getStarterPacks,
    unfollowUser,
    followUser,
  } = useBluesky()
  
  // Store full profile data with banner
  const [fullProfile, setFullProfile] = useState<FullProfile | null>(null)
  
  const searchParams = useSearchParams()
  const initialTab = searchParams.get("tab") || "posts"
  
  const [activeTab, setActiveTab] = useState(initialTab)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editLoading, setEditLoading] = useState(false)
  
  // Edit form state
  const [displayName, setDisplayName] = useState("")
  const [description, setDescription] = useState("")
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)
  
  // Posts state
  const [posts, setPosts] = useState<Post[]>([])
  const [postsLoading, setPostsLoading] = useState(false)
  const [pinnedPostData, setPinnedPostData] = useState<Post | null>(null)
  
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
  
  // Followers/Following modal state
  const [showFollowersModal, setShowFollowersModal] = useState(false)
  const [showFollowingModal, setShowFollowingModal] = useState(false)
  const [followers, setFollowers] = useState<UserProfile[]>([])
  const [following, setFollowing] = useState<UserProfile[]>([])
  const [listLoading, setListLoading] = useState(false)

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || "")
      setDescription(user.description || "")
    }
  }, [user])

  // Load pinned post
  const loadPinnedPost = useCallback(async () => {
    if (!user) return
    try {
      const profileData = await getProfile(user.handle)
      if (profileData?.pinnedPost?.uri) {
        const pinned = await getPost(profileData.pinnedPost.uri)
        setPinnedPostData(pinned as Post | null)
      } else {
        setPinnedPostData(null)
      }
    } catch (err) {
      console.error("Failed to load pinned post:", err)
      setPinnedPostData(null)
    }
  }, [user, getProfile, getPost])

  // Load pinned post on mount
  useEffect(() => {
    if (user) {
      loadPinnedPost()
    }
  }, [user, loadPinnedPost])

  const loadFeeds = useCallback(async () => {
    if (!user) return
    setFeedsLoading(true)
    try {
      const data = await getActorFeeds(user.did)
      setFeeds(data as typeof feeds)
    } catch (error) {
      console.error("Failed to load feeds:", error)
    } finally {
      setFeedsLoading(false)
    }
  }, [user, getActorFeeds])

  const loadLists = useCallback(async () => {
    if (!user) return
    setListsLoading(true)
    try {
      const data = await getLists(user.did)
      setLists(data as typeof lists)
    } catch (error) {
      console.error("Failed to load lists:", error)
    } finally {
      setListsLoading(false)
    }
  }, [user, getLists])

  const loadStarterPacks = useCallback(async () => {
    if (!user) return
    setStarterPacksLoading(true)
    try {
      const data = await getStarterPacks(user.did)
      setStarterPacks(data as typeof starterPacks)
    } catch (error) {
      console.error("Failed to load starter packs:", error)
    } finally {
      setStarterPacksLoading(false)
    }
  }, [user, getStarterPacks])

  const loadPosts = useCallback(async (type: string) => {
    if (!user) return
    setPostsLoading(true)
    
    try {
      let fetchedPosts: Post[]
      
      switch (type) {
        case "posts":
          fetchedPosts = await getUserPosts(user.did)
          break
        case "replies":
          fetchedPosts = await getUserReplies(user.did)
          break
        case "media":
          fetchedPosts = await getUserMedia(user.did)
          break
        default:
          fetchedPosts = await getUserPosts(user.did)
      }
      
      setPosts(fetchedPosts)
    } catch (err) {
      console.error("Failed to load posts:", err)
    } finally {
      setPostsLoading(false)
    }
  }, [user, getUserPosts, getUserReplies, getUserMedia])

  const loadHighlightsAndArticles = useCallback(async () => {
    if (!user) return
    setHighlightLoading(true)
    
    try {
      // Load highlights
      const highlightData = await getHighlights(user.did)
      setHighlights(highlightData)
      
      // Load the actual posts for highlights
      if (highlightData.length > 0) {
        const highlightPostPromises = highlightData.map(h => getPost(h.postUri))
        const fetchedPosts = await Promise.all(highlightPostPromises)
        setHighlightPosts(fetchedPosts.filter((p): p is Post => p !== null))
      } else {
        setHighlightPosts([])
      }
      
      // Load articles
      const articleData = await getArticles(user.did)
      setArticles(articleData)
    } catch (error) {
      console.error("Failed to load highlights/articles:", error)
    } finally {
      setHighlightLoading(false)
    }
  }, [user, getHighlights, getArticles, getPost])

  // Load posts when tab changes
  useEffect(() => {
    if (user && (activeTab === "posts" || activeTab === "replies" || activeTab === "media")) {
      loadPosts(activeTab)
    }
  }, [user, activeTab, loadPosts])

  // Load highlights and articles on mount
  useEffect(() => {
    if (user) {
      loadHighlightsAndArticles()
    }
  }, [user, loadHighlightsAndArticles])

  // Auto-load feeds, lists, and starter packs on mount so tabs show if they have content
  useEffect(() => {
    if (user) {
      loadFeeds()
      loadLists()
      loadStarterPacks()
    }
  }, [user, loadFeeds, loadLists, loadStarterPacks])

  // Load full profile data (including banner) on mount - always fetch fresh
  useEffect(() => {
    if (user) {
      getProfile(user.handle).then((profile) => {
        setFullProfile(profile)
      }).catch(() => {
        // Silently fail - will use context user data
      })
    }
  }, [user, getProfile])

  const loadFollowers = useCallback(async () => {
    if (!user) return
    setListLoading(true)
    try {
      const result = await getFollowers(user.handle)
      setFollowers(result.followers)
    } catch (error) {
      console.error("Failed to load followers:", error)
    } finally {
      setListLoading(false)
    }
  }, [user, getFollowers])

  const loadFollowing = useCallback(async () => {
    if (!user) return
    setListLoading(true)
    try {
      const result = await getFollowing(user.handle)
      setFollowing(result.following)
    } catch (error) {
      console.error("Failed to load following:", error)
    } finally {
      setListLoading(false)
    }
  }, [user, getFollowing])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setBannerFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setBannerPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSaveProfile = async () => {
    setEditLoading(true)
    try {
      await updateProfile({
        displayName: displayName || undefined,
        description: description || undefined,
        avatar: avatarFile || undefined,
        banner: bannerFile || undefined,
      })
      setIsEditDialogOpen(false)
      setAvatarFile(null)
      setAvatarPreview(null)
      setBannerFile(null)
      setBannerPreview(null)
      
      // Refresh full profile to get updated banner
      if (user) {
        const updatedProfile = await getProfile(user.handle)
        setFullProfile(updatedProfile)
      }
    } catch (error) {
      console.error("Failed to update profile:", error)
    } finally {
      setEditLoading(false)
    }
  }

  const openEditDialog = () => {
    if (user) {
      setDisplayName(user.displayName || "")
      setDescription(user.description || "")
      setAvatarPreview(null)
      setBannerPreview(null)
      setAvatarFile(null)
      setBannerFile(null)
    }
    setIsEditDialogOpen(true)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return <SignInPrompt title="Profile" description="Sign in to view your profile" />
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
              {user.displayName || user.handle}
              <VerifiedBadge handle={user.handle} did={user.did} />
            </h1>
            <p className="text-xs text-muted-foreground">{user.postsCount || 0} posts</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl">
        {/* Profile Header */}
        <div className="relative">
          {/* Banner - use fullProfile for latest data including banner */}
          {(fullProfile?.banner || user.banner) ? (
            <div 
              className="h-32 sm:h-48 w-full bg-cover bg-center" 
              style={{ backgroundImage: `url(${fullProfile?.banner || user.banner})` }} 
            />
          ) : (
            <div className="h-32 sm:h-48 w-full bg-gradient-to-r from-primary/30 to-primary/10" />
          )}
          
          {/* Avatar */}
          <div className="absolute -bottom-16 left-4">
            <div className="relative">
              <Avatar className="h-24 w-24 sm:h-32 sm:w-32 border-4 border-background">
                <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.displayName || user.handle} />
                <AvatarFallback className="text-2xl sm:text-3xl">
                  {(user.displayName || user.handle).slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <VerifiedBadge 
                handle={user.handle} 
                did={user.did}
                className="absolute right-0 bottom-0 scale-125 origin-bottom-right bg-background rounded-full border-2 border-background" 
              />
            </div>
          </div>
          
          {/* Edit Button */}
          <div className="absolute right-4 bottom-4 flex gap-1">
            <Button variant="outline" size="sm" onClick={openEditDialog}>
              Edit Profile
            </Button>
            <Link href="/settings">
              <Button variant="outline" size="icon" className="h-9 w-9">
                <Settings className="h-4 w-4" />
              </Button>
            </Link>
	          <Link href="/debug">
		          <Button variant="outline" size="icon" className="h-9 w-9">
			          <Bug className="h-4 w-4" />
		          </Button>
	          </Link>
          </div>
        </div>
        
{/* Profile Info */}
        <div className="px-4 pt-20 pb-4">
          <h2 className="text-xl font-bold inline-flex items-center gap-1.5">
            {user.displayName || user.handle}
            <VerifiedBadge handle={user.handle} did={user.did} className="h-5 w-5" />
          </h2>
          <HandleLink handle={user.handle} />
          
          {user.description && (
            <p className="mt-3 whitespace-pre-wrap">{user.description}</p>
          )}
          
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>Joined Bluesky</span>
            </div>
            <a 
              href={`https://bsky.app/profile/${user.handle}`} 
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
              <span className="font-semibold">{user.followsCount || 0}</span>
              <span className="text-muted-foreground ml-1">Following</span>
            </button>
            <button 
              onClick={() => {
                setShowFollowersModal(true)
                loadFollowers()
              }}
              className="hover:underline"
            >
              <span className="font-semibold">{user.followersCount || 0}</span>
              <span className="text-muted-foreground ml-1">Followers</span>
            </button>
          </div>
          <VerificationPrompt className="mt-2" />
        </div>

        {/* Profile Tabs - X/Twitter Style */}
        <Tabs value={activeTab} onValueChange={(tab) => {
          setActiveTab(tab)
          if (tab === "feeds") loadFeeds()
          else if (tab === "lists") loadLists()
          else if (tab === "starterpacks") loadStarterPacks()
        }} className="px-2 sm:px-4">
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
                <PostCard 
                  post={pinnedPostData} 
                  isOwnPost={true}
                  isPinned={true}
                  onPostUpdated={() => {
                    loadPosts("posts")
                    loadPinnedPost()
                  }}
                />
              </div>
            )}
            {postsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : posts.filter(p => p.uri !== pinnedPostData?.uri).length === 0 && !pinnedPostData ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-muted-foreground">No posts yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.filter(p => p.uri !== pinnedPostData?.uri).map((post) => (
                  <PostCard
                    key={post.uri}
                    post={post}
                    isOwnPost={true}
                    onPostUpdated={() => {
                      loadPosts("posts")
                      loadPinnedPost()
                    }}
                  />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="replies" className="mt-4">
            {postsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : posts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-muted-foreground">No replies yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <PostCard
                    key={post.uri}
                    post={post}
                    isOwnPost={true}
                    onPostUpdated={() => loadPosts("replies")}
                  />
                ))}
              </div>
            )}
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
                <p className="text-sm text-muted-foreground mt-2">
                  Add posts to your highlights from the post menu
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">{highlights.length}/6 highlights</span>
                </div>
                {highlightPosts.map((post, index) => (
                  <div key={post.uri} className="relative">
                    <PostCard
                      post={post}
                      isOwnPost={false}
                    />
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
                <Link href="/articles/new" className="mt-4">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Write your first article
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-end">
                  <Link href="/articles/new">
                    <Button variant="outline" size="sm">
                      <Plus className="h-3 w-3 mr-1" />
                      New Article
                    </Button>
                  </Link>
                </div>
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
              <MediaGrid posts={posts} userHandle={user.handle} />
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
                            {list.listItemCount !== undefined && ` \u00b7 ${list.listItemCount} members`}
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

      {/* Edit Profile Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your profile information. Changes will be visible on Bluesky.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Banner Upload */}
            <div>
              <Label>Banner Image</Label>
              <div className="mt-2 relative">
                <div 
                  className="h-24 w-full rounded-lg bg-cover bg-center bg-muted"
                  style={{ 
                    backgroundImage: bannerPreview 
                      ? `url(${bannerPreview})` 
                      : (fullProfile?.banner || user.banner)
                        ? `url(${fullProfile?.banner || user.banner})` 
                        : undefined 
                  }}
                />
                <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg cursor-pointer opacity-0 hover:opacity-100 transition-opacity">
                  <Camera className="h-6 w-6 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBannerChange}
                    className="sr-only"
                  />
                </label>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Recommended: 1500x500 pixels
              </p>
            </div>
            
            {/* Avatar Upload */}
            <div>
              <Label>Profile Picture</Label>
              <div className="mt-2 flex items-center gap-4">
                <div className="relative">
                  <Avatar className="h-20 w-20">
                    <AvatarImage 
                      src={avatarPreview || user.avatar || "/placeholder.svg"} 
                      alt="Profile" 
                    />
                    <AvatarFallback className="text-xl">
                      {(displayName || user.handle).slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full cursor-pointer opacity-0 hover:opacity-100 transition-opacity">
                    <Camera className="h-5 w-5 text-white" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="sr-only"
                    />
                  </label>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>Click to upload</p>
                  <p>JPG, PNG, GIF up to 1MB</p>
                </div>
              </div>
            </div>
            
            {/* Display Name */}
            <div>
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                maxLength={64}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {displayName.length}/64
              </p>
            </div>
            
            {/* Bio/Description */}
            <div>
              <Label htmlFor="description">Bio</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell us about yourself"
                maxLength={256}
                className="mt-1 min-h-24"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {description.length}/256
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveProfile} disabled={editLoading}>
              {editLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function UserCard({ user, onNavigate }: { user: UserProfile & { viewer?: { following?: string } }; onNavigate?: () => void }) {
  const { unfollowUser, followUser, isAuthenticated } = useBluesky()
  const [followUri, setFollowUri] = useState(user.viewer?.following)
  const [isToggling, setIsToggling] = useState(false)

  const handleToggleFollow = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsToggling(true)
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
      setIsToggling(false)
    }
  }

  return (
    <Card className="hover:bg-accent/50 transition-colors">
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <UserHoverCard handle={user.handle}>
            <Link href={`/profile/${user.handle}`} onClick={onNavigate} className="shrink-0 relative">
              <Avatar className="h-10 w-10 cursor-pointer hover:opacity-80 transition-opacity">
                <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.displayName || user.handle} />
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
              disabled={isToggling}
            >
              {isToggling ? (
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

function MediaGrid({ posts, userHandle }: { posts: Post[]; userHandle: string }) {
  // Extract all images from posts
  const allMedia = posts.flatMap(post => {
    if (post.embed?.images) {
      return post.embed.images.map(img => ({
        postUri: post.uri,
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
          href={`/profile/${userHandle}/post/${media.postUri.split('/').pop()}`}
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
