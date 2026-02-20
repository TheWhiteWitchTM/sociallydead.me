"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { useBluesky } from "@/lib/bluesky-context"
import { SignInPrompt } from "@/components/sign-in-prompt"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { VerifiedBadge } from "@/components/verified-badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, RefreshCw, Heart, Repeat2, UserPlus, AtSign, MessageCircle, Quote, CheckCheck, UserCheck, Users, Bell } from "lucide-react"
import { UserHoverCard } from "@/components/user-hover-card"
import { BlueskyContent } from "@/components/bluesky-content"

interface Notification {
  uri: string
  cid: string
  author: {
    did: string
    handle: string
    displayName?: string
    avatar?: string
  }
  reason: string
  reasonSubject?: string
  record: any // changed to any for easier access
  isRead: boolean
  indexedAt: string
}

interface GroupedNotification {
  key: string
  reason: string
  authors: Notification['author'][]
  reasonSubject?: string
  isRead: boolean
  indexedAt: string
  notifications: Notification[]
}

function groupNotifications(notifications: Notification[]): (GroupedNotification | Notification)[] {
  const result: (GroupedNotification | Notification)[] = []
  const groupableReasons = ['like', 'repost', 'follow']
  const groupMap = new Map<string, Notification[]>()
  const ungrouped: Notification[] = []

  for (const n of notifications) {
    if (!groupableReasons.includes(n.reason)) {
      ungrouped.push(n)
      continue
    }
    const key = n.reason === 'follow' ? `follow` : `${n.reason}:${n.reasonSubject || n.uri}`
    if (!groupMap.has(key)) {
      groupMap.set(key, [])
    }
    groupMap.get(key)!.push(n)
  }

  const allItems: (GroupedNotification | Notification)[] = []

  for (const [key, notifs] of groupMap) {
    notifs.sort((a, b) => new Date(b.indexedAt).getTime() - new Date(a.indexedAt).getTime())
    const seenDids = new Set<string>()
    const uniqueAuthors: Notification['author'][] = []
    for (const n of notifs) {
      if (!seenDids.has(n.author.did)) {
        seenDids.add(n.author.did)
        uniqueAuthors.push(n.author)
      }
    }
    allItems.push({
      key,
      reason: notifs[0].reason,
      authors: uniqueAuthors,
      reasonSubject: notifs[0].reasonSubject,
      isRead: notifs.every(n => n.isRead),
      indexedAt: notifs[0].indexedAt,
      notifications: notifs,
    })
  }

  for (const n of ungrouped) {
    allItems.push(n)
  }

  allItems.sort((a, b) => new Date(b.indexedAt).getTime() - new Date(a.indexedAt).getTime())

  return allItems
}

function isGrouped(item: GroupedNotification | Notification): item is GroupedNotification {
  return 'authors' in item
}

const notificationIcons: Record<string, typeof Heart> = {
  like: Heart,
  repost: Repeat2,
  follow: UserPlus,
  mention: AtSign,
  reply: MessageCircle,
  quote: Quote,
}

const notificationColors: Record<string, string> = {
  like: "text-red-500",
  repost: "text-green-500",
  follow: "text-primary",
  mention: "text-blue-500",
  reply: "text-primary",
  quote: "text-primary",
}

const notificationText: Record<string, string> = {
  like: "liked your post",
  repost: "reposted your post",
  follow: "followed you",
  mention: "mentioned you",
  reply: "replied to your post",
  quote: "quoted your post",
  "starterpack-joined": "joined your starter pack",
}

function parseAtUri(uri: string): { handle: string; rkey: string } | null {
  const match = uri.match(/at:\/\/([^/]+)\/app\.bsky\.feed\.post\/([^/]+)/)
  if (match) {
    return { handle: match[1], rkey: match[2] }
  }
  return null
}

