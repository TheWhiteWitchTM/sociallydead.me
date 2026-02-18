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
import {
  Bug, Loader2, Settings, Camera, ArrowLeft, ExternalLink, Calendar, Star,
  FileText, Image, Plus, X, Pin, Rss, ListIcon, Package, Heart, UserPlus,
  UserMinus, Video
} from "lucide-react"
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
    video?: {
      ref?: { $link: string }
      mimeType: string
      thumb?: { fullsize?: string; [key: string]: any }
      [key: string]: any
    }
    thumb?: { fullsize?: string; [key: string]: any }
    external?: {
      uri: string
      title: string
      description: string
      thumb?: { fullsize?: string; [key: string]: any }
      mimeType?: string
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
    user, isAuthenticated, isLoading,
    updateProfile, getFollowers, getFollowing,
    getUserPosts, getUserReplies, getUserMedia,
    getPost, getHighlights, removeHighlight,
    getArticles, getProfile, getActorFeeds,
    getLists, getStarterPacks, unfollowUser, followUser,
  } = useBluesky()

  const [fullProfile, setFullProfile] = useState<FullProfile | null>(null)
  const searchParams = useSearchParams()
  const initialTab = searchParams.get("tab") || "posts"
  const [activeTab, setActiveTab] = useState(initialTab)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editLoading, setEditLoading] = useState(false)

  const [displayName, setDisplayName] = useState("")
  const [description, setDescription] = useState("")
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)

  const [posts, setPosts] = useState<Post[]>([])
  const [postsLoading, setPostsLoading] = useState(false)
  const [pinnedPostData, setPinnedPostData] = useState<Post | null>(null)

  const [highlights, setHighlights] = useState<Array<{ uri: string; postUri: string; postCid: string; createdAt: string }>>([])
  const [highlightPosts, setHighlightPosts] = useState<Post[]>([])
  const [articles, setArticles] = useState<Array<{ uri: string; rkey: string; title: string; content: string; createdAt: string }>>([])
  const [highlightLoading, setHighlightLoading] = useState(false)

  const [feeds, setFeeds] = useState<Array<{ uri: string; displayName: string; description?: string; avatar?: string; likeCount?: number; creator: { handle: string; displayName?: string } }>>([])
  const [lists, setLists] = useState<Array<{ uri: string; name: string; purpose: string; description?: string; avatar?: string; listItemCount?: number }>>([])
  const [starterPacks, setStarterPacks] = useState<Array<{ uri: string; cid: string; record: { name: string; description?: string; createdAt: string } }>>([])
  const [feedsLoading, setFeedsLoading] = useState(false)
  const [listsLoading, setListsLoading] = useState(false)
  const [starterPacksLoading, setStarterPacksLoading] = useState(false)

  const [showFollowersModal, setShowFollowersModal] = useState(false)
  const [showFollowingModal, setShowFollowingModal] = useState(false)
  const [followers, setFollowers] = useState<UserProfile[]>([])
  const [following, setFollowing] = useState<UserProfile[]>([])
  const [listLoading, setListLoading] = useState(false)

  const [videos, setVideos] = useState<Post[]>([])
  const [videosLoading, setVideosLoading] = useState(false)

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || "")
      setDescription(user.description || "")
    }
  }, [user])

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

  useEffect(() => {
    if (user) loadPinnedPost()
  }, [user, loadPinnedPost])

  const loadFeeds = useCallback(async () => {
    if (!user) return
    setFeedsLoading(true)
    try {
      setFeeds(await getActorFeeds(user.did) as typeof feeds)
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
      setLists(await getLists(user.did) as typeof lists)
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
      setStarterPacks(await getStarterPacks(user.did) as typeof starterPacks)
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
      let fetched: Post[]
      switch (type) {
        case "posts":   fetched = await getUserPosts(user.did); break
        case "replies": fetched = await getUserReplies(user.did); break
        case "media":   fetched = await getUserMedia(user.did); break
        default:        fetched = await getUserPosts(user.did)
      }
      setPosts(fetched)
    } catch (err) {
      console.error("Failed to load posts:", err)
    } finally {
      setPostsLoading(false)
    }
  }, [user, getUserPosts, getUserReplies, getUserMedia])

  const loadVideos = useCallback(async () => {
    if (!user) return
    setVideosLoading(true)
    try {
      const allPosts = await getUserPosts(user.did)
      const videoPosts = allPosts.filter(post => {
        if (!post.embed) return false
        const t = post.embed.$type
        return (
          t === "app.bsky.embed.video" ||
          t === "app.bsky.embed.video#view" ||
          t?.startsWith("app.bsky.embed.video") ||
          (t === "app.bsky.embed.external" && post.embed.external?.mimeType?.startsWith("video/"))
        )
      })
      setVideos(videoPosts)
    } catch (err) {
      console.error("Failed to load videos:", err)
      setVideos([])
    } finally {
      setVideosLoading(false)
    }
  }, [user, getUserPosts])

  const loadHighlightsAndArticles = useCallback(async () => {
    if (!user) return
    setHighlightLoading(true)
    try {
      const hData = await getHighlights(user.did)
      setHighlights(hData)
      if (hData.length > 0) {
        const promises = hData.map(h => getPost(h.postUri))
        const fetched = await Promise.all(promises)
        setHighlightPosts(fetched.filter((p): p is Post => !!p))
      } else {
        setHighlightPosts([])
      }
      setArticles(await getArticles(user.did))
    } catch (error) {
      console.error("Failed to load highlights/articles:", error)
    } finally {
      setHighlightLoading(false)
    }
  }, [user, getHighlights, getArticles, getPost])

  useEffect(() => {
    if (!user) return
    if (["posts", "replies", "media"].includes(activeTab)) {
      loadPosts(activeTab)
    } else if (activeTab === "videos") {
      loadVideos()
    }
  }, [user, activeTab, loadPosts, loadVideos])

  useEffect(() => { if (user) loadHighlightsAndArticles() }, [user, loadHighlightsAndArticles])
  useEffect(() => { if (user) { loadFeeds(); loadLists(); loadStarterPacks() } }, [user, loadFeeds, loadLists, loadStarterPacks])
  useEffect(() => {
    if (user) {
      getProfile(user.handle).then(setFullProfile).catch(() => {})
    }
  }, [user, getProfile])

  const loadFollowers = useCallback(async () => {
    if (!user) return
    setListLoading(true)
    try {
      const res = await getFollowers(user.handle)
      setFollowers(res.followers)
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
      const res = await getFollowing(user.handle)
      setFollowing(res.following)
    } catch (error) {
      console.error("Failed to load following:", error)
    } finally {
      setListLoading(false)
    }
  }, [user, getFollowing])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setAvatarPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setBannerFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setBannerPreview(reader.result as string)
    reader.readAsDataURL(file)
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
      setAvatarFile(null); setAvatarPreview(null)
      setBannerFile(null); setBannerPreview(null)
      if (user) setFullProfile(await getProfile(user.handle))
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
      setAvatarPreview(null); setBannerPreview(null)
      setAvatarFile(null); setBannerFile(null)
    }
    setIsEditDialogOpen(true)
  }

  if (isLoading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
  if (!isAuthenticated || !user) return <SignInPrompt title="Profile" description="Sign in to view your profile" />

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center gap-4 px-4">
          <Link href="/"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
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
        <div className="relative">
          {(fullProfile?.banner || user.banner) ? (
            <div className="h-32 sm:h-48 w-full bg-cover bg-center" style={{ backgroundImage: `url(${fullProfile?.banner || user.banner})` }} />
          ) : (
            <div className="h-32 sm:h-48 w-full bg-gradient-to-r from-primary/30 to-primary/10" />
          )}

          <div className="absolute -bottom-16 left-4">
            <div className="relative">
              <Avatar className="h-24 w-24 sm:h-32 sm:w-32 border-4 border-background">
                <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.displayName || user.handle} />
                <AvatarFallback className="text-2xl sm:text-3xl">
                  {(user.displayName || user.handle).slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <VerifiedBadge handle={user.handle} did={user.did} className="absolute right-0 bottom-0 scale-125 origin-bottom-right bg-background rounded-full border-2 border-background" />
            </div>
          </div>

          <div className="absolute right-4 bottom-4 flex gap-1">
            <Button variant="outline" size="sm" onClick={openEditDialog}>Edit Profile</Button>
            <Link href="/settings"><Button variant="outline" size="icon" className="h-9 w-9"><Settings className="h-4 w-4" /></Button></Link>
            <Link href="/debug"><Button variant="outline" size="icon" className="h-9 w-9"><Bug className="h-4 w-4" /></Button></Link>
          </div>
        </div>

        <div className="px-4 pt-20 pb-4">
          <h2 className="text-xl font-bold inline-flex items-center gap-1.5">
            {user.displayName || user.handle}
            <VerifiedBadge handle={user.handle} did={user.did} className="h-5 w-5" />
          </h2>
          <HandleLink handle={user.handle} />
          {user.description && <p className="mt-3 whitespace-pre-wrap">{user.description}</p>}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1"><Calendar className="h-4 w-4" /><span>Joined Bluesky</span></div>
            <a href={`https://bsky.app/profile/${user.handle}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-foreground transition-colors">
              <ExternalLink className="h-4 w-4" /><span>View on Bluesky</span>
            </a>
          </div>

          <div className="flex gap-4 mt-3 text-sm">
            <button onClick={() => { setShowFollowingModal(true); loadFollowing() }} className="hover:underline">
              <span className="font-semibold">{user.followsCount || 0}</span> <span className="text-muted-foreground ml-1">Following</span>
            </button>
            <button onClick={() => { setShowFollowersModal(true); loadFollowers() }} className="hover:underline">
              <span className="font-semibold">{user.followersCount || 0}</span> <span className="text-muted-foreground ml-1">Followers</span>
            </button>
          </div>
          <VerificationPrompt className="mt-2" />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="px-2 sm:px-4">
          <div className="overflow-x-auto -mx-2 sm:-mx-4 px-2 sm:px-4" style={{ WebkitOverflowScrolling: 'touch' }}>
            <TabsList className="inline-flex w-max gap-0">
              <TabsTrigger value="posts" className="flex-none text-xs sm:text-sm px-2.5 sm:px-3">Posts</TabsTrigger>
              <TabsTrigger value="replies" className="flex-none text-xs sm:text-sm px-2.5 sm:px-3">Replies</TabsTrigger>
              {highlightPosts.length > 0 && (
                <TabsTrigger value="highlights" className="flex-none flex items-center gap-1 text-xs sm:text-sm px-2.5 sm:px-3">
                  <Star className="h-3 w-3 shrink-0" /> Highlights
                </TabsTrigger>
              )}
              {articles.length > 0 && (
                <TabsTrigger value="articles" className="flex-none flex items-center gap-1 text-xs sm:text-sm px-2.5 sm:px-3">
                  <FileText className="h-3 w-3 shrink-0" /> Articles
                </TabsTrigger>
              )}
              <TabsTrigger value="media" className="flex-none flex items-center gap-1 text-xs sm:text-sm px-2.5 sm:px-3">
                <Image className="h-3 w-3 shrink-0" /> Media
              </TabsTrigger>
              <TabsTrigger value="videos" className="flex-none flex items-center gap-1 text-xs sm:text-sm px-2.5 sm:px-3">
                <Video className="h-3 w-3 shrink-0" /> Videos
              </TabsTrigger>
              {feeds.length > 0 && (
                <TabsTrigger value="feeds" className="flex-none flex items-center gap-1 text-xs sm:text-sm px-2.5 sm:px-3">
                  <Rss className="h-3 w-3 shrink-0" /> Feeds
                </TabsTrigger>
              )}
              {lists.length > 0 && (
                <TabsTrigger value="lists" className="flex-none flex items-center gap-1 text-xs sm:text-sm px-2.5 sm:px-3">
                  <ListIcon className="h-3 w-3 shrink-0" /> Lists
                </TabsTrigger>
              )}
              {starterPacks.length > 0 && (
                <TabsTrigger value="starterpacks" className="flex-none flex items-center gap-1 text-xs sm:text-sm px-2.5 sm:px-3">
                  <Package className="h-3 w-3 shrink-0" /> Packs
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          <TabsContent value="posts" className="mt-4">{/* ... existing posts content ... */}</TabsContent>
          <TabsContent value="replies" className="mt-4">{/* ... existing replies content ... */}</TabsContent>
          <TabsContent value="highlights" className="mt-4">{/* ... existing highlights content ... */}</TabsContent>
          <TabsContent value="articles" className="mt-4">{/* ... existing articles content ... */}</TabsContent>

          <TabsContent value="media" className="mt-4">
            {postsLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
            ) : (
              <MediaGrid posts={posts} userHandle={user.handle} />
            )}
          </TabsContent>

          <TabsContent value="videos" className="mt-4">
            {videosLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
            ) : videos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Video className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No videos yet</p>
              </div>
            ) : (
              <VideoGrid posts={videos} userHandle={user.handle} />
            )}
          </TabsContent>

          {/* feeds, lists, starterpacks TabsContent remain unchanged */}
          <TabsContent value="feeds" className="mt-4">{/* ... */}</TabsContent>
          <TabsContent value="lists" className="mt-4">{/* ... */}</TabsContent>
          <TabsContent value="starterpacks" className="mt-4">{/* ... */}</TabsContent>
        </Tabs>
      </main>

      {/* Followers / Following / Edit dialogs remain unchanged */}
      {/* ... Dialog components ... */}
    </div>
  )
}

// UserCard and MediaGrid remain unchanged

function VideoGrid({ posts, userHandle }: { posts: Post[]; userHandle: string }) {
  const allVideos = posts
    .map(post => {
      if (!post.embed) return null
      let thumb: string | undefined

      const t = post.embed.$type
      if (t === "app.bsky.embed.video" || t === "app.bsky.embed.video#view" || t?.startsWith("app.bsky.embed.video")) {
        thumb = post.embed.video?.thumb?.fullsize || post.embed.video?.thumb || post.embed.thumb?.fullsize || post.embed.thumb
      } else if (t === "app.bsky.embed.external" && post.embed.external?.mimeType?.startsWith("video/")) {
        thumb = post.embed.external.thumb?.fullsize || post.embed.external.thumb
      }

      if (!thumb) return null

      return { postUri: post.uri, thumb, alt: "Video thumbnail" }
    })
    .filter((v): v is NonNullable<typeof v> => !!v.thumb)

  if (allVideos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Video className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No video thumbnails available</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-1 sm:gap-2">
      {allVideos.map((v, i) => (
        <Link
          key={`${v.postUri}-${i}`}
          href={`/profile/${userHandle}/post/${v.postUri.split('/').pop()}`}
          className="aspect-square relative overflow-hidden rounded-md bg-muted hover:opacity-90 transition-opacity group"
        >
          <img src={v.thumb} alt={v.alt} className="w-full h-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/60 transition-colors">
            <Video className="h-10 w-10 text-white drop-shadow-lg" fill="currentColor" />
          </div>
        </Link>
      ))}
    </div>
  )
}