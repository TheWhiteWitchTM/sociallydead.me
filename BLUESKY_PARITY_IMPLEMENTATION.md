# 🎯 Bluesky Feature Parity Implementation Guide

This guide will bring your Lists, Feeds, and Starter Packs management to **full Bluesky parity** with profile pinning, reordering, and horizontal scrolling.

## 🎨 Core Changes Needed

### 1. **Horizontal Scrolling for Tabs** (Like Bluesky)

Both profile tabs and home feed tabs need to scroll horizontally when content overflows.

**Files to Update:**
- `app/page.tsx` - Home feed tabs
- `app/profile/[handle]/page.tsx` - Profile tabs

**CSS Changes:**

Replace the TabsList with this pattern:
```tsx
<div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
  <TabsList className="inline-flex w-max min-w-full">
    {/* tabs here */}
  </TabsList>
</div>
```

Add to `globals.css`:
```css
/* Hide scrollbar but keep functionality */
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* Smooth scroll */
.scrollbar-hide {
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
}
```

---

### 2. **Profile Pinned Items System**

Store pinned feeds, lists, and starter packs in Bluesky preferences.

#### **Data Structure:**

```typescript
interface PinnedItem {
  uri: string
  type: 'feed' | 'list' | 'starterpack'
  order: number
}

interface ProfilePreferences {
  pinnedItems: PinnedItem[]
}
```

#### **API Methods Needed:**

Add to `lib/bluesky-context.tsx`:

```typescript
const getProfilePreferences = async (): Promise<ProfilePreferences> => {
  if (!agent) throw new Error("Not authenticated")

  try {
    const prefs = await agent.app.bsky.actor.getPreferences()
    // Look for sociallydead.profile lexicon
    const profilePref = prefs.preferences.find(
      (p: any) => p.$type === 'me.sociallydead.profile'
    )

    return profilePref?.pinnedItems || { pinnedItems: [] }
  } catch {
    return { pinnedItems: [] }
  }
}

const saveProfilePreferences = async (pinnedItems: PinnedItem[]) => {
  if (!agent) throw new Error("Not authenticated")

  const prefs = await agent.app.bsky.actor.getPreferences()

  // Remove old profile pref
  const filtered = prefs.preferences.filter(
    (p: any) => p.$type !== 'me.sociallydead.profile'
  )

  // Add new one
  filtered.push({
    $type: 'me.sociallydead.profile',
    pinnedItems,
  })

  await agent.app.bsky.actor.putPreferences({ preferences: filtered })
}

const pinToProfile = async (uri: string, type: 'feed' | 'list' | 'starterpack') => {
  const prefs = await getProfilePreferences()
  const existing = prefs.pinnedItems.find(item => item.uri === uri)

  if (existing) return // Already pinned

  prefs.pinnedItems.push({
    uri,
    type,
    order: prefs.pinnedItems.length,
  })

  await saveProfilePreferences(prefs.pinnedItems)
}

const unpinFromProfile = async (uri: string) => {
  const prefs = await getProfilePreferences()
  const filtered = prefs.pinnedItems.filter(item => item.uri !== uri)

  // Reorder
  const reordered = filtered.map((item, index) => ({ ...item, order: index }))

  await saveProfilePreferences(reordered)
}

const reorderPinnedItems = async (items: PinnedItem[]) => {
  const reordered = items.map((item, index) => ({ ...item, order: index }))
  await saveProfilePreferences(reordered)
}
```

---

### 3. **Enhanced Lists Page**

Add pinning functionality and better UI.

**Features to Add:**
- Pin/Unpin to profile button
- View list feed (posts from list members)
- Subscribe to others' lists
- List avatars (upload/edit)
- Share list link
- Drag-to-reorder when managing pinned lists

**Example Pin Button:**
```tsx
<Button
  variant={isPinned ? "secondary" : "outline"}
  size="sm"
  onClick={() => isPinned ? unpinFromProfile(list.uri) : pinToProfile(list.uri, 'list')}
>
  <Pin className={cn("h-4 w-4 mr-2", isPinned && "fill-current")} />
  {isPinned ? "Pinned to Profile" : "Pin to Profile"}
</Button>
```

---

### 4. **Enhanced Feeds Page**

Current `app/feeds/page.tsx` needs:
- Pin/unpin feeds
- Create custom feed generators (advanced)
- Subscribe to feeds
- Feed discovery with categories
- Trending feeds
- Feed likes
- Share feed

**Quick Additions:**

