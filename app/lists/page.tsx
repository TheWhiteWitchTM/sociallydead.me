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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Loader2, RefreshCw, Plus, ListIcon, Shield, Users, MoreHorizontal, Pencil, Trash2, UserPlus, UserMinus } from "lucide-react"
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

interface List {
  uri: string
  cid: string
  name: string
  purpose: 'app.bsky.graph.defs#modlist' | 'app.bsky.graph.defs#curatelist'
  description?: string
  avatar?: string
  creator: {
    did: string
    handle: string
    displayName?: string
    avatar?: string
  }
  indexedAt: string
}

interface ListItem {
  uri: string
  subject: {
    did: string
    handle: string
    displayName?: string
    avatar?: string
    description?: string
  }
}

export default function ListsPage() {
  const { 
    isAuthenticated, 
    isLoading: authLoading, 
    user,
    getLists,
    getList,
    createList,
    updateList,
    deleteList,
    addToList,
    removeFromList,
    searchActors,
  } = useBluesky()
  
  const [lists, setLists] = useState<List[]>([])
  const [selectedList, setSelectedList] = useState<List | null>(null)
  const [listItems, setListItems] = useState<ListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [itemsLoading, setItemsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Create list dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newListName, setNewListName] = useState("")
  const [newListDescription, setNewListDescription] = useState("")
  const [newListPurpose, setNewListPurpose] = useState<'modlist' | 'curatelist'>('curatelist')
  const [isCreating, setIsCreating] = useState(false)
  
  // Edit list dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editListName, setEditListName] = useState("")
  const [editListDescription, setEditListDescription] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  
  // Add user dialog
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Array<{ did: string; handle: string; displayName?: string; avatar?: string }>>([])
  const [isSearching, setIsSearching] = useState(false)

  const loadLists = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const fetchedLists = await getLists()
      setLists(fetchedLists)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load lists")
    } finally {
      setIsLoading(false)
    }
  }, [getLists])

  const loadListItems = useCallback(async (listUri: string) => {
    setItemsLoading(true)
    try {
      const result = await getList(listUri)
      setListItems(result.items)
    } catch (err) {
      console.error("Failed to load list items:", err)
    } finally {
      setItemsLoading(false)
    }
  }, [getList])

  const handleCreateList = async () => {
    if (!newListName.trim()) return
    
    setIsCreating(true)
    try {
      await createList(newListName, newListPurpose, newListDescription || undefined)
      setNewListName("")
      setNewListDescription("")
      setNewListPurpose('curatelist')
      setCreateDialogOpen(false)
      await loadLists()
    } catch (error) {
      console.error("Failed to create list:", error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleEditList = async () => {
    if (!selectedList || !editListName.trim()) return
    
    setIsEditing(true)
    try {
      await updateList(selectedList.uri, editListName, editListDescription || undefined)
      setEditDialogOpen(false)
      await loadLists()
      // Update selected list
      setSelectedList({ ...selectedList, name: editListName, description: editListDescription })
    } catch (error) {
      console.error("Failed to update list:", error)
    } finally {
      setIsEditing(false)
    }
  }

  const handleDeleteList = async (list: List) => {
    if (!confirm(`Are you sure you want to delete "${list.name}"?`)) return
    
    try {
      await deleteList(list.uri)
      if (selectedList?.uri === list.uri) {
        setSelectedList(null)
        setListItems([])
      }
      await loadLists()
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
    if (!selectedList) return
    
    try {
      await addToList(selectedList.uri, did)
      setAddUserDialogOpen(false)
      setSearchQuery("")
      setSearchResults([])
      await loadListItems(selectedList.uri)
    } catch (error) {
      console.error("Failed to add user to list:", error)
    }
  }

  const handleRemoveFromList = async (itemUri: string) => {
    try {
      await removeFromList(itemUri)
      setListItems((prev) => prev.filter(item => item.uri !== itemUri))
    } catch (error) {
      console.error("Failed to remove from list:", error)
    }
  }

  const handleSelectList = (list: List) => {
    setSelectedList(list)
    setEditListName(list.name)
    setEditListDescription(list.description || "")
    loadListItems(list.uri)
  }

  useEffect(() => {
    if (isAuthenticated) {
      loadLists()
    }
  }, [isAuthenticated, loadLists])

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <SignInPrompt title="Lists" description="Sign in to manage your lists" />
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center justify-between px-4">
          <h1 className="text-xl font-bold">Lists</h1>
          <div className="flex items-center gap-2">
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New List
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New List</DialogTitle>
                  <DialogDescription>
                    Create a list to organize users you follow or want to moderate.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                      placeholder="My List"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description (optional)</Label>
                    <Textarea
                      id="description"
                      value={newListDescription}
                      onChange={(e) => setNewListDescription(e.target.value)}
                      placeholder="What is this list for?"
                    />
                  </div>
                  <div>
                    <Label>List Type</Label>
                    <RadioGroup value={newListPurpose} onValueChange={(v) => setNewListPurpose(v as 'modlist' | 'curatelist')}>
                      <div className="flex items-center space-x-2 mt-2">
                        <RadioGroupItem value="curatelist" id="curatelist" />
                        <Label htmlFor="curatelist" className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          User List - Organize users you want to follow
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="modlist" id="modlist" />
                        <Label htmlFor="modlist" className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Moderation List - Mute or block users
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateList} disabled={isCreating || !newListName.trim()}>
                    {isCreating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Create List
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button onClick={loadLists} variant="ghost" size="icon" disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </header>

      <main className="px-4 py-6">
        <div className="flex gap-6">
          {/* Lists */}
          <div className={`w-full lg:w-80 ${selectedList ? 'hidden lg:block' : ''}`}>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <p className="text-muted-foreground">{error}</p>
                <Button onClick={loadLists} variant="outline">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
              </div>
            ) : lists.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ListIcon className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No lists yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Create a list to organize users
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {lists.map((list) => {
                  const isSelected = selectedList?.uri === list.uri
                  const isModList = list.purpose === 'app.bsky.graph.defs#modlist'
                  
                  return (
                    <Card 
                      key={list.uri}
                      className={`cursor-pointer transition-colors ${isSelected ? 'bg-accent' : 'hover:bg-accent/50'}`}
                      onClick={() => handleSelectList(list)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${isModList ? 'bg-destructive/10' : 'bg-primary/10'}`}>
                              {isModList ? (
                                <Shield className="h-5 w-5 text-destructive" />
                              ) : (
                                <Users className="h-5 w-5 text-primary" />
                              )}
                            </div>
                            <div>
                              <p className="font-semibold">{list.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {isModList ? 'Moderation List' : 'User List'}
                              </p>
                            </div>
                          </div>
                          {list.creator.did === user?.did && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation()
                                  handleSelectList(list)
                                  setEditDialogOpen(true)
                                }}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteList(list)
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
                        {list.description && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {list.description}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>

          {/* List Items */}
          <div className={`flex-1 ${!selectedList ? 'hidden lg:flex lg:items-center lg:justify-center' : ''}`}>
            {!selectedList ? (
              <p className="text-muted-foreground">Select a list to view members</p>
            ) : (
              <div>
                <Card className="mb-4">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="lg:hidden"
                          onClick={() => setSelectedList(null)}
                        >
                          <ListIcon className="h-4 w-4" />
                        </Button>
                        <div>
                          <CardTitle>{selectedList.name}</CardTitle>
                          {selectedList.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {selectedList.description}
                            </p>
                          )}
                        </div>
                      </div>
                      {selectedList.creator.did === user?.did && (
                        <Dialog open={addUserDialogOpen} onOpenChange={setAddUserDialogOpen}>
                          <DialogTrigger asChild>
                            <Button size="sm">
                              <UserPlus className="h-4 w-4 mr-2" />
                              Add User
                            </Button>
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
                                          <div>
                                            <p className="font-semibold">{actor.displayName || actor.handle}</p>
                                            <p className="text-sm text-muted-foreground">@{actor.handle}</p>
                                          </div>
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
                  </CardHeader>
                </Card>

                {itemsLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : listItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <p className="text-muted-foreground">No users in this list</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Add users to organize your feed or moderation
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {listItems.map((item) => (
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
                            {selectedList.creator.did === user?.did && (
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleRemoveFromList(item.uri)}
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
            )}
          </div>
        </div>
      </main>

      {/* Edit List Dialog */}
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
                value={editListName}
                onChange={(e) => setEditListName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description (optional)</Label>
              <Textarea
                id="edit-description"
                value={editListDescription}
                onChange={(e) => setEditListDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditList} disabled={isEditing || !editListName.trim()}>
              {isEditing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
