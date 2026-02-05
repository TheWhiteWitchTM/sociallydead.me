"use client"

import React, { useEffect, useState } from "react"
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
  Hash,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useBluesky } from "@/lib/bluesky-context"
import { SignInDialog } from "@/components/sign-in-dialog"

const authNavItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/search", icon: Search, label: "Search" },
  { href: "/notifications", icon: Bell, label: "Notifications", showBadge: true },
  { href: "/messages", icon: MessageSquare, label: "Messages" },
  { href: "/feeds", icon: Rss, label: "Feeds" },
  { href: "/lists", icon: ListIcon, label: "Lists" },
  { href: "/starter-packs", icon: UsersRound, label: "Starter Packs" },
  { href: "/compose", icon: PenSquare, label: "Compose" },
  { href: "/profile", icon: User, label: "Profile" },
  { href: "/ai", icon: Sparkles, label: "AI" },
  { href: "/settings", icon: Settings, label: "Settings" },
]

const publicNavItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/search", icon: Search, label: "Search" },
  { href: "/feeds", icon: Hash, label: "Discover Feeds" },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { user, logout, isAuthenticated, isLoading, getUnreadCount } = useBluesky()
  const [unreadCount, setUnreadCount] = useState(0)

  const navItems = isAuthenticated ? authNavItems : publicNavItems

  useEffect(() => {
    if (isAuthenticated && getUnreadCount) {
      const fetchUnread = async () => {
        try {
          const count = await getUnreadCount()
          setUnreadCount(count)
        } catch (error) {
          console.error("Failed to fetch unread count:", error)
        }
      }
      fetchUnread()
      const interval = setInterval(fetchUnread, 30000)
      return () => clearInterval(interval)
    }
  }, [isAuthenticated, getUnreadCount])

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-20 flex-col border-r border-border bg-sidebar lg:w-64">
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
      <nav className="flex-1 space-y-1 overflow-y-auto p-2 lg:p-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link key={item.href} href={item.href}>
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
                    className="absolute -top-1 -right-1 lg:static lg:ml-auto h-5 min-w-5 flex items-center justify-center text-xs px-1.5"
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Badge>
                )}
              </Button>
            </Link>
          )
        })}
      </nav>

      {/* Compose Button (Mobile) */}
      {isAuthenticated && (
        <div className="border-t border-sidebar-border p-2 lg:hidden">
          <Link href="/compose">
            <Button className="w-full" size="lg">
              <PenSquare className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      )}
    </aside>
  )
}
