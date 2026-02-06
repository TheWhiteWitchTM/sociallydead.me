"use client"

import React, { useEffect, useState, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  User,
  PenSquare,
  Settings,
  LogOut,
  Sparkles,
  Search,
  Loader2,
  Bell,
  MessageSquare,
  ListIcon,
  Rss,
  UsersRound,
  Bookmark,
  FileText,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useBluesky } from "@/lib/bluesky-context"
import { SignInDialog } from "@/components/sign-in-dialog"
import { usePushNotifications } from "@/hooks/use-push-notifications"

const authNavItems: Array<{ href: string; icon: typeof Home; label: string; showBadge?: boolean; showMessageBadge?: boolean; mobileKey?: boolean }> = [
  { href: "/", icon: Home, label: "Home", mobileKey: true },
  { href: "/search", icon: Search, label: "Search", mobileKey: true },
  { href: "/notifications", icon: Bell, label: "Notifications", showBadge: true, mobileKey: true },
  { href: "/messages", icon: MessageSquare, label: "Messages", showMessageBadge: true },
  { href: "/bookmarks", icon: Bookmark, label: "Bookmarks" },
  { href: "/articles", icon: FileText, label: "Articles" },
  { href: "/feeds", icon: Rss, label: "Feeds" },
  { href: "/lists", icon: ListIcon, label: "Lists" },
  { href: "/starter-packs", icon: UsersRound, label: "Starter Packs" },
  { href: "/compose", icon: PenSquare, label: "Compose", mobileKey: true },
  { href: "/profile", icon: User, label: "Profile", mobileKey: true },
  { href: "/ai", icon: Sparkles, label: "AI" },
  { href: "/settings", icon: Settings, label: "Settings" },
]