```tsx
// In each feed card
const [isPinned, setIsPinned] = useState(false)

// Load pinned status
useEffect(() => {
  getProfilePreferences().then(prefs => {
    setIsPinned(prefs.pinnedItems.some(item => item.uri === feed.uri))
  })
}, [feed.uri])

// Pin button
<Button
  variant={isPinned ? "secondary" : "outline"}
  size="icon"
  onClick={() => {
    if (isPinned) {
      unpinFromProfile(feed.uri)
      setIsPinned(false)
    } else {
      pinToProfile(feed.uri, 'feed')
      setIsPinned(true)
    }
  }}
>
  <Pin className={cn("h-4 w-4", isPinned && "fill-current")} />
</Button>
```

---

### 5. **Enhanced Starter Packs Page**

Current `app/starter-packs/page.tsx` needs:
- Pin/unpin starter packs
- Featured starter packs
- Share starter pack
- View starter pack members inline
- Subscribe to starter pack (follow all members)

Same pin pattern as above.

---

### 6. **Profile Page Pinned Section**

Show pinned items on profile with ability to manage them.

**Location:** `app/profile/[handle]/page.tsx`

**Add After Profile Info Section:**

```tsx
{/* Pinned Items Section */}
{isOwnProfile && pinnedItems.length > 0 && (
  <div className="px-4 py-3 border-b">
    <div className="flex items-center justify-between mb-3">
      <h3 className="font-semibold text-sm">Pinned</h3>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setManagePinnedOpen(true)}
      >
        Manage
      </Button>
    </div>

    {/* Horizontal scrolling pinned items */}
    <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
      <div className="flex gap-3 w-max">
        {pinnedItems.map(item => (
          <PinnedItemCard key={item.uri} item={item} />
        ))}
      </div>
    </div>
  </div>
)}
```

**PinnedItemCard Component:**

```tsx
function PinnedItemCard({ item }: { item: PinnedItem & { data: any } }) {
  const Icon = item.type === 'feed' ? Rss : item.type === 'list' ? ListIcon : Package

  return (
    <Link href={getItemUrl(item)}>
      <Card className="w-[200px] hover:bg-accent/50 transition-colors cursor-pointer">
        <CardContent className="p-3">
          <div className="flex items-start gap-3">
            {item.data.avatar ? (
              <img src={item.data.avatar} className="h-10 w-10 rounded-lg object-cover" />
            ) : (
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon className="h-5 w-5 text-primary" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">
                {item.data.displayName || item.data.name}
              </p>
              <p className="text-xs text-muted-foreground capitalize">
                {item.type}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
```

---

### 7. **Manage Pinned Items Dialog**

Drag-and-drop reordering for pinned items.

```tsx
<Dialog open={managePinnedOpen} onOpenChange={setManagePinnedOpen}>
  <DialogContent className="max-w-2xl">
    <DialogHeader>
      <DialogTitle>Manage Pinned Items</DialogTitle>
      <DialogDescription>
        Drag to reorder your pinned feeds, lists, and starter packs
      </DialogDescription>
    </DialogHeader>

    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={pinnedItems.map(i => i.uri)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {pinnedItems.map(item => (
            <SortablePinnedItem
              key={item.uri}
              item={item}
              onUnpin={() => handleUnpin(item.uri)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>

    {pinnedItems.length === 0 && (
      <div className="text-center py-8 text-muted-foreground">
        <Pin className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No pinned items yet</p>
        <p className="text-sm mt-2">
          Pin feeds, lists, or starter packs to show them here
        </p>
      </div>
    )}
  </DialogContent>
</Dialog>
```

---

## 🚀 Implementation Steps

### Phase 1: Horizontal Scrolling (30 mins)
1. Update `app/page.tsx` feed tabs with scrolling
2. Update `app/profile/[handle]/page.tsx` tabs with scrolling
3. Add CSS to `globals.css`
4. Test on mobile and desktop

### Phase 2: Profile Preferences API (1 hour)
1. Add methods to `lib/bluesky-context.tsx`
2. Create custom lexicon for sociallydead profile prefs
3. Test save/load preferences
4. Export new methods in context

### Phase 3: Lists Enhancement (2 hours)
1. Add pin buttons to lists page
2. Add list feed view (posts from members)
3. Add list avatars
4. Add subscribe to list functionality
5. Add compose placeholder to list feed

### Phase 4: Feeds Enhancement (1 hour)
1. Add pin buttons to feeds page
2. Add feed categories/discovery
3. Improve feed search
4. Add compose placeholder (already done!)

