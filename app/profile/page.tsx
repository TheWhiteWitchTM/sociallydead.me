"use client"

import { useBluesky } from "@/lib/bluesky-context"
import { SignInPrompt } from "@/components/sign-in-prompt"
import { Feed } from "@/components/feed"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading } = useBluesky()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return <SignInPrompt title="Profile" description="Sign in to view your profile" />
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center px-4">
          <h1 className="text-xl font-bold">Profile</h1>
        </div>
      </header>

      <main className="container max-w-2xl px-4 py-6">
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.displayName || user.handle} />
                <AvatarFallback className="text-2xl">
                  {(user.displayName || user.handle).slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-bold">
                  {user.displayName || user.handle}
                </h2>
                <p className="text-muted-foreground">@{user.handle}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <h3 className="mb-4 text-lg font-semibold">Your Posts</h3>
        <Feed type="profile" />
      </main>
    </div>
  )
}