const publicNavItems: Array<{ href: string; icon: typeof Home; label: string; showBadge?: boolean; showMessageBadge?: boolean; mobileKey?: boolean }> = [
  { href: "/", icon: Home, label: "Home", mobileKey: true },
  { href: "/search", icon: Search, label: "Search", mobileKey: true },
  { href: "/feeds", icon: Rss, label: "Feeds", mobileKey: true },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { user, logout, isAuthenticated, isLoading, getUnreadCount, getUnreadMessageCount } = useBluesky()
  const { isSubscribed, showNotification } = usePushNotifications()
  const [unreadCount, setUnreadCount] = useState(0)
  const [prevUnreadCount, setPrevUnreadCount] = useState(0)
  const [hasNewNotifications, setHasNewNotifications] = useState(false)
  const [unreadMessageCount, setUnreadMessageCount] = useState(0)
  const [mobileExpanded, setMobileExpanded] = useState(false)

  const navItems = isAuthenticated ? authNavItems : publicNavItems
  const mobileKeyItems = navItems.filter(item => item.mobileKey)
  const mobileExtraItems = navItems.filter(item => !item.mobileKey)
  const navRef = useRef<HTMLElement>(null)
  const [showNavScroll, setShowNavScroll] = useState(false)

  // Close mobile expanded on route change
  useEffect(() => {
    setMobileExpanded(false)
  }, [pathname])

  // Check if nav has scroll content
  useEffect(() => {
    const nav = navRef.current
    if (!nav) return

    const checkScroll = () => {
      const hasMoreContent = nav.scrollHeight > nav.clientHeight
      const notAtBottom = nav.scrollTop + nav.clientHeight < nav.scrollHeight - 10
      setShowNavScroll(hasMoreContent && notAtBottom)
    }

    checkScroll()
    nav.addEventListener("scroll", checkScroll)
    window.addEventListener("resize", checkScroll)

    return () => {
      nav.removeEventListener("scroll", checkScroll)
      window.removeEventListener("resize", checkScroll)
    }
  }, [navItems])

  // Poll unread message count
  useEffect(() => {
    if (isAuthenticated && getUnreadMessageCount && !isLoading) {
      let isMounted = true
      const fetchUnreadMessages = async () => {
        try {
          const count = await getUnreadMessageCount()
          if (isMounted) setUnreadMessageCount(count)
        } catch {
          // Silently fail
        }
      }
      fetchUnreadMessages()
      const interval = setInterval(fetchUnreadMessages, 30000) // Poll every 30s
      return () => {
        isMounted = false
        clearInterval(interval)
      }
    }
  }, [isAuthenticated, getUnreadMessageCount, isLoading])

  useEffect(() => {
    if (isAuthenticated && getUnreadCount && !isLoading) {
      let isMounted = true
      const fetchUnread = async () => {
        try {
          const count = await getUnreadCount()
          if (!isMounted) return
          
          // Show push notification if new notifications arrived
          if (isSubscribed && count > prevUnreadCount && prevUnreadCount > 0 && pathname !== "/notifications") {
            const newCount = count - prevUnreadCount
            showNotification("New Notifications", {
              body: `You have ${newCount} new notification${newCount > 1 ? "s" : ""}`,
              url: "/notifications",
              tag: "new-notifications",
            })
          }
          
          // Show visual indicator for new notifications
          if (count > prevUnreadCount && prevUnreadCount >= 0 && pathname !== "/notifications") {
            setHasNewNotifications(true)
          }
          
          // Reset indicator when viewing notifications
          if (pathname === "/notifications") {
            setHasNewNotifications(false)
          }
          
          setPrevUnreadCount(count)
          setUnreadCount(count)
        } catch (error) {
          // Silently fail - don't crash the UI for notification count
          if (process.env.NODE_ENV === 'development') {
            console.error("Failed to fetch unread count:", error)
          }
        }
      }
      // Fetch immediately and also when navigating away from notifications (after marking read)
      fetchUnread()
      // Poll every 15 seconds for more real-time updates
      const interval = setInterval(fetchUnread, 15000)
      return () => {
        isMounted = false
        clearInterval(interval)
      }
    }
  }, [isAuthenticated, getUnreadCount, pathname, isSubscribed, prevUnreadCount, showNotification, isLoading])

  const renderNavButton = (item: typeof navItems[0], isActive: boolean, showLabel: boolean) => (
    <Button
      variant={isActive ? "secondary" : "ghost"}
      className={cn(
        showLabel ? "w-full justify-start" : "justify-center",
        "relative",
        isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
      )}
      size={showLabel ? "default" : "icon"}
    >
      <item.icon className="h-5 w-5" />
      {showLabel && <span className="ml-3">{item.label}</span>}
      {item.showBadge && unreadCount > 0 && (
        <Badge 
          variant="destructive" 
          className={cn(
            showLabel
              ? "ml-auto h-5 min-w-5 flex items-center justify-center text-xs px-1.5"
              : "absolute -top-1 -right-1 h-4 min-w-4 flex items-center justify-center text-[10px] px-1",
            hasNewNotifications && "animate-pulse ring-2 ring-destructive/50"
          )}
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </Badge>
      )}
      {item.showMessageBadge && unreadMessageCount > 0 && (
        <Badge 
          variant="destructive" 
          className={cn(
            showLabel
              ? "ml-auto h-5 min-w-5 flex items-center justify-center text-xs px-1.5"
              : "absolute -top-1 -right-1 h-4 min-w-4 flex items-center justify-center text-[10px] px-1"
          )}
        >
          {unreadMessageCount > 99 ? "99+" : unreadMessageCount}
        </Badge>
      )}
    </Button>
  )

  return (
    <>
      {/* Desktop Sidebar - hidden on mobile */}
      <aside className="fixed left-0 top-0 z-40 hidden md:flex h-screen w-20 flex-col border-r border-border bg-sidebar lg:w-64">
        {/* Logo */}
        <div className="flex h-16 items-center justify-center border-b border-sidebar-border px-2 lg:justify-start lg:px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <span className="text-lg font-bold text-primary-foreground">SD</span>
            </div>
            <span className="hidden text-lg font-bold lg:inline">SociallyDead</span>
          </Link>
        </div>

        {/* User Section */}
        <div className="border-b border-sidebar-border p-2 lg:p-4">
          {isAuthenticated && user ? (
            <div className="flex items-center justify-center gap-3 lg:justify-start">
              <Link href="/profile">
                <Avatar className="h-10 w-10 cursor-pointer transition-opacity hover:opacity-80">
                  <AvatarImage
                    src={user.avatar || "/placeholder.svg"}
                    alt={user.displayName || user.handle}
                  />
                  <AvatarFallback>
                    {(user.displayName || user.handle).slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <div className="hidden flex-1 min-w-0 lg:block">
                <p className="truncate text-sm font-medium text-sidebar-foreground">
                  {user.displayName || user.handle}
                </p>
                <p className="truncate text-xs text-muted-foreground">@{user.handle}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={logout}
                className="hidden lg:flex"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <SignInDialog
              trigger={
                <Button
                  className="w-full justify-center lg:justify-start"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <User className="h-5 w-5" />
                      <span className="ml-3 hidden lg:inline">Sign In</span>
                    </>
                  )}
                </Button>
              }
            />
          )}
        </div>

        {/* Main Navigation */}
        <div className="relative flex-1 min-h-0 overflow-hidden">
          <nav ref={navRef} className="absolute inset-0 space-y-1 overflow-y-auto overscroll-contain p-2 lg:p-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link 
                  key={item.href} 
                  href={item.href}
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('nav-click', { detail: item.href }))
                  }}
                >
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-center lg:justify-start relative",
                      isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="ml-3 hidden lg:inline">{item.label}</span>
                    {item.showBadge && unreadCount > 0 && (
                      <Badge 
                        variant="destructive" 
                        className={cn(
                          "absolute -top-1 -right-1 lg:static lg:ml-auto h-5 min-w-5 flex items-center justify-center text-xs px-1.5",
                          hasNewNotifications && "animate-pulse ring-2 ring-destructive/50"
                        )}
                      >
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </Badge>
                    )}
                    {item.showMessageBadge && unreadMessageCount > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="absolute -top-1 -right-1 lg:static lg:ml-auto h-5 min-w-5 flex items-center justify-center text-xs px-1.5"
                      >
                        {unreadMessageCount > 99 ? "99+" : unreadMessageCount}
                      </Badge>
                    )}
                  </Button>
                </Link>
              )
            })}
          </nav>
          {/* Scroll indicator */}
          {showNavScroll && (
            <div className="absolute bottom-0 left-0 right-0 pointer-events-none flex justify-center py-1 bg-gradient-to-t from-sidebar to-transparent z-10">
              <ChevronDown className="h-4 w-4 text-muted-foreground animate-bounce" />
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Bottom Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        {/* Expanded section - extra nav items */}
        {mobileExpanded && mobileExtraItems.length > 0 && (
          <div className="border-b border-border bg-background px-2 py-2 grid grid-cols-4 gap-1">
            {mobileExtraItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link 
                  key={item.href} 
                  href={item.href}
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('nav-click', { detail: item.href }))
                  }}
                  className="flex flex-col items-center"
                >
                  {renderNavButton(item, isActive, false)}
                  <span className={cn(
                    "text-[10px] mt-0.5 truncate max-w-full",
                    isActive ? "text-sidebar-accent-foreground font-medium" : "text-muted-foreground"
                  )}>
                    {item.label}
                  </span>
                </Link>
              )
            })}
            {/* User section in expanded area */}
            {isAuthenticated && user ? (
              <button
                onClick={logout}
                className="flex flex-col items-center"
              >
                <Button variant="ghost" size="icon" className="justify-center">
                  <LogOut className="h-5 w-5" />
                </Button>
                <span className="text-[10px] mt-0.5 text-muted-foreground">Logout</span>
              </button>
            ) : (
              <SignInDialog
                trigger={
                  <button className="flex flex-col items-center">
                    <Button variant="ghost" size="icon" className="justify-center" disabled={isLoading}>
                      {isLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <User className="h-5 w-5" />
                      )}
                    </Button>
                    <span className="text-[10px] mt-0.5 text-muted-foreground">Sign In</span>
                  </button>
                }
              />
            )}
          </div>
        )}
        {/* Key buttons row */}
        <div className="flex items-center justify-around px-1 py-1">
          {mobileKeyItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('nav-click', { detail: item.href }))
                }}
                className="flex flex-col items-center flex-1 min-w-0"
              >
                <div className="relative">
                  <item.icon className={cn(
                    "h-5 w-5",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )} />
                  {item.showBadge && unreadCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className={cn(
                        "absolute -top-2 -right-3 h-4 min-w-4 flex items-center justify-center text-[10px] px-1",
                        hasNewNotifications && "animate-pulse ring-2 ring-destructive/50"
                      )}
                    >
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </Badge>
                  )}
                  {item.showMessageBadge && unreadMessageCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-2 -right-3 h-4 min-w-4 flex items-center justify-center text-[10px] px-1"
                    >
                      {unreadMessageCount > 99 ? "99+" : unreadMessageCount}
                    </Badge>
                  )}
                </div>
                <span className={cn(
                  "text-[10px] mt-0.5",
                  isActive ? "text-primary font-medium" : "text-muted-foreground"
                )}>
                  {item.label}
                </span>
              </Link>
            )
          })}
          {/* Expand/collapse button */}
          {mobileExtraItems.length > 0 && (
            <button
              onClick={() => setMobileExpanded(!mobileExpanded)}
              className="flex flex-col items-center flex-1 min-w-0"
              aria-label={mobileExpanded ? "Show less" : "Show more"}
            >
              {mobileExpanded ? (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              )}
              <span className="text-[10px] mt-0.5 text-muted-foreground">
                {mobileExpanded ? "Less" : "More"}
              </span>
            </button>
          )}
        </div>
      </nav>
    </>
  )
}
