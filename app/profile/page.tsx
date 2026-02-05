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
import { Loader2, Settings, Camera, ArrowLeft, ExternalLink, Calendar, Star, FileText, Image, Plus, X, Pin } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { VerifiedBadge } from "@/components/verified-badge"

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
  } = useBluesky()
  
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
  
  // Highlights and Articles (SociallyDead exclusive)
  const [highlights, setHighlights] = useState<Array<{ uri: string; postUri: string; postCid: string; createdAt: string }>>([])
  const [highlightPosts, setHighlightPosts] = useState<Post[]>([])
  const [articles, setArticles] = useState<Array<{ uri: string; rkey: string; title: string; content: string; createdAt: string }>>([])
  const [highlightLoading, setHighlightLoading] = useState(false)
  
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
              <VerifiedBadge handle={user.handle} />
            </h1>
            <p className="text-xs text-muted-foreground">{user.postsCount || 0} posts</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl">
        {/* Profile Header */}
        <div className="relative">
          {/* Banner */}
          {user.banner ? (
            <div 
              className="h-32 sm:h-48 w-full bg-cover bg-center" 
              style={{ backgroundImage: `url(${user.banner})` }} 
            />
          ) : (
            <div className="h-32 sm:h-48 w-full bg-gradient-to-r from-primary/30 to-primary/10" />
          )}
          
          {/* Avatar */}
          <div className="absolute -bottom-16 left-4">
            <Avatar className="h-24 w-24 sm:h-32 sm:w-32 border-4 border-background">
              <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.displayName || user.handle} />
              <AvatarFallback className="text-2xl sm:text-3xl">
                {(user.displayName || user.handle).slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
          
          {/* Edit Button */}
          <div className="absolute right-4 bottom-4 flex gap-2">
            <Button variant="outline" size="sm" onClick={openEditDialog}>
              Edit Profile
            </Button>
            <Link href="/settings">
              <Button variant="outline" size="icon" className="h-9 w-9">
                <Settings className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
        
{/* Profile Info */}
        <div className="px-4 pt-20 pb-4">
          <h2 className="text-xl font-bold inline-flex items-center gap-1.5">
            {user.displayName || user.handle}
            <VerifiedBadge handle={user.handle} className="h-5 w-5" />
          </h2>
          <p className="text-muted-foreground">@{user.handle}</p>
          
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
        </div>

        {/* Profile Tabs - X/Twitter Style */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="px-2 sm:px-4">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="replies">Replies</TabsTrigger>
            <TabsTrigger value="highlights" className="flex items-center gap-1">
              <Star className="h-3 w-3" />
              Highlights
            </TabsTrigger>
            <TabsTrigger value="articles" className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              Articles
            </TabsTrigger>
            <TabsTrigger value="media" className="flex items-center gap-1">
              <Image className="h-3 w-3" />
              Media
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="posts" className="mt-4">
            {postsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : posts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-muted-foreground">No posts yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <PostCard
                    key={post.uri}
                    post={post}
                    isOwnPost={true}
                    onPostUpdated={() => loadPosts("posts")}
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
                      : user.banner 
                        ? `url(${user.banner})` 
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

function UserCard({ user, onNavigate }: { user: UserProfile; onNavigate?: () => void }) {
  return (
    <Card className="hover:bg-accent/50 transition-colors">
      <CardContent className="p-3 sm:p-4">
        <Link 
          href={`/profile/${user.handle}`} 
          className="flex items-start gap-3"
          onClick={onNavigate}
        >
          <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
            <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.displayName || user.handle} />
            <AvatarFallback>
              {(user.displayName || user.handle).slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold truncate">{user.displayName || user.handle}</span>
            </div>
            <p className="text-sm text-muted-foreground">@{user.handle}</p>
            {user.description && (
              <p className="text-sm mt-1 line-clamp-2">{user.description}</p>
            )}
          </div>
        </Link>
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
