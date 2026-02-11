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
import { useRouter } from "next/navigation"
import { Loader2, RefreshCw, ListIcon, ArrowLeft, UserPlus, UserMinus, ShieldAlert, Plus, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function ListPage() {
  const params = useParams()
  const listUri = decodeURIComponent(params.list as string)
  
  const { 
    isAuthenticated, 
    isLoading: authLoading,
    user,
    getList,
    getListFeed,
    updateList,
    deleteList,
    addToList,
    removeFromList,
    searchActors,
  } = useBluesky()

  const router = useRouter()
  const [list, setList] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([])
  const [posts, setPosts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [postsLoading, setPostsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("posts")

  // Edit dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editName, setEditName] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [isEditing, setIsEditing] = useState(false)

  // Add user dialog
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isAdding, setIsAdding] = useState(false)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await getList(listUri)
      setList(result.list)
      setEditName(result.list.name)
      setEditDescription(result.list.description || "")
      setMembers(result.items.map(item => ({
        ...item.subject,
        itemUri: item.uri // Keep the item URI for removal
      })))
      
      await loadPosts()
    } catch (err) {
      console.error("Failed to load list:", err)
      setError(err instanceof Error ? err.message : "Failed to load list")
    } finally {
      setIsLoading(false)
    }
  }, [listUri, getList])

  const loadPosts = async () => {
    setPostsLoading(true)
    try {
      const result = await getListFeed(listUri)
      setPosts(result.posts)
    } catch (err) {
      console.error("Failed to load list feed:", err)
    } finally {
      setPostsLoading(false)
    }
  }

  const handleEditList = async () => {
    if (!list || !editName.trim()) return
    
    setIsEditing(true)
    try {
      await updateList(list.uri, editName, editDescription || undefined)
      setEditDialogOpen(false)
      loadData()
    } catch (error) {
      console.error("Failed to update list:", error)
    } finally {
      setIsEditing(false)
    }
  }

  const handleDeleteList = async () => {
    if (!list || !confirm(`Are you sure you want to delete "${list.name}"?`)) return
    
    try {
      await deleteList(list.uri)
      router.push("/lists")
    } catch (error) {
      console.error("Failed to delete list:", error)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    
    setIsSearching(true)
    try {
      const result = await searchActors(searchQuery)
      setSearchResults(result.actors)
    } catch (error) {
      console.error("Search failed:", error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleAddToList = async (did: string) => {
    if (!list) return
    
    setIsAdding(true)
    try {
      await addToList(list.uri, did)
      setAddUserDialogOpen(false)
      setSearchQuery("")
      setSearchResults([])
      loadData()
    } catch (error) {
      console.error("Failed to add user to list:", error)
    } finally {
      setIsAdding(false)
    }
  }

  const handleRemoveFromList = async (itemUri: string) => {
    try {
      await removeFromList(itemUri)
      setMembers((prev) => prev.filter(m => m.itemUri !== itemUri))
    } catch (error) {
      console.error("Failed to remove from list:", error)
    }
  }

  useEffect(() => {
    loadData()
  }, [loadData])

  if (authLoading || (isLoading && !list)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !list) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 gap-4">
        <p className="text-muted-foreground">{error || "List not found"}</p>
        <Link href="/lists">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Lists
          </Button>
        </Link>
      </div>
    )
  }

  const isModList = list.purpose === 'app.bsky.graph.defs#modlist'

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center gap-4 px-4">
          <Link href="/lists">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold truncate flex items-center gap-2">
              <ListIcon className="h-4 w-4 shrink-0" />
              {list.name}
            </h1>
          </div>
          <div className="flex items-center gap-1">
            <Button onClick={loadPosts} variant="ghost" size="icon" disabled={postsLoading}>
              <RefreshCw className={`h-4 w-4 ${postsLoading ? 'animate-spin' : ''}`} />
            </Button>
            {list.creator.did === user?.did && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={handleDeleteList}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto">
        {/* List Header Info */}
        <div className="p-4 sm:p-6 border-b border-border">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
              <AvatarImage src={list.avatar || "/placeholder.svg"} />
              <AvatarFallback>
                <ListIcon className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="text-xl sm:text-2xl font-bold truncate">{list.name}</h2>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                    <span>by</span>
                    <UserHoverCard handle={list.creator.handle}>
                      <Link href={`/profile/${list.creator.handle}`} className="font-medium hover:underline flex items-center gap-1 min-w-0">
                        <span className="truncate">{list.creator.displayName || list.creator.handle}</span>
                        <VerifiedBadge handle={list.creator.handle} did={list.creator.did} />
                      </Link>
                    </UserHoverCard>
                  </div>
                </div>
                {isModList && (
                  <div className="flex items-center gap-1 text-destructive bg-destructive/10 px-2 py-1 rounded text-xs font-medium shrink-0">
                    <ShieldAlert className="h-3 w-3" />
                    Moderation List
                  </div>
                )}
              </div>
              
              {list.description && (
                <p className="text-sm mt-3 whitespace-pre-wrap">{list.description}</p>
              )}
              
              <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                <span>{members.length} {members.length === 1 ? 'member' : 'members'}</span>
                {list.creator.did === user?.did && (
                  <Dialog open={addUserDialogOpen} onOpenChange={setAddUserDialogOpen}>
                    <DialogTrigger asChild>
                      <button className="text-primary hover:underline font-medium flex items-center gap-1 ml-auto">
                        <Plus className="h-3.5 w-3.5" />
                        Add People
                      </button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add User to List</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Search for a user..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                          />
                          <Button onClick={handleSearch} disabled={isSearching}>
                            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
                          </Button>
                        </div>
                        {searchResults.length > 0 && (
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {searchResults.map((actor) => (
                              <Card 
                                key={actor.did} 
                                className="cursor-pointer hover:bg-accent transition-colors"
                                onClick={() => handleAddToList(actor.did)}
                              >
                                <CardContent className="p-3">
                                  <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10">
                                      <AvatarImage src={actor.avatar || "/placeholder.svg"} />
                                      <AvatarFallback>
                                        {(actor.displayName || actor.handle).slice(0, 2).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                      <p className="font-semibold flex items-center gap-1">{actor.displayName || actor.handle} <VerifiedBadge handle={actor.handle} /></p>
                                      <HandleLink handle={actor.handle} className="text-sm" />
                                    </div>
                                    {isAdding ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <UserPlus className="h-4 w-4 text-muted-foreground" />
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
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
                <p className="text-muted-foreground">No posts found from this list's members</p>
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

          <TabsContent value="people" className="p-0 m-0">
            {members.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-muted-foreground">No members in this list</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {members.map((member) => (
                  <UserCard 
                    key={member.did} 
                    user={member} 
                    canRemove={list.creator.did === user?.did}
                    onRemove={() => handleRemoveFromList(member.itemUri)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit List</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description (optional)</Label>
              <Textarea
                id="edit-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditList} disabled={isEditing || !editName.trim()}>
              {isEditing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function UserCard({ user, canRemove, onRemove }: { user: any, canRemove?: boolean, onRemove?: () => void }) {
  const { followUser, unfollowUser, isAuthenticated } = useBluesky()
  const [followUri, setFollowUri] = useState<string | undefined>(user.viewer?.following)
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
    <Card className="rounded-none border-x-0 border-t-0 hover:bg-accent/50 transition-colors shadow-none">
      <CardContent className="p-4">
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
            {user.description && (
              <p className="text-sm mt-1 line-clamp-1 text-muted-foreground">{user.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <Button
                variant={followUri ? "outline" : "default"}
                size="sm"
                className="shrink-0 h-8"
                onClick={handleToggleFollow}
                disabled={isToggling}
              >
                {isToggling ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : followUri ? (
                  <>
                    <UserMinus className="h-4 w-4 mr-1" />
                    Unfollow
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-1" />
                    Follow
                  </>
                )}
              </Button>
            )}
            {canRemove && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={onRemove}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}