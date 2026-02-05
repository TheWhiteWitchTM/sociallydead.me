"use client"

import { useBluesky } from "@/lib/bluesky-context"
import { SignInPrompt } from "@/components/sign-in-prompt"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ThemeToggle } from "@/components/theme-toggle"
import { Loader2, LogOut, Moon, Sun, Smartphone } from "lucide-react"
import { useTheme } from "next-themes"

export default function SettingsPage() {
  const { user, logout, isAuthenticated, isLoading } = useBluesky()
  const { theme, setTheme } = useTheme()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <SignInPrompt title="Settings" description="Sign in to access settings" />
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-4">
          <h1 className="text-xl font-bold">Settings</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Customize how SociallyDead looks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <span className="text-sm">Toggle Dark Mode</span>
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={theme === "light" ? "default" : "outline"}
                className="flex flex-col gap-1 h-auto py-3"
                onClick={() => setTheme("light")}
              >
                <Sun className="h-5 w-5" />
                <span className="text-xs">Light</span>
              </Button>
              <Button
                variant={theme === "dark" ? "default" : "outline"}
                className="flex flex-col gap-1 h-auto py-3"
                onClick={() => setTheme("dark")}
              >
                <Moon className="h-5 w-5" />
                <span className="text-xs">Dark</span>
              </Button>
              <Button
                variant={theme === "system" ? "default" : "outline"}
                className="flex flex-col gap-1 h-auto py-3"
                onClick={() => setTheme("system")}
              >
                <Smartphone className="h-5 w-5" />
                <span className="text-xs">System</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>About SociallyDead</CardTitle>
            <CardDescription>A Bluesky client with superpowers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">Markdown Support:</strong> Write posts with bold, italic, code, links, and more.
            </p>
            <p>
              <strong className="text-foreground">Pseudo-Edit:</strong> Edit your posts by automatically deleting and reposting with new content.
            </p>
            <p>
              <strong className="text-foreground">AI Integration:</strong> Get AI assistance for your posts.
            </p>
            <p>
              <strong className="text-foreground">PWA:</strong> Install as an app on your device for a native experience.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Manage your Bluesky connection</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {user && (
              <div className="text-sm">
                <p><strong>Handle:</strong> @{user.handle}</p>
                <p><strong>Display Name:</strong> {user.displayName || "Not set"}</p>
              </div>
            )}
            <Separator />
            <Button variant="destructive" onClick={logout} className="w-full">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
