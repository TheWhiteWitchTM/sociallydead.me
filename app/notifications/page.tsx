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
  record: unknown
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
  // Group by reason + reasonSubject (for likes/reposts) or just reason (for follows)
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

  // Merge groups and ungrouped notifications, sorted by latest indexedAt
  const allItems: (GroupedNotification | Notification)[] = []

  for (const [key, notifs] of groupMap) {
    // Sort within group by time (newest first)
    notifs.sort((a, b) => new Date(b.indexedAt).getTime() - new Date(a.indexedAt).getTime())
    // Deduplicate authors by DID
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

  // Sort everything by time (newest first)
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

// Helper to parse AT URI and get profile handle and post rkey
function parseAtUri(uri: string): { handle: string; rkey: string } | null {
  // Format: at://did:plc:xxx/app.bsky.feed.post/rkey
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
  const [followAllLoading, setFollowAllLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'mentions'>('all')

  const loadNotifications = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await getNotifications()
      setNotifications(result.notifications)
      
      // Load following status for follow notifications (don't crash if individual lookups fail)
      try {
        const followNotifs = result.notifications.filter((n: Notification) => n.reason === 'follow')
        const statusPromises = followNotifs.map(async (n: Notification) => {
          try {
            const profile = await getProfile(n.author.handle)
            return { did: n.author.did, following: !!profile.viewer?.following }
          } catch {
            return { did: n.author.did, following: false }
          }
        })
        const statuses = await Promise.all(statusPromises)
        const statusMap: Record<string, boolean> = {}
        statuses.forEach(s => { statusMap[s.did] = s.following })
        setFollowingStatus(statusMap)
      } catch {
        // Silently fail - follow status is non-critical
      }
      
      // Load post previews for like/repost/reply/quote notifications
      try {
        const postNotifs = result.notifications.filter((n: Notification) => 
          n.reasonSubject && ['like', 'repost', 'reply', 'quote'].includes(n.reason)
        )
        const previewPromises = postNotifs.map(async (n: Notification) => {
          try {
            const post = await getPost(n.reasonSubject!) as { record?: { text?: string }; author?: { handle?: string } }
            const parsed = parseAtUri(n.reasonSubject!)
            const authorHandle = post?.author?.handle || ''
            return { 
              uri: n.reasonSubject!, 
              text: post?.record?.text?.slice(0, 100) || 'View post',
              handle: authorHandle,
              rkey: parsed?.rkey || ''
            }
          } catch {
            return { uri: n.reasonSubject!, text: 'View post', handle: '', rkey: '' }
          }
        })
        const previews = await Promise.all(previewPromises)
        const previewMap: Record<string, string> = {}
        const handleMap: Record<string, string> = {}
        previews.forEach(p => { 
          previewMap[p.uri] = p.text
          if (p.handle) handleMap[p.uri] = p.handle
        })
        setPostPreviews(previewMap)
        setProfileHandles(handleMap)
      } catch {
        // Silently fail - post previews are non-critical
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load notifications")
    } finally {
      setIsLoading(false)
    }
  }, [getNotifications, getProfile, getPost])

  const handleMarkAllRead = async () => {
    try {
      await markNotificationsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    } catch (error) {
      console.error("Failed to mark notifications as read:", error)
    }
  }

  const handleFollowBack = async (did: string) => {
    setFollowLoading(prev => ({ ...prev, [did]: true }))
    try {
      await followUser(did)
      setFollowingStatus(prev => ({ ...prev, [did]: true }))
    } catch (error) {
      console.error("Failed to follow:", error)
    } finally {
      setFollowLoading(prev => ({ ...prev, [did]: false }))
    }
  }

  // Filter notifications based on active tab, then group
  const filteredNotifications = activeTab === 'mentions' 
    ? notifications.filter(n => n.reason === 'mention' || n.reason === 'reply')
    : notifications

  const groupedNotifications = groupNotifications(filteredNotifications)

  // Get list of users who followed but we don't follow back
  const unfollowedFollowers = notifications
    .filter(n => n.reason === 'follow' && user?.did !== n.author?.did && !followingStatus[n.author?.did])
    .map(n => n.author)
    .filter(Boolean)
    // Remove duplicates by DID
    .filter((author, index, self) => 
      index === self.findIndex(a => a.did === author.did)
    )

  const handleFollowAllBack = async () => {
    if (unfollowedFollowers.length === 0) return
    
    setFollowAllLoading(true)
    try {
      for (const author of unfollowedFollowers) {
        try {
          await followUser(author.did)
          setFollowingStatus(prev => ({ ...prev, [author.did]: true }))
        } catch (error) {
          console.error(`Failed to follow ${author.handle}:`, error)
        }
      }
    } finally {
      setFollowAllLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      loadNotifications()
      // Auto-mark notifications as read when viewing the page
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
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center justify-between px-3 sm:px-4">
          <div className="flex items-center gap-2 sm:gap-4">
            <Bell className="h-5 w-5" />
            <h1 className="text-lg sm:text-xl font-bold">Notifications</h1>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'all' | 'mentions')}>
              <TabsList className="h-8">
                <TabsTrigger value="all" className="text-xs px-3">All</TabsTrigger>
                <TabsTrigger value="mentions" className="text-xs px-3">Mentions</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="flex items-center gap-2">
            {unfollowedFollowers.length > 0 && (
              <Button 
                onClick={handleFollowAllBack} 
                variant="outline" 
                size="sm" 
                className="hidden sm:flex"
                disabled={followAllLoading}
              >
                {followAllLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Users className="h-4 w-4 mr-2" />
                )}
                Follow all back ({unfollowedFollowers.length})
              </Button>
            )}
            <Button onClick={handleMarkAllRead} variant="ghost" size="sm" className="hidden sm:flex">
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark all read
            </Button>
            <Button onClick={handleMarkAllRead} variant="ghost" size="icon" className="sm:hidden">
              <CheckCheck className="h-4 w-4" />
            </Button>
            <Button onClick={loadNotifications} variant="ghost" size="icon" disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        {/* Mobile follow all back button */}
        {unfollowedFollowers.length > 0 && (
          <div className="sm:hidden px-4 pb-2">
            <Button 
              onClick={handleFollowAllBack} 
              variant="outline" 
              size="sm" 
              className="w-full"
              disabled={followAllLoading}
            >
              {followAllLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Users className="h-4 w-4 mr-2" />
              )}
              Follow all back ({unfollowedFollowers.length})
            </Button>
          </div>
        )}
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
            {groupedNotifications.map((item) => {
              if (isGrouped(item)) {
                // Grouped notification (likes, reposts, follows)
                const group = item
                const Icon = notificationIcons[group.reason] || Heart
                const colorClass = notificationColors[group.reason] || "text-muted-foreground"
                const count = group.authors.length
                const firstAuthor = group.authors[0]
                if (!firstAuthor) return null

                // Build "X and N others" text
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
                          {/* Stacked avatars */}
                          <div className="flex items-center mb-1.5">
                            <div className="flex -space-x-2">
                              {group.authors.slice(0, 6).map((author) => (
                                <Link key={author.did} href={`/profile/${author.handle || author.did}`} className="relative">
                                  <Avatar className="h-7 w-7 border-2 border-background cursor-pointer hover:opacity-80 transition-opacity">
                                    <AvatarImage src={author.avatar || "/placeholder.svg"} />
                                    <AvatarFallback className="text-[10px]">
                                      {(author.displayName || author.handle || '?').slice(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  {author.handle && (
                                    <VerifiedBadge 
                                      handle={author.handle} 
                                      did={author.did}
                                      className="absolute -right-1 -bottom-1 scale-75 origin-bottom-right bg-background rounded-full p-0.5 border border-background shadow-sm" 
                                    />
                                  )}
                                </Link>
                              ))}
                              {count > 6 && (
                                <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] text-muted-foreground font-medium">
                                  +{count - 6}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Description */}
                            <p className="text-sm">
                              <Link
                                href={`/profile/${firstAuthor.handle || firstAuthor.did}`}
                                className="font-semibold hover:underline"
                              >
                                {firstAuthor.displayName || firstAuthor.handle || 'Unknown'}
                              </Link>
                              {firstAuthor.handle && <VerifiedBadge handle={firstAuthor.handle} did={firstAuthor.did} className="ml-0.5" />}
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

                          {/* Post preview for likes/reposts */}
                          {group.reasonSubject && ['like', 'repost'].includes(group.reason) && (() => {
                            const parsed = parseAtUri(group.reasonSubject)
                            const handle = profileHandles[group.reasonSubject] || parsed?.handle || ''
                            const rkey = parsed?.rkey || ''
                            const previewText = postPreviews[group.reasonSubject] || 'View post'
                            return (
                              <Link 
                                href={`/profile/${handle}/post/${rkey}`}
                                className="block mt-2 p-2 rounded bg-muted/50 text-sm hover:bg-muted transition-colors"
                              >
                                <p className="text-foreground line-clamp-2">{previewText}{previewText.length >= 100 ? '...' : ''}</p>
                              </Link>
                            )
                          })()}

                          {/* Follow back buttons for grouped follows */}
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

              // Ungrouped notification (mentions, replies, quotes)
              const notification = item as Notification
              if (!notification?.author) return null
              
              const Icon = notificationIcons[notification.reason] || Heart
              const colorClass = notificationColors[notification.reason] || "text-muted-foreground"
              const text = notificationText[notification.reason] || "interacted with you"
              
              return (
                <Card 
                  key={`${notification.uri}-${notification.indexedAt}`}
                  className={`transition-colors rounded-none sm:rounded-lg border-x-0 sm:border-x ${!notification.isRead ? 'bg-primary/5 border-primary/20' : ''}`}
                >
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex gap-3">
                      <div className={`mt-1 ${colorClass}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Link href={`/profile/${notification.author.handle || notification.author.did}`} className="relative">
                            <Avatar className="h-8 w-8 cursor-pointer hover:opacity-80 transition-opacity">
                              <AvatarImage src={notification.author.avatar || "/placeholder.svg"} />
                              <AvatarFallback className="text-xs">
                                {(notification.author.displayName || notification.author.handle || '?').slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            {notification.author.handle && (
                              <VerifiedBadge 
                                handle={notification.author.handle} 
                                did={notification.author.did}
                                className="absolute -right-1 -bottom-1 scale-75 origin-bottom-right bg-background rounded-full p-0.5 border border-background shadow-sm" 
                              />
                            )}
                          </Link>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm">
                              <Link
                                href={`/profile/${notification.author.handle || notification.author.did}`}
                                className="font-semibold hover:underline"
                              >
                                {notification.author.displayName || notification.author.handle || 'Unknown'}
                              </Link>
                              {notification.author.handle && <VerifiedBadge handle={notification.author.handle} did={notification.author.did} className="ml-0.5" />}
                              <span className="text-muted-foreground ml-1">{text}</span>
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(notification.indexedAt), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        
                        {/* Show reply/quote content and link to the actual reply */}
                        {['reply', 'quote'].includes(notification.reason) && (() => {
                          // The notification's record contains the reply/quote text
                          const replyRecord = notification.record as { text?: string } | undefined
                          const replyText = replyRecord?.text || ''
                          
                          // The notification's URI is the reply/quote post itself
                          const replyParsed = parseAtUri(notification.uri)
                          const replyHandle = notification.author.handle || replyParsed?.handle || ''
                          const replyRkey = replyParsed?.rkey || ''
                          
                          // The reasonSubject is the original post that was replied to
                          const originalParsed = notification.reasonSubject ? parseAtUri(notification.reasonSubject) : null
                          const originalHandle = notification.reasonSubject ? (profileHandles[notification.reasonSubject] || originalParsed?.handle || '') : ''
                          const originalRkey = originalParsed?.rkey || ''
                          const originalText = notification.reasonSubject ? (postPreviews[notification.reasonSubject] || '') : ''
                          
                          return (
                            <div className="mt-2 space-y-1.5">
                              {/* The reply/quote itself - primary content */}
                              <Link 
                                href={`/profile/${replyHandle}/post/${replyRkey}`}
                                className="block p-2.5 rounded-lg border border-border bg-background text-sm hover:bg-accent/50 transition-colors"
                              >
                                <p className="text-foreground line-clamp-3">{replyText}</p>
                              </Link>
                              {/* The original post being replied to - context */}
                              {originalText && notification.reasonSubject && (
                                <Link 
                                  href={`/profile/${originalHandle}/post/${originalRkey}`}
                                  className="block p-2 rounded bg-muted/40 text-xs hover:bg-muted/70 transition-colors"
                                >
                                  <span className="text-muted-foreground">Replying to: </span>
                                  <span className="text-muted-foreground/80 line-clamp-1">{originalText}{originalText.length >= 100 ? '...' : ''}</span>
                                </Link>
                              )}
                            </div>
                          )
                        })()}
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
