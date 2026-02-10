"use client"

import { useState, useEffect } from "react"
import { useBluesky } from "@/lib/bluesky-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Pin,
  PinOff,
  Plus,
  GripVertical,
  Rss,
  Search,
  Check,
  Loader2,
  X
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface PinnedFeed {
  uri: string
  displayName: string
  description?: string
  avatar?: string
  pinned: boolean
  order: number
}

interface FeedManagerProps {
  onFeedsChange?: (feeds: PinnedFeed[]) => void
}

function SortableFeedItem({ feed, onUnpin }: { feed: PinnedFeed; onUnpin: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: feed.uri })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 p-3 bg-background border rounded-lg",
        isDragging && "shadow-lg"
      )}
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>
      {feed.avatar ? (
        <img src={feed.avatar} alt="" className="h-10 w-10 rounded-lg object-cover" />
      ) : (
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Rss className="h-5 w-5 text-primary" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate">{feed.displayName}</p>
        {feed.description && (
          <p className="text-xs text-muted-foreground truncate">{feed.description}</p>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={onUnpin}
        className="h-8 w-8 shrink-0"
      >
        <PinOff className="h-4 w-4" />
      </Button>
    </div>
  )
}

export function FeedManager({ onFeedsChange }: FeedManagerProps) {
  const { getSavedFeeds, getPopularFeeds } = useBluesky()
  const [pinnedFeeds, setPinnedFeeds] = useState<PinnedFeed[]>([])
  const [availableFeeds, setAvailableFeeds] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Load pinned feeds from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('pinnedFeeds')
    if (stored) {
      try {
        const feeds = JSON.parse(stored) as PinnedFeed[]
        setPinnedFeeds(feeds.sort((a, b) => a.order - b.order))
      } catch (e) {
        console.error('Failed to parse pinned feeds:', e)
      }
    }
  }, [])

  // Save to localStorage whenever pinnedFeeds change
  useEffect(() => {
    localStorage.setItem('pinnedFeeds', JSON.stringify(pinnedFeeds))
    if (onFeedsChange) {
      onFeedsChange(pinnedFeeds)
    }
  }, [pinnedFeeds, onFeedsChange])

  // Load available feeds when dialog opens
  useEffect(() => {
    if (dialogOpen) {
      loadAvailableFeeds()
    }
  }, [dialogOpen])

  const loadAvailableFeeds = async () => {
    setIsLoading(true)
    try {
      const [saved, popular] = await Promise.all([
        getSavedFeeds(),
        getPopularFeeds().catch(() => ({ feeds: [] }))
      ])

      // Combine and deduplicate
      const allFeeds = [...saved, ...(popular.feeds || [])]
      const uniqueFeeds = Array.from(
        new Map(allFeeds.map(feed => [feed.uri, feed])).values()
      )
      setAvailableFeeds(uniqueFeeds)
    } catch (error) {
      console.error('Failed to load feeds:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setPinnedFeeds((items) => {
        const oldIndex = items.findIndex((item) => item.uri === active.id)
        const newIndex = items.findIndex((item) => item.uri === over.id)

        const reordered = arrayMove(items, oldIndex, newIndex)
        // Update order property
        return reordered.map((item, index) => ({ ...item, order: index }))
      })
    }
  }

  const handlePinFeed = (feed: any) => {
    if (pinnedFeeds.some(f => f.uri === feed.uri)) return

    const newFeed: PinnedFeed = {
      uri: feed.uri,
      displayName: feed.displayName || feed.name || 'Feed',
      description: feed.description,
      avatar: feed.avatar,
      pinned: true,
      order: pinnedFeeds.length,
    }

    setPinnedFeeds([...pinnedFeeds, newFeed])
  }

  const handleUnpinFeed = (uri: string) => {
    const updated = pinnedFeeds.filter(f => f.uri !== uri)
    // Reorder
    setPinnedFeeds(updated.map((f, i) => ({ ...f, order: i })))
  }

  const filteredFeeds = availableFeeds.filter(feed => {
    const name = feed.displayName || feed.name || ''
    const desc = feed.description || ''
    const query = searchQuery.toLowerCase()
    return (
      name.toLowerCase().includes(query) ||
      desc.toLowerCase().includes(query)
    )
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Pinned Feeds</h3>
          <p className="text-sm text-muted-foreground">
            Customize your home feed tabs. Drag to reorder.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Feed
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>Add Feed to Home</DialogTitle>
              <DialogDescription>
                Pin feeds to show them as tabs on your home screen
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search feeds..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              <ScrollArea className="h-[400px] border rounded-lg">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredFeeds.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Rss className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No feeds found</p>
                  </div>
                ) : (
                  <div className="p-2 space-y-2">
                    {filteredFeeds.map((feed) => {
                      const isPinned = pinnedFeeds.some(f => f.uri === feed.uri)

                      return (
                        <Card
                          key={feed.uri}
                          className={cn(
                            "cursor-pointer hover:bg-accent/50 transition-colors",
                            isPinned && "opacity-50"
                          )}
                          onClick={() => !isPinned && handlePinFeed(feed)}
                        >
                          <CardContent className="p-3 flex items-center gap-3">
                            {feed.avatar ? (
                              <img src={feed.avatar} alt="" className="h-10 w-10 rounded-lg object-cover" />
                            ) : (
                              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Rss className="h-5 w-5 text-primary" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold truncate">{feed.displayName || feed.name}</p>
                              {feed.description && (
                                <p className="text-xs text-muted-foreground line-clamp-1">{feed.description}</p>
                              )}
                              {feed.creator && (
                                <p className="text-xs text-muted-foreground">
                                  by @{feed.creator.handle}
                                </p>
                              )}
                            </div>
                            {isPinned ? (
                              <Badge variant="secondary" className="shrink-0">
                                <Check className="h-3 w-3 mr-1" />
                                Pinned
                              </Badge>
                            ) : (
                              <Button variant="outline" size="sm" className="shrink-0">
                                <Pin className="h-3 w-3 mr-1" />
                                Pin
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </ScrollArea>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {pinnedFeeds.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Pin className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">No pinned feeds yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Pin your favorite feeds to see them as tabs on your home screen
            </p>
            <Button variant="outline" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Feed
            </Button>
          </CardContent>
        </Card>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={pinnedFeeds.map(f => f.uri)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {pinnedFeeds.map((feed) => (
                <SortableFeedItem
                  key={feed.uri}
                  feed={feed}
                  onUnpin={() => handleUnpinFeed(feed.uri)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {pinnedFeeds.length > 0 && (
        <p className="text-xs text-muted-foreground">
          💡 Tip: Drag feeds to reorder them. The order here determines the tab order on your home screen.
        </p>
      )}
    </div>
  )
}
