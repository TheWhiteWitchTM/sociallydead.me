"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { useBluesky } from "@/lib/bluesky-context"
import { SignInPrompt } from "@/components/sign-in-prompt"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, RefreshCw, Plus, UsersRound, MoreHorizontal, Pencil, Trash2, UserPlus, UserMinus, ExternalLink, ArrowLeft, Rss } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface StarterPack {
  uri: string
  cid: string
  record: {
    name: string
    description?: string
    list: string
    feeds?: Array<{ uri: string }>
    createdAt: string
  }
  creator: {
    did: string
    handle: string
    displayName?: string
    avatar?: string
  }
  list?: {
    uri: string
    cid: string
    name: string
    listItemCount?: number
  }
  listItemsSample?: Array<{
    uri: string
    subject: {
      did: string
      handle: string
      displayName?: string
      avatar?: string
      description?: string
    }
  }>
  feeds?: Array<{
    uri: string
    cid: string
    did: string
    displayName: string
    description?: string
    avatar?: string
    likeCount?: number
  }>
  joinedWeekCount?: number
  joinedAllTimeCount?: number
  indexedAt: string
}

export default function StarterPacksPage() {
  const { 
    isAuthenticated, 
    isLoading: authLoading, 
    user,
    getStarterPacks,
    getStarterPack,
    createStarterPack,
    updateStarterPack,
    deleteStarterPack,
    addToStarterPack,
    removeFromStarterPack,
    searchActors,
    getList,
  } = useBluesky()
  
  const [starterPacks, setStarterPacks] = useState<StarterPack[]>([])
  const [selectedPack, setSelectedPack] = useState<StarterPack | null>(null)
  const [packMembers, setPackMembers] = useState<Array<{ uri: string; subject: { did: string; handle: string; displayName?: string; avatar?: string; description?: string } }>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [membersLoading, setMembersLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Create dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newName, setNewName] = useState("")
  const [newDescription, setNewDescription] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  
  // Edit dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editName, setEditName] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  
  // Add user dialog
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Array<{ did: string; handle: string; displayName?: string; avatar?: string }>>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isAdding, setIsAdding] = useState(false)

  const loadStarterPacks = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const packs = await getStarterPacks()
      setStarterPacks(packs)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load starter packs")
    } finally {
      setIsLoading(false)
    }
  }, [getStarterPacks])

  const loadPackMembers = useCallback(async (listUri: string) => {
    setMembersLoading(true)
    try {
      const result = await getList(listUri)
      setPackMembers(result.items)
    } catch (err) {
      console.error("Failed to load pack members:", err)
    } finally {
      setMembersLoading(false)
    }
  }, [getList])

  const handleSelectPack = async (pack: StarterPack) => {
    setSelectedPack(pack)
    setEditName(pack.record.name)
    setEditDescription(pack.record.description || "")
    if (pack.list) {
      await loadPackMembers(pack.list.uri)
    }
  }

  const handleCreatePack = async () => {
    if (!newName.trim()) return
    
    setIsCreating(true)
    try {
      // Create starter pack with empty list (no 7 people requirement)
      await createStarterPack(newName, newDescription || undefined, [], [])
      setNewName("")
      setNewDescription("")
      setCreateDialogOpen(false)
      await loadStarterPacks()
    } catch (error) {
      console.error("Failed to create starter pack:", error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleEditPack = async () => {
    if (!selectedPack || !editName.trim()) return
    
    setIsEditing(true)
    try {
      await updateStarterPack(selectedPack.uri, editName, editDescription || undefined)
      setEditDialogOpen(false)
      await loadStarterPacks()
      // Refresh selected pack
      const updated = await getStarterPack(selectedPack.uri)
      setSelectedPack(updated)
    } catch (error) {
      console.error("Failed to update starter pack:", error)
    } finally {
      setIsEditing(false)
    }
  }

  const handleDeletePack = async (pack: StarterPack) => {
    if (!confirm(`Are you sure you want to delete "${pack.record.name}"?`)) return
    
    try {
      await deleteStarterPack(pack.uri)
      if (selectedPack?.uri === pack.uri) {
        setSelectedPack(null)
        setPackMembers([])
      }
      await loadStarterPacks()
    } catch (error) {
      console.error("Failed to delete starter pack:", error)
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

  const handleAddToPack = async (did: string) => {
    if (!selectedPack) return
    
    setIsAdding(true)
    try {
      await addToStarterPack(selectedPack.uri, did)
      setAddUserDialogOpen(false)
      setSearchQuery("")
      setSearchResults([])
      if (selectedPack.list) {
        await loadPackMembers(selectedPack.list.uri)
      }
    } catch (error) {
      console.error("Failed to add user to starter pack:", error)
    } finally {
      setIsAdding(false)
    }
  }

  const handleRemoveFromPack = async (did: string) => {
    if (!selectedPack) return
    
    try {
      await removeFromStarterPack(selectedPack.uri, did)
      setPackMembers((prev) => prev.filter(item => item.subject.did !== did))
    } catch (error) {
      console.error("Failed to remove from starter pack:", error)
    }
  }

  const getShareUrl = (pack: StarterPack) => {
    const rkey = pack.uri.split('/').pop()
    return `https://bsky.app/starter-pack/${pack.creator.handle}/${rkey}`
  }

  useEffect(() => {
    if (isAuthenticated) {
      loadStarterPacks()
    }
  }, [isAuthenticated, loadStarterPacks])

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <SignInPrompt title="Starter Packs" description="Sign in to create and manage starter packs" />
  }

  // Show selected pack details
  if (selectedPack) {
    return (
      <div className="min-h-screen">
        <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 items-center gap-4 px-4">
            <Button variant="ghost" size="icon" onClick={() => setSelectedPack(null)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-xl font-bold flex-1 truncate">{selectedPack.record.name}</h1>
            {selectedPack.creator.did === user?.did && (
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
                    onClick={() => handleDeletePack(selectedPack)}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </header>

        <main className="container max-w-2xl px-4 py-6">
          {/* Pack Info Card */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-4 rounded-full bg-primary/10">
                  <UsersRound className="h-8 w-8 text-primary" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold">{selectedPack.record.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    Created by @{selectedPack.creator.handle}
                  </p>
                  {selectedPack.record.description && (
                    <p className="mt-2 text-sm">{selectedPack.record.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                    <span>{packMembers.length} members</span>
                    {selectedPack.joinedAllTimeCount && (
                      <span>{selectedPack.joinedAllTimeCount} joined</span>
                    )}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(getShareUrl(selectedPack), '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View on Bluesky
                    </Button>
                    {selectedPack.creator.did === user?.did && (
                      <Dialog open={addUserDialogOpen} onOpenChange={setAddUserDialogOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm">
                            <UserPlus className="h-4 w-4 mr-2" />
                            Add People
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add People to Starter Pack</DialogTitle>
                            <DialogDescription>
                              Search for users to add to your starter pack.
                            </DialogDescription>
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
                                    onClick={() => handleAddToPack(actor.did)}
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
                                          <p className="font-semibold">{actor.displayName || actor.handle}</p>
                                          <p className="text-sm text-muted-foreground">@{actor.handle}</p>
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
            </CardContent>
          </Card>

          {/* Included Feeds */}
          {selectedPack.feeds && selectedPack.feeds.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Included Feeds</h3>
              <div className="space-y-2">
                {selectedPack.feeds.map((feed) => (
                  <Card key={feed.uri}>
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={feed.avatar || "/placeholder.svg"} />
                          <AvatarFallback>
                            <Rss className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{feed.displayName}</p>
                          {feed.description && (
                            <p className="text-sm text-muted-foreground line-clamp-1">{feed.description}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Members */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Members ({packMembers.length})</h3>
            {membersLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : packMembers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-muted-foreground">No members yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Add people to your starter pack to help others discover great accounts.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {packMembers.map((item) => (
                  <Card key={item.uri}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <Link href={`/profile/${item.subject.handle}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={item.subject.avatar || "/placeholder.svg"} />
                            <AvatarFallback>
                              {(item.subject.displayName || item.subject.handle).slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold">{item.subject.displayName || item.subject.handle}</p>
                            <p className="text-sm text-muted-foreground">@{item.subject.handle}</p>
                            {item.subject.description && (
                              <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                                {item.subject.description}
                              </p>
                            )}
                          </div>
                        </Link>
                        {selectedPack.creator.did === user?.did && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleRemoveFromPack(item.subject.did)}
                          >
                            <UserMinus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Starter Pack</DialogTitle>
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
              <Button onClick={handleEditPack} disabled={isEditing || !editName.trim()}>
                {isEditing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between px-4">
          <h1 className="text-xl font-bold">Starter Packs</h1>
          <div className="flex items-center gap-2">
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Create
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Starter Pack</DialogTitle>
                  <DialogDescription>
                    Create a starter pack to help new users discover great accounts and feeds.
                    You can add people after creating it.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="My Starter Pack"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description (optional)</Label>
                    <Textarea
                      id="description"
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      placeholder="What is this starter pack for?"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreatePack} disabled={isCreating || !newName.trim()}>
                    {isCreating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Create Starter Pack
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button onClick={loadStarterPacks} variant="ghost" size="icon" disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </header>

      <main className="container max-w-2xl px-4 py-6">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={loadStarterPacks} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </div>
        ) : starterPacks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-4 rounded-full bg-primary/10 mb-4">
              <UsersRound className="h-12 w-12 text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No Starter Packs Yet</h2>
            <p className="text-muted-foreground max-w-sm">
              Create a starter pack to help new users discover great accounts and feeds on Bluesky.
            </p>
            <Button 
              onClick={() => setCreateDialogOpen(true)} 
              className="mt-4"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Starter Pack
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {starterPacks.map((pack) => (
              <Card 
                key={pack.uri}
                className="cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => handleSelectPack(pack)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-full bg-primary/10">
                        <UsersRound className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{pack.record.name}</h3>
                        {pack.record.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {pack.record.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span>{pack.list?.listItemCount || 0} members</span>
                          {pack.joinedAllTimeCount && (
                            <span>{pack.joinedAllTimeCount} joined</span>
                          )}
                        </div>
                        {/* Sample members */}
                        {pack.listItemsSample && pack.listItemsSample.length > 0 && (
                          <div className="flex -space-x-2 mt-3">
                            {pack.listItemsSample.slice(0, 5).map((item) => (
                              <Avatar key={item.uri} className="h-8 w-8 border-2 border-background">
                                <AvatarImage src={item.subject.avatar || "/placeholder.svg"} />
                                <AvatarFallback className="text-xs">
                                  {(item.subject.displayName || item.subject.handle).slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                            {(pack.list?.listItemCount || 0) > 5 && (
                              <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium">
                                +{(pack.list?.listItemCount || 0) - 5}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    {pack.creator.did === user?.did && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation()
                            handleSelectPack(pack)
                            setEditDialogOpen(true)
                          }}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeletePack(pack)
                            }}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
