"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Download,
  Sun,
  Moon,
  Compass,
  Vote,
  Gamepad2,
  Cpu,
  Heart,
  Newspaper,
  Home,
  Menu,
  BeerOff,
  Video,
  X,
  Cloud,
  HelpCircle,
  BadgeCheck,
  FileText,
  Code,
  ChevronDown,
  Rss,
  TrendingUp
} from "lucide-react"
import { VerificationCheckout } from "@/components/verification-checkout"
import { useTheme } from "next-themes"
import { useBluesky } from "@/lib/bluesky-context"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import Image from "next/image"
import { cn } from "@/lib/utils"

const mainNavItems = [
  { id: "home", href: "/", icon: Home, label: "Home" },
  { id: "discover", href: "/discover", icon: Compass, label: "Discover" },
  { id: "following", href: "/following", icon: Cloud, label: "Following", auth: true },
  { id: "news", href: "/news", icon: Newspaper, label: "News" },
  { id: "politics", href: "/politics", icon: Vote, label: "Politics" },
  { id: "video", href: "/video", icon: Video, label: "Video" },
]

const feedCategories = [
  { id: "news", href: "/feed/news", icon: Newspaper, label: "News" },
  { id: "politics", href: "/feed/politics", icon: Vote, label: "Politics" },
  { id: "games", href: "/feed/games", icon: Gamepad2, label: "Games" },
  { id: "tech", href: "/feed/tech", icon: Cpu, label: "Tech" },
  { id: "health", href: "/feed/health", icon: Heart, label: "Health" },
  { id: "video", href: "/feed/video", icon: Video, label: "Video" },
  { id: "adult", href: "/feed/adult", icon: BeerOff, label: "Adult", adult: true },
]

