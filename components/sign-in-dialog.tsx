"use client"

import React, { useState } from "react"
import { Loader2, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useBluesky } from "@/lib/bluesky-context"

interface SignInDialogProps {
  trigger?: React.ReactNode
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

export function SignInDialog({ trigger, defaultOpen, onOpenChange }: SignInDialogProps) {
  const { login, isLoading } = useBluesky()
  const [handle, setHandle] = useState("")
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(defaultOpen ?? false)
  const [error, setError] = useState<string | null>(null)

  const handleOpenChange = (open: boolean) => {
    setDialogOpen(open)
    onOpenChange?.(open)
    if (!open) {
      setError(null)
      setHandle("")
    }
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!handle.trim()) return

    setIsSigningIn(true)
    setError(null)
    
    try {
      await login(handle.trim())
      handleOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign in. Please check your handle and try again.")
    } finally {
      setIsSigningIn(false)
    }
  }

  const defaultTrigger = (
    <Button disabled={isLoading}>
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <>
          <User className="h-5 w-5 mr-2" />
          Sign In
        </>
      )}
    </Button>
  )

  return (
    <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
            <span className="text-2xl font-bold text-primary-foreground">SD</span>
          </div>
          <DialogTitle className="text-2xl">Sign in to SociallyDead</DialogTitle>
          <DialogDescription>
            Enter your Bluesky handle to sign in securely using OAuth
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSignIn} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Input
              type="text"
              placeholder="username.bsky.social"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              disabled={isSigningIn}
              autoFocus
              className="h-12 text-base"
            />
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>
          
          <Button
            type="submit"
            className="w-full h-12 text-base"
            disabled={isSigningIn || !handle.trim()}
          >
            {isSigningIn ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Connecting to Bluesky...
              </>
            ) : (
              "Continue with Bluesky"
            )}
          </Button>
        </form>
        
        <p className="mt-4 text-center text-xs text-muted-foreground">
          We use secure OAuth authentication - we never see or store your password.
          Your credentials are handled directly by Bluesky.
        </p>
      </DialogContent>
    </Dialog>
  )
}
