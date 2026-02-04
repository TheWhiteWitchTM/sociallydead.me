"use client"

import { useBluesky } from "@/lib/bluesky-context"
import { Feed } from "@/components/feed"
import { PublicFeed } from "@/components/public-feed"
import { Loader2 } from "lucide-react"

export default function HomePage() {
  const { isAuthenticated, isLoading } = useBluesky()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center px-4">
          <h1 className="text-xl font-bold">
            {isAuthenticated ? "Home" : "Discover"}
          </h1>
        </div>
      </header>
      <main className="container max-w-2xl px-4 py-6">
        {isAuthenticated ? (
          <Feed type="profile"/>
        ) : (
          <PublicFeed />
        )}
      </main>
    </div>
  )
}