export function AppHeader() {
  const blueSky = useBluesky()
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const { isAuthenticated } = useBluesky()
  const [canInstall, setCanInstall] = React.useState(false)
  const [deferredPrompt, setDeferredPrompt] = React.useState<any>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const [markdownHelpOpen, setMarkdownHelpOpen] = React.useState(false)
  const [markdownSyntaxOpen, setMarkdownSyntaxOpen] = React.useState(false)
  const [trending, setTrending] = React.useState<string[]>([])
  const [verifiedHelpOpen, setVerifiedHelpOpen] = React.useState(false)

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

    blueSky.getTrendingTopics(10)
      .then((res) => setTrending(res))

    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

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
            <Image
              src={"/icons/icon-192x192.png"}
              alt={"SD"}
              width={192}
              height={192}
              priority
            />
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

        {/* Navigation - Desktop (hidden on mobile) */}
        <nav className="hidden md:flex items-center gap-1">
          {mainNavItems.map((item) => {
            if (item.auth && !isAuthenticated)
              return

            const isActive = pathname === item.href
            return (
              <Link key={item.id} href={item.href}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "gap-1.5 px-3",
                    isActive && "bg-primary text-primary-foreground font-semibold"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Button>
              </Link>
            )
          })}

          {/* Feeds Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={pathname.startsWith("/feed/") ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "gap-1.5 px-3",
                  pathname.startsWith("/feed/") && "bg-primary text-primary-foreground font-semibold"
                )}
              >
                <Rss className="h-4 w-4" />
                <span>Feeds</span>
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuSeparator />
              {feedCategories.map((category) => {
                const isActive = pathname === category.href
                return (
                  <DropdownMenuItem key={category.id} asChild>
                    <Link
                      href={category.href}
                      className={cn(
                        "flex w-full items-center gap-2 cursor-pointer",
                        isActive && "bg-accent text-accent-foreground font-medium"
                      )}
                    >
                      <category.icon className="h-4 w-4" />
                      <span>{category.label}</span>
                      {category.adult && (
                        <span className={"text-red-600"}>
                          18+
                        </span>
                      )}
                    </Link>
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Hashtags Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={pathname.startsWith("/trending/") ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "gap-1.5 px-3",
                  pathname.startsWith("/trending/") && "bg-primary text-primary-foreground font-semibold"
                )}
              >
                <TrendingUp className="h-4 w-4" />
                <span>Trending</span>
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuSeparator />
              {trending.map((hashtag) => {
                const href = "/trending/" + encodeURIComponent(hashtag)
                const isActive = pathname === href
                return (
                  <DropdownMenuItem key={hashtag} asChild>
                    <Link
                      href={href}
                      className={cn(
                        "flex w-full items-center gap-2 cursor-pointer",
                        isActive && "bg-accent text-accent-foreground font-medium"
                      )}
                    >
                      <TrendingUp className="h-4 w-4" />
                      <span>{hashtag}</span>
                    </Link>
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        {/* Right side - Donate + Help + PWA Install + Theme Toggle */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Help Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <HelpCircle className="h-5 w-5" />
                <span className="sr-only">Help</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Help</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setMarkdownHelpOpen(true)}>
                <FileText className="h-4 w-4 mr-2" />
                Formatting Guide
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setMarkdownSyntaxOpen(true)}>
                <Code className="h-4 w-4 mr-2" />
                Markdown Syntax
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setVerifiedHelpOpen(true)}>
                <BadgeCheck className="h-4 w-4 mr-2" />
                Verification Levels
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Get Verified / Support Button */}
          {isAuthenticated ? (
            <VerificationCheckout
              trigger={
                <Button variant="ghost" size="icon" className="h-9 w-9" title="Get Verified - Support SociallyDead">
                  <BadgeCheck className="h-5 w-5 text-blue-500" />
                  <span className="sr-only">Get Verified</span>
                </Button>
              }
            />
          ) : (
            <></>
          )}

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

      {/* Mobile dropdown menu – NOW INCLUDES FEEDS + TRENDING */}
      {mobileMenuOpen && (
        <nav className="md:hidden border-t border-border bg-background px-4 pb-3 pt-2">
          <div className="flex flex-col gap-1">
            {/* Main nav items */}
            {mainNavItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link key={item.id} href={item.href}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    className={cn(
                      "w-full justify-start gap-2",
                      isActive && "bg-primary text-primary-foreground font-semibold"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              )
            })}

            {/* Feeds section */}
            <div className="mt-4 mb-1 px-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Rss className="h-3 w-3" />
                Feeds
              </span>
            </div>
            {feedCategories.map((category) => {
              const isActive = pathname === category.href
              return (
                <Link key={category.id} href={category.href}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    className={cn(
                      "w-full justify-start gap-2 pl-4",
                      isActive && "bg-primary text-primary-foreground font-semibold"
                    )}
                  >
                    <category.icon className="h-4 w-4" />
                    {category.label}
                    {category.adult && (
                      <span className="text-red-600 ml-auto text-xs">18+</span>
                    )}
                  </Button>
                </Link>
              )
            })}

            {/* Trending section */}
            <div className="mt-4 mb-1 px-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="h-3 w-3" />
                Trending
              </span>
            </div>
            {trending.map((hashtag) => {
              const href = "/trending/" + encodeURIComponent(hashtag)
              const isActive = pathname === href
              return (
                <Link key={hashtag} href={href}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    className={cn(
                      "w-full justify-start gap-2 pl-4",
                      isActive && "bg-primary text-primary-foreground font-semibold"
                    )}
                  >
                    <TrendingUp className="h-4 w-4" />
                    {hashtag}
                  </Button>
                </Link>
              )
            })}
          </div>
        </nav>
      )}

      {/* The rest (dialogs) remains unchanged */}
      <Dialog open={markdownHelpOpen} onOpenChange={setMarkdownHelpOpen}>
        {/* ... existing markdown help dialog ... */}
      </Dialog>

      <Dialog open={markdownSyntaxOpen} onOpenChange={setMarkdownSyntaxOpen}>
        {/* ... existing markdown syntax dialog ... */}
      </Dialog>

      <Dialog open={verifiedHelpOpen} onOpenChange={setVerifiedHelpOpen}>
        {/* ... existing verification levels dialog ... */}
      </Dialog>
    </header>
  )
}