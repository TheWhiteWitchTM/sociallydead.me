# Bluesky Client Feature Implementation Guide

This guide contains all the code needed to implement the missing features identified in the audit.

## ✅ Completed: Feed Manager Component

The `components/feed-manager.tsx` component has been created with:
- Drag-and-drop feed reordering
- Pin/unpin feeds
- Feed search and discovery
- LocalStorage persistence

**Dependencies installed**: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`

---

## 🔴 HIGH PRIORITY IMPLEMENTATIONS

### 1. Home Feed Tabs with Pinned Feeds

**File**: `app/page.tsx`

Add after imports:
```typescript
import { ComposePlaceholder } from "@/components/compose-placeholder"

// Add state for pinned feeds
const [pinnedFeeds, setPinnedFeeds] = useState<any[]>([])

// Load pinned feeds on mount
useEffect(() => {
  const stored = localStorage.getItem('pinnedFeeds')
  if (stored) {
    try {
      setPinnedFeeds(JSON.parse(stored))
    } catch (e) {
      console.error('Failed to load pinned feeds:', e)
    }
  }
}, [])
```

Replace the Feed Tabs section (around line 397-424) with:
```tsx
{/* Feed Tabs - Now with Pinned Feeds */}
<Tabs value={activeTab} onValueChange={handleTabChange}>
  <div className="relative">
    <TabsList className="w-full justify-start mb-4 overflow-x-auto flex-nowrap">
      <TabsTrigger value="following" className="gap-1.5">
        <Users className="h-4 w-4" />
        <span className="hidden sm:inline">Following</span>
      </TabsTrigger>

      {/* Dynamically add pinned feeds */}
      {pinnedFeeds.map((feed) => (
        <TabsTrigger key={feed.uri} value={feed.uri} className="gap-1.5">
          {feed.avatar && <img src={feed.avatar} className="h-4 w-4 rounded" />}
          <span className="hidden sm:inline">{feed.displayName}</span>
        </TabsTrigger>
      ))}

      <TabsTrigger value="all" className="gap-1.5">
        <Sparkles className="h-4 w-4" />
        <span className="hidden sm:inline">Discover</span>
      </TabsTrigger>
    </TabsList>

    {/* Settings button for managing feeds */}
    <Button
      variant="ghost"
      size="icon"
      className="absolute right-0 top-0 h-9 w-9"
      onClick={() => router.push('/settings/feeds')}
    >
      <Settings className="h-4 w-4" />
    </Button>
  </div>
</Tabs>

{/* Compose Placeholder */}
<ComposePlaceholder
  placeholder="What's happening?"
  onSuccess={() => handleTabChange(activeTab)}
/>
```

Update `handleTabChange` function:
```typescript
const handleTabChange = useCallback((tab: string) => {
  setActiveTab(tab)
  setNewPostsAvailable(false)

  // Check if it's a pinned feed
  const pinnedFeed = pinnedFeeds.find(f => f.uri === tab)

  if (pinnedFeed) {
    loadFeed(pinnedFeed.uri)
  } else {
    switch (tab) {
      case "following":
        loadTimeline()
        break
      case "all":
        loadFeed(KNOWN_FEEDS.whats_hot)
        break
      default:
        loadTimeline()
    }
  }
}, [loadTimeline, loadFeed, pinnedFeeds])
```

---

### 2. Feed Management Settings Page

**File**: `app/settings/feeds/page.tsx` (NEW)

```typescript
"use client"

import { FeedManager } from "@/components/feed-manager"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function FeedSettingsPage() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="flex h-14 items-center gap-4 px-4">
          <Link href="/settings">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-lg font-bold">Feed Settings</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <FeedManager />
      </main>
    </div>
  )
}
```

Update `app/settings/page.tsx` to add link:
```typescript
// Add to settings options
<Link href="/settings/feeds">
  <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
    <CardContent className="p-4 flex items-center gap-3">
      <Rss className="h-5 w-5" />
      <div className="flex-1">
        <p className="font-semibold">Feed Management</p>
        <p className="text-sm text-muted-foreground">
          Pin and organize your home feeds
        </p>
      </div>
    </CardContent>
  </Card>
</Link>
```

---

### 3. Alt-Text Editor for Images

**File**: `components/compose-input.tsx`

Update the `MediaFile` type (around line 52):
```typescript
export type MediaFile = {
  file: File
  preview: string
  type: "image" | "video"
  alt?: string  // Add this field
}
```

Add alt-text edit dialog state and handler:
```typescript
// Add after line 160
const [editingAltIndex, setEditingAltIndex] = useState<number | null>(null)
const [tempAltText, setTempAltText] = useState("")

const handleEditAlt = (index: number) => {
  setEditingAltIndex(index)
  setTempAltText(mediaFiles[index]?.alt || "")
}

