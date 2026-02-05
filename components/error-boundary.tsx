"use client"

import { Component, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, RefreshCw, Home, ChevronDown, Copy, Check } from "lucide-react"

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: string | null
  showDetails: boolean
  copied: boolean
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null, showDetails: false, copied: false }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error, errorInfo: null }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo)
    this.setState({ errorInfo: errorInfo.componentStack || null })
  }

  copyDetails = () => {
    const details = `Error: ${this.state.error?.message}\n\nStack: ${this.state.error?.stack}\n\nComponent: ${this.state.errorInfo}`
    navigator.clipboard.writeText(details)
    this.setState({ copied: true })
    setTimeout(() => this.setState({ copied: false }), 2000)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
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
                <Button
                  onClick={() => {
                    this.setState({ hasError: false, error: null, errorInfo: null })
                    window.location.reload()
                  }}
                  className="flex-1"
                >
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
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full text-muted-foreground hover:text-foreground"
                onClick={() => this.setState({ showDetails: !this.state.showDetails })}
              >
                <ChevronDown className={`h-4 w-4 mr-1 transition-transform ${this.state.showDetails ? "rotate-180" : ""}`} />
                {this.state.showDetails ? "Hide details" : "Show details"}
              </Button>
              
              {this.state.showDetails && this.state.error && (
                <div className="mt-3 w-full bg-muted/50 rounded-lg p-3 text-sm border border-border/50">
                  <p className="font-mono text-xs text-muted-foreground break-all whitespace-pre-wrap">
                    {this.state.error.message || "Unknown error"}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={this.copyDetails}
                    className="mt-2 h-7 text-xs text-muted-foreground hover:text-foreground"
                  >
                    {this.state.copied ? (
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
              )}
            </CardFooter>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

// Functional wrapper for convenience
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    )
  }
}
