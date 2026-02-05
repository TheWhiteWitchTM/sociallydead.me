"use client"

import { useState, useCallback, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { useBluesky } from "@/lib/bluesky-context"
import { SignInPrompt } from "@/components/sign-in-prompt"
import { Feed } from "@/components/feed"
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
import { Loader2, Settings, Camera, ArrowLeft, ExternalLink, Calendar } from "lucide-react"
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
  
  // Followers/Following lists
  const [followers, setFollowers] = useState<UserProfile[]>([])
  const [following, setFollowing] = useState<UserProfile[]>([])
  const [listLoading, setListLoading] = useState(false)

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || "")
      setDescription(user.description || "")
    }
  }, [user])

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

  useEffect(() => {
    if (activeTab === "followers" && followers.length === 0) {
      loadFollowers()
    } else if (activeTab === "following" && following.length === 0) {
      loadFollowing()
    }
  }, [activeTab, followers.length, following.length, loadFollowers, loadFollowing])

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
            <h1 className="text-lg font-bold truncate">{user.displayName || user.handle}</h1>
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
          <h2 className="text-xl font-bold">{user.displayName || user.handle}</h2>
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
              onClick={() => setActiveTab("following")}
              className="hover:underline"
            >
              <span className="font-semibold">{user.followsCount || 0}</span>
              <span className="text-muted-foreground ml-1">Following</span>
            </button>
            <button 
              onClick={() => setActiveTab("followers")}
              className="hover:underline"
            >
              <span className="font-semibold">{user.followersCount || 0}</span>
              <span className="text-muted-foreground ml-1">Followers</span>
            </button>
          </div>
        </div>

        {/* Profile Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="px-2 sm:px-4">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="replies">Replies</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
            <TabsTrigger value="likes">Likes</TabsTrigger>
            <TabsTrigger value="followers">Followers</TabsTrigger>
            <TabsTrigger value="following">Following</TabsTrigger>
          </TabsList>
          
          <TabsContent value="posts" className="mt-4">
            <Feed type="profile" />
          </TabsContent>
          
          <TabsContent value="replies" className="mt-4">
            <Feed type="replies" />
          </TabsContent>
          
          <TabsContent value="media" className="mt-4">
            <Feed type="media" />
          </TabsContent>
          
          <TabsContent value="likes" className="mt-4">
            <Feed type="likes" />
          </TabsContent>
          
          <TabsContent value="followers" className="mt-4">
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
                  <UserCard key={follower.did} user={follower} />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="following" className="mt-4">
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
                  <UserCard key={followed.did} user={followed} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

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

function UserCard({ user }: { user: UserProfile }) {
  return (
    <Card className="hover:bg-accent/50 transition-colors">
      <CardContent className="p-3 sm:p-4">
        <Link href={`/profile/${user.handle}`} className="flex items-start gap-3">
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