### Phase 5: Starter Packs Enhancement (1 hour)
1. Add pin buttons
2. Add featured packs section
3. Add subscribe (follow all) button
4. Improve pack creation flow

### Phase 6: Profile Pinned Section (2 hours)
1. Add pinned items section to profile
2. Create PinnedItemCard component
3. Load pinned data from preferences
4. Add horizontal scrolling
5. Show only on own profile

### Phase 7: Manage Pinned Dialog (1 hour)
1. Create manage dialog with drag-drop
2. Add reorder functionality
3. Add unpin functionality
4. Save to preferences on change

---

## 📱 UI/UX Guidelines (Bluesky Style)

### Tabs:
- Use `inline-flex w-max` for horizontal overflow
- Smooth scroll behavior
- No visible scrollbar
- Touch-friendly on mobile

### Pinned Items:
- Horizontal scrolling cards
- 200px width per card
- Show icon, name, and type
- Tap to navigate

### Pin Buttons:
- Use Pin icon from lucide-react
- Fill icon when pinned
- Show "Pinned to Profile" text when pinned
- Use secondary variant when pinned

### Management:
- Drag handle (GripVertical icon)
- Smooth animations
- Immediate feedback
- Save on every change

---

## 🎨 Example Code: Complete Horizontal Tab Scroll

```tsx
// In app/page.tsx and app/profile/[handle]/page.tsx

<div className="relative">
  {/* Scrollable tabs container */}
  <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
    <TabsList className="inline-flex w-max min-w-full h-12 bg-transparent border-b rounded-none">
      <TabsTrigger
        value="tab1"
        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
      >
        Tab 1
      </TabsTrigger>
      {/* More tabs */}
    </TabsList>
  </div>

  {/* Optional: Fade indicators on edges */}
  <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent pointer-events-none" />
  <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none" />
</div>
```

---

## ✅ Checklist

### Horizontal Scrolling:
- [ ] Home page feed tabs scroll horizontally
- [ ] Profile page tabs scroll horizontally
- [ ] Smooth scroll on mobile
- [ ] No visible scrollbar
- [ ] Works with touch gestures

### Profile Preferences:
- [ ] Can save pinned items to preferences
- [ ] Can load pinned items from preferences
- [ ] Preferences sync across devices
- [ ] Can reorder pinned items
- [ ] Can unpin items

### Lists:
- [ ] Can pin/unpin lists to profile
- [ ] Can view list as feed
- [ ] Can edit list details
- [ ] Can add/remove members
- [ ] Can delete lists
- [ ] Can upload list avatar
- [ ] Shows pinned status

### Feeds:
- [ ] Can pin/unpin feeds to profile
- [ ] Can save/unsave feeds
- [ ] Can search feeds
- [ ] Can create custom feeds (advanced)
- [ ] Shows pinned status
- [ ] Compose placeholder works

### Starter Packs:
- [ ] Can pin/unpin packs to profile
- [ ] Can create packs
- [ ] Can edit packs
- [ ] Can delete packs
- [ ] Can subscribe to pack (follow all)
- [ ] Shows pinned status

### Profile Page:
- [ ] Shows pinned section on own profile
- [ ] Pinned items scroll horizontally
- [ ] Can manage pinned items
- [ ] Can reorder via drag-drop
- [ ] Can unpin from management dialog

---

## 🔮 Future Enhancements

1. **Custom Feed Builder** - Visual algorithm creator
2. **List Analytics** - Member growth, engagement stats
3. **Starter Pack Templates** - Pre-made packs for categories
4. **Feed Mixing** - Combine multiple feeds into one
5. **Auto-Lists** - Lists that auto-add based on criteria
6. **Feed Notifications** - Get notified for specific feeds
7. **List Feeds** - Create a feed from a list

---

## 💡 Pro Tips

1. Use `@dnd-kit` for all drag-drop (already installed!)
2. Store preferences in Bluesky, not localStorage
3. Use horizontal scroll for mobile-first design
4. Add loading skeletons for better UX
5. Cache pinned data in React state
6. Debounce preference saves
7. Add optimistic updates for instant feedback

---

This brings you to **100% Bluesky parity** for Lists, Feeds, and Starter Packs! 🎉

**Estimated Total Time:** 8-10 hours of focused development

**Priority Order:**
1. Horizontal scrolling (quick win)
2. Profile preferences API (foundation)
3. Pinning buttons everywhere (feature parity)
4. Profile pinned section (showcase)
5. Management dialog (polish)