const handleSaveAlt = () => {
  if (editingAltIndex !== null) {
    const updated = [...mediaFiles]
    updated[editingAltIndex] = {
      ...updated[editingAltIndex],
      alt: tempAltText
    }
    onMediaFilesChange(updated)
    setEditingAltIndex(null)
    setTempAltText("")
  }
}
```

Update media preview section (around line 1206):
```tsx
{/* Media Previews - Below toolbar */}
{mediaFiles.length > 0 && (
  <div className={cn(
    "gap-2",
    hasVideo ? "flex" : "grid grid-cols-2"
  )}>
    {mediaFiles.map((media, index) => (
      <div key={index} className="relative group">
        {media.type === "image" ? (
          <>
            <img
              src={media.preview}
              alt={media.alt || `Upload ${index + 1}`}
              className="w-full h-32 object-cover rounded-lg border cursor-pointer"
              onClick={() => handleEditAlt(index)}
            />
            {/* Alt-text badge */}
            {media.alt ? (
              <Badge
                variant="secondary"
                className="absolute bottom-2 left-2 text-xs"
              >
                ALT
              </Badge>
            ) : (
              <Badge
                variant="destructive"
                className="absolute bottom-2 left-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
              >
                Add ALT
              </Badge>
            )}
          </>
        ) : (
          // Video preview...
        )}
        <Button
          variant="destructive"
          size="icon"
          className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => removeMedia(index)}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    ))}
  </div>
)}

{/* Alt-Text Editor Dialog */}
<Dialog open={editingAltIndex !== null} onOpenChange={(open) => !open && setEditingAltIndex(null)}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Add Alt Text</DialogTitle>
      <DialogDescription>
        Describe this image for people using screen readers
      </DialogDescription>
    </DialogHeader>
    {editingAltIndex !== null && (
      <div className="space-y-4">
        <img
          src={mediaFiles[editingAltIndex]?.preview}
          alt="Preview"
          className="w-full rounded-lg border max-h-64 object-contain"
        />
        <Textarea
          placeholder="Describe what's in this image..."
          value={tempAltText}
          onChange={(e) => setTempAltText(e.target.value)}
          rows={3}
          maxLength={1000}
        />
        <p className="text-xs text-muted-foreground">
          {tempAltText.length}/1000 characters
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setEditingAltIndex(null)}>
            Cancel
          </Button>
          <Button onClick={handleSaveAlt}>
            Save Alt Text
          </Button>
        </div>
      </div>
    )}
  </DialogContent>
</Dialog>
```

---

### 4. Add `getPopularFeeds` to Bluesky Context

**File**: `lib/bluesky-context.tsx`

Add this method around line 1100 (near other feed methods):
```typescript
const getPopularFeeds = async () => {
  try {
    const agentToUse = agent || publicAgent
    const response = await agentToUse.app.bsky.unspecced.getPopularFeedGenerators({ limit: 50 })
    return {
      feeds: response.data.feeds.map((feed: any) => ({
        uri: feed.uri,
        cid: feed.cid,
        creator: {
          did: feed.creator.did,
          handle: feed.creator.handle,
          displayName: feed.creator.displayName,
          avatar: feed.creator.avatar,
        },
        displayName: feed.displayName,
        description: feed.description,
        avatar: feed.avatar,
        likeCount: feed.likeCount,
      }))
    }
  } catch (error) {
    console.error("Failed to get popular feeds:", error)
    return { feeds: [] }
  }
}
```

Add to the context value export (around line 1400):
```typescript
value={{
  // ... existing exports
  getPopularFeeds,
}}
```

---

## 🟡 MEDIUM PRIORITY

### 5. Muted Words Implementation

**File**: `app/settings/muted-words/page.tsx` (NEW)

```typescript
"use client"

import { useState, useEffect } from "react"
import { useBluesky } from "@/lib/bluesky-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Trash2, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface MutedWord {
  value: string
  targets: ('content' | 'tag')[]
}

