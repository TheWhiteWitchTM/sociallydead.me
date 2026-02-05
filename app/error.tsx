"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { AlertCircle, RefreshCw, Home, ChevronDown, Copy, Check } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const [showDetails, setShowDetails] = useState(false)
  const [copied, setCopied] = useState(false)
  
  useEffect(() => {
    console.error("App Error:", error)
  }, [error])

  const copyDetails = () => {
    const details = `Error: ${error.message}\n\nDigest: ${error.digest || "N/A"}\n\nStack: ${error.stack || "N/A"}`
    navigator.clipboard.writeText(details)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-border/50">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-xl">Something went wrong</CardTitle>
          <CardDescription className="text-sm">
            We encountered an unexpected error. Please try again or return to the home page.
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="flex gap-3 w-full">
            <Button onClick={reset} className="flex-1">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                window.location.href = "/"
              }}
              className="flex-1"
            >
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col pt-0">
          <Collapsible open={showDetails} onOpenChange={setShowDetails} className="w-full">
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full text-muted-foreground hover:text-foreground"
              >
                <ChevronDown className={`h-4 w-4 mr-1 transition-transform ${showDetails ? "rotate-180" : ""}`} />
                {showDetails ? "Hide details" : "Show details"}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="w-full">
              <div className="mt-3 bg-muted/50 rounded-lg p-3 text-sm border border-border/50">
                <p className="font-mono text-xs text-muted-foreground break-all whitespace-pre-wrap">
                  {error.message || "Unknown error"}
                </p>
                {error.digest && (
                  <p className="text-xs text-muted-foreground/60 mt-2">
                    Error ID: {error.digest}
                  </p>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyDetails}
                  className="mt-2 h-7 text-xs text-muted-foreground hover:text-foreground"
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3 mr-1" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 mr-1" />
                      Copy details
                    </>
                  )}
                </Button>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardFooter>
      </Card>
    </div>
  )
}
