"use client"

import { FeedManager } from "@/components/feed-manager"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Rss } from "lucide-react"
import Link from "next/link"
import { useBluesky } from "@/lib/bluesky-context"
import { SignInPrompt } from "@/components/sign-in-prompt"
import { Loader2 } from "lucide-react"

export default function FeedSettingsPage() {
  const { isAuthenticated, isLoading } = useBluesky()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <SignInPrompt title="Feed Settings" description="Sign in to manage your feeds" />
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center gap-4 px-4">
          <Link href="/settings">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Rss className="h-5 w-5" />
            <h1 className="text-lg font-bold">Feed Settings</h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Manage Your Home Feeds</h2>
            <p className="text-muted-foreground">
              Pin your favorite feeds to show them as tabs on your home screen. Drag feeds to reorder them.
            </p>
          </div>

          <FeedManager />

          <div className="mt-8 p-4 rounded-lg bg-muted/50 border">
            <h3 className="font-semibold mb-2">💡 Pro Tips</h3>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Your Following feed is always available</li>
              <li>Pin feeds you check frequently for quick access</li>
              <li>Drag and drop to customize the order of your tabs</li>
              <li>Discover new feeds in the Feeds page</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}
