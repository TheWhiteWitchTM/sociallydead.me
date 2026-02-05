"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { useBluesky } from "@/lib/bluesky-context"
import { SignInPrompt } from "@/components/sign-in-prompt"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, RefreshCw, Heart, Repeat2, UserPlus, AtSign, MessageCircle, Quote, CheckCheck } from "lucide-react"

interface Notification {
  uri: string
  cid: string
  author: {
    did: string
    handle: string
    displayName?: string
    avatar?: string
  }
  reason: 'like' | 'repost' | 'follow' | 'mention' | 'reply' | 'quote'
  reasonSubject?: string
  record: unknown
  isRead: boolean
  indexedAt: string
}

const notificationIcons = {
  like: Heart,
  repost: Repeat2,
  follow: UserPlus,
  mention: AtSign,
  reply: MessageCircle,
  quote: Quote,
}

const notificationColors = {
  like: "text-red-500",
  repost: "text-green-500",
  follow: "text-primary",
  mention: "text-blue-500",
  reply: "text-primary",
  quote: "text-primary",
}

const notificationText = {
  like: "liked your post",
  repost: "reposted your post",
  follow: "followed you",
  mention: "mentioned you",
  reply: "replied to your post",
  quote: "quoted your post",
}

export default function NotificationsPage() {
  const { isAuthenticated, isLoading: authLoading, getNotifications, markNotificationsRead } = useBluesky()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadNotifications = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await getNotifications()
      setNotifications(result.notifications)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load notifications")
    } finally {
      setIsLoading(false)
    }
  }, [getNotifications])

  const handleMarkAllRead = async () => {
    try {
      await markNotificationsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    } catch (error) {
      console.error("Failed to mark notifications as read:", error)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      loadNotifications()
    }
  }, [isAuthenticated, loadNotifications])

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
        <div className="flex h-14 items-center justify-between px-4">
          <h1 className="text-xl font-bold">Notifications</h1>
          <div className="flex items-center gap-2">
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
      </header>

      <main className="mx-auto max-w-2xl px-2 sm:px-4 py-6">
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
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground">No notifications yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              When someone interacts with your posts, you&apos;ll see it here.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => {
              const Icon = notificationIcons[notification.reason]
              const colorClass = notificationColors[notification.reason]
              const text = notificationText[notification.reason]
              
              return (
                <Card 
                  key={`${notification.uri}-${notification.indexedAt}`}
                  className={`transition-colors ${!notification.isRead ? 'bg-primary/5 border-primary/20' : ''}`}
                >
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex gap-3">
                      <div className={`mt-1 ${colorClass}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Link href={`/profile/${notification.author.handle}`}>
                            <Avatar className="h-8 w-8 cursor-pointer hover:opacity-80 transition-opacity">
                              <AvatarImage src={notification.author.avatar || "/placeholder.svg"} />
                              <AvatarFallback className="text-xs">
                                {(notification.author.displayName || notification.author.handle).slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          </Link>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm">
                              <Link 
                                href={`/profile/${notification.author.handle}`}
                                className="font-semibold hover:underline"
                              >
                                {notification.author.displayName || notification.author.handle}
                              </Link>
                              <span className="text-muted-foreground ml-1">{text}</span>
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(notification.indexedAt), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        
                        {/* Show post content for relevant notification types */}
                        {notification.reasonSubject && ['like', 'repost', 'reply', 'quote'].includes(notification.reason) && (
                          <Link 
                            href={`/post/${notification.reasonSubject.split('/')[2]}/${notification.reasonSubject.split('/').pop()}`}
                            className="block mt-2 p-2 rounded bg-muted/50 text-sm text-muted-foreground hover:bg-muted transition-colors"
                          >
                            View post
                          </Link>
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