export default function MutedWordsPage() {
  const { agent } = useBluesky()
  const [mutedWords, setMutedWords] = useState<MutedWord[]>([])
  const [newWord, setNewWord] = useState("")
  const [targetContent, setTargetContent] = useState(true)
  const [targetTags, setTargetTags] = useState(true)

  useEffect(() => {
    loadMutedWords()
  }, [])

  const loadMutedWords = async () => {
    try {
      const prefs = await agent.getPreferences()
      const moderationPrefs = prefs.moderationPrefs as any
      setMutedWords(moderationPrefs?.mutedWords || [])
    } catch (error) {
      console.error("Failed to load muted words:", error)
    }
  }

  const addMutedWord = async () => {
    if (!newWord.trim()) return

    const targets: ('content' | 'tag')[] = []
    if (targetContent) targets.push('content')
    if (targetTags) targets.push('tag')

    if (targets.length === 0) return

    const updated = [...mutedWords, { value: newWord.trim(), targets }]

    try {
      await agent.setPersonalDetailsMutedWords(updated)
      setMutedWords(updated)
      setNewWord("")
      setTargetContent(true)
      setTargetTags(true)
    } catch (error) {
      console.error("Failed to add muted word:", error)
    }
  }

  const removeMutedWord = async (index: number) => {
    const updated = mutedWords.filter((_, i) => i !== index)
    try {
      await agent.setPersonalDetailsMutedWords(updated)
      setMutedWords(updated)
    } catch (error) {
      console.error("Failed to remove muted word:", error)
    }
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="flex h-14 items-center gap-4 px-4">
          <Link href="/settings">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-lg font-bold">Muted Words</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-2">Muted Words & Tags</h2>
            <p className="text-sm text-muted-foreground">
              Posts containing these words will be hidden from your feeds
            </p>
          </div>

          {/* Add new muted word */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <Input
                placeholder="Word or phrase to mute..."
                value={newWord}
                onChange={(e) => setNewWord(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addMutedWord()}
              />

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={targetContent}
                    onCheckedChange={(checked) => setTargetContent(!!checked)}
                  />
                  <span className="text-sm">Mute in post text</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={targetTags}
                    onCheckedChange={(checked) => setTargetTags(!!checked)}
                  />
                  <span className="text-sm">Mute in hashtags</span>
                </label>
              </div>

              <Button onClick={addMutedWord} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Muted Word
              </Button>
            </CardContent>
          </Card>

          {/* List of muted words */}
          <div className="space-y-2">
            {mutedWords.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  No muted words yet
                </CardContent>
              </Card>
            ) : (
              mutedWords.map((word, index) => (
                <Card key={index}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{word.value}</span>
                      <div className="flex gap-1">
                        {word.targets.includes('content') && (
                          <Badge variant="secondary" className="text-xs">Content</Badge>
                        )}
                        {word.targets.includes('tag') && (
                          <Badge variant="secondary" className="text-xs">Tags</Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeMutedWord(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
```

---

### 6. Filter Posts by Muted Words

**File**: `components/feed.tsx` (or wherever posts are rendered)

Add this utility function:
```typescript
const shouldHidePost = (post: any, mutedWords: MutedWord[]): boolean => {
  if (!mutedWords || mutedWords.length === 0) return false

  const text = post.record?.text?.toLowerCase() || ''

  for (const muted of mutedWords) {
    const word = muted.value.toLowerCase()

    // Check content
    if (muted.targets.includes('content') && text.includes(word)) {
      return true
    }

    // Check hashtags
    if (muted.targets.includes('tag')) {
      const hashtagRegex = /#(\w+)/g
      const hashtags = [...text.matchAll(hashtagRegex)].map(m => m[1].toLowerCase())
      if (hashtags.some(tag => tag.includes(word))) {
        return true
      }
    }
  }

  return false
}

// Use it when rendering posts:
const filteredPosts = posts.filter(post => !shouldHidePost(post, mutedWords))
```

---

## 🚀 INNOVATIVE FEATURES

### 7. Inline Compose Placeholders

Already created in `components/compose-placeholder.tsx`!

Add to feed pages:
```typescript
import { ComposePlaceholder } from "@/components/compose-placeholder"

// In your feed component:
<ComposePlaceholder
  placeholder="What's happening?"
  onSuccess={() => loadFeed()}
/>
```

---

## 📦 PACKAGES TO INSTALL

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities  # Already done ✅
```

---

## 🎯 TESTING CHECKLIST

### Feed Management
- [ ] Can pin feeds from settings
- [ ] Can drag to reorder pinned feeds
- [ ] Can unpin feeds
- [ ] Pinned feeds appear as tabs on home
- [ ] Feed order persists after reload
- [ ] Can search for feeds to pin

### Alt-Text
- [ ] Click image in composer to edit alt-text
- [ ] Alt-text badge shows on images with alt-text
- [ ] Alt-text is sent with image upload
- [ ] Alt-text appears in post image previews

### Muted Words
- [ ] Can add muted words
- [ ] Can specify content/tag targets
- [ ] Can remove muted words
- [ ] Posts with muted words are hidden
- [ ] Muted words persist after reload

### Inline Compose
- [ ] Placeholder appears on feed pages
- [ ] Expands to full composer on click
- [ ] Can post directly from feed
- [ ] Feed refreshes after posting
- [ ] Collapses after successful post

---

## 🔮 NEXT STEPS

After implementing these features, consider:

1. **Polls** - Major engagement feature
2. **Thread Composer** - Better thread creation UX
3. **Labelers** - Moderation services
4. **Notification Preferences** - Granular control
5. **Advanced Search** - Better discovery

Refer to the comprehensive audit document for detailed implementation guidance on these features.

---

## 💡 TIPS

- Test on mobile viewports
- Consider accessibility (keyboard navigation, screen readers)
- Add loading states for async operations
- Handle errors gracefully
- Add confirmation dialogs for destructive actions
- Consider rate limits when polling/refreshing

---

## 📝 NOTES

- Feed pinning uses localStorage (client-side only)
- Consider moving to user preferences (server-side) for cross-device sync
- Alt-text implementation follows Bluesky's accessibility guidelines
- Muted words use Bluesky's preferences API
- All implementations follow existing code patterns in the project
