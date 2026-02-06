"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Download, Sun, Moon, Compass, Vote, Gamepad2, Cpu, Heart, Newspaper, Home, Menu, X } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const feedCategories = [
  { id: "home", href: "/", icon: Home, label: "Home" },
  { id: "discover", href: "/discover", icon: Compass, label: "Discover" },
  { id: "news", href: "/feed/news", icon: Newspaper, label: "News" },
  { id: "politics", href: "/feed/politics", icon: Vote, label: "Politics" },
  { id: "games", href: "/feed/games", icon: Gamepad2, label: "Games" },
  { id: "tech", href: "/feed/tech", icon: Cpu, label: "Tech" },
  { id: "health", href: "/feed/health", icon: Heart, label: "Health" },
]

export function AppHeader() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [canInstall, setCanInstall] = React.useState(false)
  const [deferredPrompt, setDeferredPrompt] = React.useState<any>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)

  React.useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setCanInstall(true)
    }

    window.addEventListener("beforeinstallprompt", handler)

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setCanInstall(false)
    }

    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  // Close mobile menu on route change
  React.useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === "accepted") {
      setCanInstall(false)
    }
    setDeferredPrompt(null)
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4">
        {/* Logo + Hamburger - mobile only */}
        <div className="flex items-center gap-2 md:hidden">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-sm font-bold text-primary-foreground">SD</span>
            </div>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle feed menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Feed Categories - Desktop (hidden on mobile) */}
        <nav className="hidden md:flex items-center gap-1">
          {feedCategories.map((category) => {
            const isActive =
              pathname === category.href ||
              (category.id !== "discover" && pathname === `/feed/${category.id}`)
            return (
              <Link key={category.id} href={category.href}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "gap-1.5 px-3",
                    isActive && "bg-primary text-primary-foreground font-semibold"
                  )}
                >
                  <category.icon className="h-4 w-4" />
                  <span>{category.label}</span>
                </Button>
              </Link>
            )
          })}
        </nav>

        {/* Right side - PWA Install + Theme Toggle */}
        <div className="flex items-center gap-2">
          {canInstall && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleInstall}
              className="gap-2 bg-transparent"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Install</span>
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-9 w-9"
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <nav className="md:hidden border-t border-border bg-background px-4 pb-3 pt-2">
          <div className="flex flex-col gap-1">
            {feedCategories.map((category) => {
              const isActive =
                pathname === category.href ||
                (category.id !== "discover" && pathname === `/feed/${category.id}`)
              return (
                <Link key={category.id} href={category.href}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    className={cn(
                      "w-full justify-start gap-2",
                      isActive && "bg-primary text-primary-foreground font-semibold"
                    )}
                  >
                    <category.icon className="h-4 w-4" />
                    {category.label}
                  </Button>
                </Link>
              )
            })}
          </div>
        </nav>
      )}
    </header>
  )
}
