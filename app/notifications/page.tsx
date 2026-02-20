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
  record: any
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
  const [followAllLoading, setFollowAllLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'mentions'>('all')

  const loadNotifications = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await getNotifications()
      setNotifications(result.notifications)

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

    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load notifications")
    } finally {
      setIsLoading(false)
    }
  }, [getNotifications, getProfile, getPost])

  const handleMarkAllRead = async () => {
    try {
      await markNotificationsRead()
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    } catch (error) {
      console.error("Failed to mark all read:", error)
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

  const filteredNotifications = activeTab === 'mentions'
    ? notifications.filter(n => n.reason === 'mention' || n.reason === 'reply')
    : notifications

  // ── THIS LINE MUST EXIST HERE ──
  const groupedNotifications = groupNotifications(filteredNotifications)
  // ─────────────────────────────────

  const unfollowedFollowers = notifications
    .filter(n => n.reason === 'follow' && user?.did !== n.author?.did && !followingStatus[n.author?.did])
    .map(n => n.author)
    .filter(Boolean)
    .filter((author, index, self) => index === self.findIndex(a => a.did === author.did))

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
            <Tabs value={activeTab} onValueChange={v => setActiveTab(v as 'all' | 'mentions')}>
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
                {followAllLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Users className="h-4 w-4 mr-2" />}
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

        {unfollowedFollowers.length > 0 && (
          <div className="sm:hidden px-4 pb-2">
            <Button
              onClick={handleFollowAllBack}
              variant="outline"
              size="sm"
              className="w-full"
              disabled={followAllLoading}
            >
              {followAllLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Users className="h-4 w-4 mr-2" />}
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
            {groupedNotifications.map(item => {
              // ... your full mapping logic for grouped and ungrouped items ...
              // (copy-paste the rest from your working version here)
              // The important thing is that groupedNotifications is now defined above
            })}
          </div>
        )}
      </main>
    </div>
  )
}