export default function NotificationsPage() {
  const { isAuthenticated, isLoading: authLoading, getNotifications, markNotificationsRead, followUser, getProfile, user, getPost } = useBluesky()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [followingStatus, setFollowingStatus] = useState<Record<string, boolean>>({})
  const [followLoading, setFollowLoading] = useState<Record<string, boolean>>({})
  const [postPreviews, setPostPreviews] = useState<Record<string, string>>({})
  const [profileHandles, setProfileHandles] = useState<Record<string, string>>({})
  const [originalPosts, setOriginalPosts] = useState<Record<string, any>>({})
  const [quotedPosts, setQuotedPosts] = useState<Record<string, any>>({}) // New: full quoted posts for quote notifications
  const [followAllLoading, setFollowAllLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'mentions'>('all')

  const loadNotifications = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await getNotifications()
      setNotifications(result.notifications)

      // Following status (unchanged)
      try {
        const followNotifs = result.notifications.filter(n => n.reason === 'follow')
        const statusPromises = followNotifs.map(async n => {
          try {
            const profile = await getProfile(n.author.handle)
            return { did: n.author.did, following: !!profile.viewer?.following }
          } catch {
            return { did: n.author.did, following: false }
          }
        })
        const statuses = await Promise.all(statusPromises)
        const statusMap: Record<string, boolean> = {}
        statuses.forEach(s => statusMap[s.did] = s.following)
        setFollowingStatus(statusMap)
      } catch {}

      // Fetch full posts for likes/reposts/replies/quotes
      try {
        const postNotifs = result.notifications.filter(n =>
          n.reasonSubject && ['like', 'repost', 'reply', 'quote'].includes(n.reason)
        )

        const previewPromises = postNotifs.map(async n => {
          try {
            const post = await getPost(n.reasonSubject!)
            const parsed = parseAtUri(n.reasonSubject!)
            const authorHandle = post?.author?.handle || ''
            return {
              uri: n.reasonSubject!,
              text: post?.record?.text?.slice(0, 100) || 'View post',
              handle: authorHandle,
              rkey: parsed?.rkey || '',
              fullPost: post
            }
          } catch {
            return { uri: n.reasonSubject!, text: 'View post', handle: '', rkey: '', fullPost: null }
          }
        })

        const previews = await Promise.all(previewPromises)

        const previewMap: Record<string, string> = {}
        const handleMap: Record<string, string> = {}
        const postMap: Record<string, any> = {}

        previews.forEach(p => {
          previewMap[p.uri] = p.text
          if (p.handle) handleMap[p.uri] = p.handle
          if (p.fullPost) postMap[p.uri] = p.fullPost
        })

        setPostPreviews(previewMap)
        setProfileHandles(handleMap)
        setOriginalPosts(postMap)
      } catch {}

      // Special: For quotes, fetch the full quote post itself if needed
      try {
        const quoteNotifs = result.notifications.filter(n => n.reason === 'quote')
        const quotePromises = quoteNotifs.map(async n => {
          try {
            // The notification.record is the quote post - but may lack full embed hydration
            const quotePost = await getPost(n.uri) // fetch full quote post
            return { uri: n.uri, fullQuotedPost: quotePost }
          } catch {
            return { uri: n.uri, fullQuotedPost: null }
          }
        })

        const quoteResults = await Promise.all(quotePromises)
        const quoteMap: Record<string, any> = {}
        quoteResults.forEach(q => {
          if (q.fullQuotedPost) quoteMap[q.uri] = q.fullQuotedPost
        })
        setQuotedPosts(quoteMap)
      } catch {}

    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load notifications")
    } finally {
      setIsLoading(false)
    }
  }, [getNotifications, getProfile, getPost])

  // ... (handleMarkAllRead, handleFollowBack, filteredNotifications, groupedNotifications, unfollowedFollowers, handleFollowAllBack unchanged - omitted for brevity)

  useEffect(() => {
    if (isAuthenticated) {
      loadNotifications()
      markNotificationsRead().catch(console.error)
    }
  }, [isAuthenticated, loadNotifications, markNotificationsRead])

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <SignInPrompt title="Notifications" description="Sign in to see your notifications" />
  }

  return (
    <div className="min-h-screen">
      {/* Header unchanged */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        {/* ... full header code as in your original ... */}
      </header>

      <main className="mx-auto max-w-2xl px-0 sm:px-4 py-6">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={loadNotifications} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </div>
        ) : groupedNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground">
              {activeTab === 'mentions' ? 'No mentions yet' : 'No notifications yet'}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {activeTab === 'mentions'
                ? 'When someone mentions or replies to you, you\'ll see it here.'
                : 'When someone interacts with your posts, you\'ll see it here.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {groupedNotifications.map(item => {
              if (isGrouped(item)) {
                // Grouped (likes/reposts/follows) - unchanged, keep your original rendering
                const group = item
                const Icon = notificationIcons[group.reason] || Heart
                const colorClass = notificationColors[group.reason] || "text-muted-foreground"
                const count = group.authors.length
                const firstAuthor = group.authors[0]
                if (!firstAuthor) return null

                const othersCount = count - 1
                const reasonText = group.reason === 'follow'
                  ? (count === 1 ? 'followed you' : 'followed you')
                  : (notificationText[group.reason] || 'interacted with you')

                return (
                  <Card
                    key={group.key}
                    className={`transition-colors rounded-none sm:rounded-lg border-x-0 sm:border-x ${!group.isRead ? 'bg-primary/5 border-primary/20' : ''}`}
                  >
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex gap-3">
                        <div className={`mt-1 ${colorClass}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center mb-1.5">
                            <div className="flex -space-x-2">
                              {group.authors.slice(0, 6).map((author) => (
                                <UserHoverCard key={author.did} handle={author.handle}>
                                  <Link href={`/profile/${author.handle || author.did}`} className="relative block">
                                    <Avatar className="h-7 w-7 border-2 border-background cursor-pointer hover:opacity-80 transition-opacity">
                                      <AvatarImage src={author.avatar || "/placeholder.svg"} />
                                      <AvatarFallback className="text-[10px]">
                                        {(author.displayName || author.handle || '?').slice(0, 2).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <VerifiedBadge
                                      handle={author.handle}
                                      did={author.did}
                                      className="absolute -right-1 -bottom-1 scale-75 origin-bottom-right bg-background rounded-full p-0.5 border border-background shadow-sm"
                                    />
                                  </Link>
                                </UserHoverCard>
                              ))}
                              {count > 6 && (
                                <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] text-muted-foreground font-medium">
                                  +{count - 6}
                                </div>
                              )}
                            </div>
                          </div>

                          <p className="text-sm">
                            <UserHoverCard handle={firstAuthor.handle}>
                              <Link
                                href={`/profile/${firstAuthor.handle || firstAuthor.did}`}
                                className="font-semibold hover:underline"
                              >
                                {firstAuthor.displayName || firstAuthor.handle || 'Unknown'}
                              </Link>
                            </UserHoverCard>
                            {othersCount > 0 && (
                              <span className="text-muted-foreground">
                                {' '}and {othersCount} {othersCount === 1 ? 'other' : 'others'}
                              </span>
                            )}
                            <span className="text-muted-foreground ml-1">{reasonText}</span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(group.indexedAt), { addSuffix: true })}
                          </p>

                          {group.reasonSubject && ['like', 'repost'].includes(group.reason) && (
                            <Link
                              href={`/profile/${profileHandles[group.reasonSubject] || 'unknown'}/post/${parseAtUri(group.reasonSubject)?.rkey || ''}`}
                              className="block mt-2 p-2 rounded bg-muted/50 hover:bg-muted transition-colors"
                            >
                              <BlueskyContent
                                post={originalPosts[group.reasonSubject] || { record: { text: postPreviews[group.reasonSubject] || 'View post' } }}
                                className="text-sm"
                              />
                            </Link>
                          )}

                          {group.reason === 'follow' && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {group.authors.filter(a => user?.did !== a.did).slice(0, 3).map((author) => (
                                <div key={author.did}>
                                  {followingStatus[author.did] ? (
                                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                                      <UserCheck className="h-3 w-3" />
                                      {author.displayName || author.handle}
                                    </span>
                                  ) : (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-7 text-xs"
                                      onClick={() => handleFollowBack(author.did)}
                                      disabled={followLoading[author.did]}
                                    >
                                      {followLoading[author.did] ? (
                                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                      ) : (
                                        <UserPlus className="h-3 w-3 mr-1" />
                                      )}
                                      {author.displayName || author.handle}
                                    </Button>
                                  )}
                                </div>
                              ))}
                              {group.authors.filter(a => user?.did !== a.did).length > 3 && (
                                <span className="inline-flex items-center text-xs text-muted-foreground px-1">
                                  +{group.authors.filter(a => user?.did !== a.did).length - 3} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              }

              // Ungrouped (reply/mention/quote)
              const n = item as Notification
              if (!n?.author) return null

              const Icon = notificationIcons[n.reason] || Heart
              const colorClass = notificationColors[n.reason] || "text-muted-foreground"
              const actionText = notificationText[n.reason] || "interacted with you"

              const parsed = parseAtUri(n.uri)
              const handle = n.author.handle || parsed?.handle || ''
              const rkey = parsed?.rkey || ''

              const origUri = n.reasonSubject
              const origPost = origUri ? originalPosts[origUri] : null
              const origParsed = origUri ? parseAtUri(origUri) : null
              const origHandle = origUri ? (profileHandles[origUri] || origParsed?.handle || '') : ''
              const origRkey = origParsed?.rkey || ''
              const origFallback = postPreviews[origUri] || 'View post'

              // For quotes: use fetched full quote if available
              const quotePost = n.reason === 'quote' ? quotedPosts[n.uri] || n : n

              return (
                <Card
                  key={`${n.uri}-${n.indexedAt}`}
                  className={`transition-colors rounded-none sm:rounded-lg border-x-0 sm:border-x ${!n.isRead ? 'bg-primary/5 border-primary/20' : ''}`}
                >
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex gap-3">
                      <div className={`mt-1 ${colorClass}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <UserHoverCard handle={n.author.handle}>
                            <Link href={`/profile/${n.author.handle || n.author.did}`} className="relative block shrink-0">
                              <Avatar className="h-8 w-8 cursor-pointer hover:opacity-80 transition-opacity">
                                <AvatarImage src={n.author.avatar || "/placeholder.svg"} />
                                <AvatarFallback className="text-xs">
                                  {(n.author.displayName || n.author.handle || '?').slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              {n.author.handle && (
                                <VerifiedBadge
                                  handle={n.author.handle}
                                  did={n.author.did}
                                  className="absolute -right-1 -bottom-1 scale-75 origin-bottom-right bg-background rounded-full p-0.5 border border-background shadow-sm"
                                />
                              )}
                            </Link>
                          </UserHoverCard>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm">
                              <UserHoverCard handle={n.author.handle}>
                                <Link href={`/profile/${n.author.handle || n.author.did}`} className="font-semibold hover:underline">
                                  {n.author.displayName || n.author.handle || 'Unknown'}
                                </Link>
                              </UserHoverCard>
                              <span className="text-muted-foreground ml-1">{actionText}</span>
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(n.indexedAt), { addSuffix: true })}
                            </p>
                          </div>
                        </div>

                        {['reply', 'quote', 'mention'].includes(n.reason) && (
                          <div className="mt-2 space-y-3">
                            {/* Main content: reply / quote / mention */}
                            <Link
                              href={`/profile/${handle}/post/${rkey}`}
                              className="block rounded-lg border border-border hover:bg-accent/50 transition-colors overflow-hidden"
                            >
                              <BlueskyContent
                                post={quotePost} // Use full fetched quote for quote notifications
                                className="p-3"
                              />
                            </Link>

                            {/* Context: original post being replied to / quoted */}
                            {origUri && (
                              <Link
                                href={`/profile/${origHandle}/post/${origRkey}`}
                                className="block rounded bg-muted/40 hover:bg-muted/70 transition-colors overflow-hidden text-xs"
                              >
                                <div className="p-2">
                                  <span className="text-muted-foreground block mb-1">Replying to:</span>
                                  <BlueskyContent
                                    post={{
                                      uri: origUri,
                                      author: { handle: origHandle },
                                      record: origPost?.record || { text: origFallback },
                                      embed: origPost?.embed
                                    }}
                                    isQuoted={true}
                                    className="text-xs"
                                  />
                                </div>
                              </Link>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}