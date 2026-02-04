"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function OAuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    // The OAuth client handles the callback automatically via init()
    // We just need to redirect back to home after a brief moment
    const timer = setTimeout(() => {
      router.push("/")
    }, 1000)
    
    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-muted-foreground">Completing sign in...</p>
    </div>
  )
}
