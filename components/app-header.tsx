"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Download, Sun, Moon, Compass, Vote, Gamepad2, Cpu, Heart, Newspaper, Home, Menu, X, CreditCard, HelpCircle, BadgeCheck, FileText, Code } from "lucide-react"
import { useTheme } from "next-themes"
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
  const [markdownHelpOpen, setMarkdownHelpOpen] = React.useState(false)
  const [markdownSyntaxOpen, setMarkdownSyntaxOpen] = React.useState(false)
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

          {/* Donate Button */}
          <a
            href="https://www.paypal.com/ncp/payment/HUMB4VA29YFC4"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="ghost" size="icon" className="h-9 w-9" title="Support SociallyDead">
              <CreditCard className="h-5 w-5" />
              <span className="sr-only">Donate</span>
            </Button>
          </a>

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
      {/* Markdown Help Dialog */}
      <Dialog open={markdownHelpOpen} onOpenChange={setMarkdownHelpOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Formatting Guide
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <p className="text-muted-foreground">
              Posts support plain text with automatic link detection. Here are some tips:
            </p>
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="font-semibold mb-1">Mentions</p>
                <p className="text-muted-foreground">Type <code className="bg-muted px-1 rounded">@handle</code> to mention someone. The compose box will suggest users as you type.</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="font-semibold mb-1">Hashtags</p>
                <p className="text-muted-foreground">Type <code className="bg-muted px-1 rounded">#topic</code> to add a hashtag. These are clickable and searchable.</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="font-semibold mb-1">Links</p>
                <p className="text-muted-foreground">Paste any URL and it will be automatically detected. URLs at the start or end of your post will generate a rich link card preview.</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="font-semibold mb-1">Line Breaks</p>
                <p className="text-muted-foreground">Press Enter to create a new line. Your line breaks will be preserved exactly as you type them.</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="font-semibold mb-1">Media</p>
                <p className="text-muted-foreground">Attach up to 4 images or 1 video per post. Images and video cannot be mixed in the same post.</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="font-semibold mb-1">Character Limit</p>
                <p className="text-muted-foreground">Posts have a 300 character limit. The counter turns yellow at 280 and red at 300.</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Markdown Syntax Dialog (for Articles) */}
      <Dialog open={markdownSyntaxOpen} onOpenChange={setMarkdownSyntaxOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              Markdown Syntax
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <p className="text-muted-foreground">
              Articles, posts with rich content, and AI responses all support Markdown. Here is a full reference:
            </p>
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                <p className="font-semibold">Headings</p>
                <pre className="text-xs bg-background/80 p-2 rounded font-mono">{'# Heading 1\n## Heading 2\n### Heading 3'}</pre>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                <p className="font-semibold">Text Styling</p>
                <pre className="text-xs bg-background/80 p-2 rounded font-mono">{'**bold text**\n*italic text*\n~~strikethrough~~'}</pre>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                <p className="font-semibold">Links</p>
                <pre className="text-xs bg-background/80 p-2 rounded font-mono">{'[link text](https://example.com)'}</pre>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                <p className="font-semibold">Lists</p>
                <pre className="text-xs bg-background/80 p-2 rounded font-mono">{'- Unordered item\n- Another item\n\n1. Ordered item\n2. Another item'}</pre>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                <p className="font-semibold">Blockquotes</p>
                <pre className="text-xs bg-background/80 p-2 rounded font-mono">{'> This is a quote\n> It can span multiple lines'}</pre>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                <p className="font-semibold">Syntax Highlighted Code</p>
                <p className="text-muted-foreground text-xs mb-1">Add a language name after the triple backticks for syntax highlighting. Colors adapt to your light/dark theme automatically.</p>
                <pre className="text-xs bg-background/80 p-2 rounded font-mono">{'```javascript\nconst greeting = "Hello, world!";\nconsole.log(greeting);\n```\n\n```python\ndef hello():\n    print("Hello, world!")\n```\n\n```css\n.card {\n  border-radius: 8px;\n}\n```'}</pre>
                <p className="text-muted-foreground text-xs mt-1">Supported languages include: javascript, typescript, python, rust, go, java, c, cpp, css, html, json, bash, sql, markdown, yaml, and many more.</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                <p className="font-semibold">Inline Code</p>
                <pre className="text-xs bg-background/80 p-2 rounded font-mono">{'Use `backticks` for inline code'}</pre>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                <p className="font-semibold">Horizontal Rule</p>
                <pre className="text-xs bg-background/80 p-2 rounded font-mono">{'---'}</pre>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                <p className="font-semibold">Tables</p>
                <pre className="text-xs bg-background/80 p-2 rounded font-mono">{'| Column 1 | Column 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |'}</pre>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Verification Levels Dialog */}
      <Dialog open={verifiedHelpOpen} onOpenChange={setVerifiedHelpOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BadgeCheck className="h-5 w-5" />
              Verification Levels
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <p className="text-muted-foreground">
              SociallyDead has three levels of verification, each shown with a different colored badge next to usernames.
            </p>
            <div className="space-y-4">
              <div className="flex gap-3 p-4 rounded-lg border border-yellow-500/30 bg-yellow-500/5">
                <BadgeCheck className="h-6 w-6 text-yellow-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-yellow-500">Gold - SociallyDead Verified</p>
                  <p className="text-muted-foreground mt-1">
                    The highest tier. Awarded to users with a <code className="bg-muted px-1 rounded">.sociallydead.me</code> domain as their Bluesky handle. This means the account is part of the SociallyDead community.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 p-4 rounded-lg border border-green-500/30 bg-green-500/5">
                <BadgeCheck className="h-6 w-6 text-green-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-green-500">Green - Domain Verified</p>
                  <p className="text-muted-foreground mt-1">
                    Awarded to users who use their own custom domain as their Bluesky handle (not <code className="bg-muted px-1 rounded">.bsky.social</code>). This proves they own and control that domain.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 p-4 rounded-lg border border-blue-500/30 bg-blue-500/5">
                <BadgeCheck className="h-6 w-6 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-blue-500">Blue - Supporter Verified</p>
                  <p className="text-muted-foreground mt-1">
                    Awarded to users who support SociallyDead through PayPal donations. Show your support and get recognized with a blue badge!
                  </p>
                  <a
                    href="https://www.paypal.com/ncp/payment/HUMB4VA29YFC4"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-2 text-blue-500 hover:underline font-medium"
                  >
                    <CreditCard className="h-4 w-4" />
                    Donate to get verified
                  </a>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  )
}
