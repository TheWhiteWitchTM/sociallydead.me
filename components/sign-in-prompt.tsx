"use client"

import { useBluesky } from "@/lib/bluesky-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LogIn } from "lucide-react"

interface SignInPromptProps {
  title?: string
  description?: string
}

export function SignInPrompt({ 
  title = "Sign in to continue", 
  description = "You need to be signed in to access this feature" 
}: SignInPromptProps) {
  const { login, isLoading } = useBluesky()

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
            <span className="text-2xl font-bold text-primary-foreground">SD</span>
          </div>
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={login} 
            className="w-full" 
            size="lg"
            disabled={isLoading}
          >
            <LogIn className="mr-2 h-5 w-5" />
            Sign in with Bluesky
          </Button>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Uses secure OAuth - we never see your password
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
