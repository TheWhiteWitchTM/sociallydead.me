"use client"

import React from "react"
import { useState } from "react"
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
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useBluesky } from "@/lib/bluesky-context"

const authNavItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/search", icon: Search, label: "Search" },
  { href: "/compose", icon: PenSquare, label: "Compose" },
  { href: "/profile", icon: User, label: "Profile" },
  { href: "/ai", icon: Sparkles, label: "AI" },
  { href: "/settings", icon: Settings, label: "Settings" },
]

const publicNavItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/search", icon: Search, label: "Search" },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { user, login, logout, isAuthenticated, isLoading } = useBluesky()
  const [handle, setHandle] = useState("")
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  const navItems = isAuthenticated ? authNavItems : publicNavItems

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!handle.trim()) return

    setIsSigningIn(true)
    try {
      await login(handle.trim())
      setDialogOpen(false)
    } catch (error) {
      console.error("Login failed:", error)
    } finally {
      setIsSigningIn(false)
    }
  }

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-20 flex-col border-r border-border bg-sidebar lg:w-64">
      {/* Logo */}
      <div className="flex h-16 items-center justify-center border-b border-sidebar-border px-2 lg:justify-start lg:px-2">
        <Link href="/" className="flex items-center gap-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <span className="text-lg font-bold text-primary-foreground">SD</span>
          </div>
        </Link>
      </div>
	    {/* User Section */}
	    <div className="border-t border-sidebar-border p-2 lg:p-2">
		    {isAuthenticated && user ? (
			    <div className="flex items-center justify-center gap-1 lg:justify-start">
				    <Avatar className="h-10 w-10">
					    <AvatarImage
						    src={user.avatar || "/placeholder.svg"}
						    alt={user.displayName || user.handle}
					    />
					    <AvatarFallback>
						    {(user.displayName || user.handle).slice(0, 2).toUpperCase()}
					    </AvatarFallback>
				    </Avatar>
				    <div className="hidden flex-1 lg:block">
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
			    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				    <DialogTrigger asChild>
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
				    </DialogTrigger>
				    <DialogContent className="sm:max-w-md">
					    <DialogHeader>
						    <DialogTitle>Sign in with Bluesky</DialogTitle>
						    <DialogDescription>
							    Enter your Bluesky handle to sign in using OAuth
						    </DialogDescription>
					    </DialogHeader>
					    <form onSubmit={handleSignIn} className="space-y-4">
						    <Input
							    type="text"
							    placeholder="handle.bsky.social"
							    value={handle}
							    onChange={(e) => setHandle(e.target.value)}
							    disabled={isSigningIn}
							    autoFocus
						    />
						    <Button
							    type="submit"
							    className="w-full"
							    disabled={isSigningIn || !handle.trim()}
						    >
							    {isSigningIn ? (
								    <>
									    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
									    Signing in...
								    </>
							    ) : (
								    "Continue with Bluesky"
							    )}
						    </Button>
					    </form>
				    </DialogContent>
			    </Dialog>
		    )}
	    </div>

      {/* Main Navigation */}
      <nav className="space-y-1 overflow-y-auto p-2 lg:p-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-center lg:justify-start",
                  isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="ml-3 hidden lg:inline">{item.label}</span>
              </Button>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
