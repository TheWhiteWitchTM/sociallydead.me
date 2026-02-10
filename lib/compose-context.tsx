"use client"

import React, { createContext, useContext, useState, useCallback } from "react"
import type { ReactNode } from "react"

export interface ComposeContext {
  feedUri?: string
  feedName?: string
  replyTo?: {
    uri: string
    cid: string
    author: {
      handle: string
      displayName?: string
    }
    text: string
  }
  quotePost?: {
    uri: string
    cid: string
  }
}

interface ComposeContextValue {
  context: ComposeContext | null
  setContext: (context: ComposeContext | null) => void
  clearContext: () => void
}

const ComposeContextContext = createContext<ComposeContextValue | undefined>(undefined)

export function ComposeContextProvider({ children }: { children: ReactNode }) {
  const [context, setContextState] = useState<ComposeContext | null>(null)

  const setContext = useCallback((newContext: ComposeContext | null) => {
    setContextState(newContext)
    // Store in sessionStorage so it persists during navigation
    if (newContext) {
      sessionStorage.setItem("compose_context", JSON.stringify(newContext))
    } else {
      sessionStorage.removeItem("compose_context")
    }
  }, [])

  const clearContext = useCallback(() => {
    setContextState(null)
    sessionStorage.removeItem("compose_context")
  }, [])

  // Load context from sessionStorage on mount
  React.useEffect(() => {
    const stored = sessionStorage.getItem("compose_context")
    if (stored) {
      try {
        setContextState(JSON.parse(stored))
      } catch {
        // Invalid JSON, ignore
      }
    }
  }, [])

  return (
    <ComposeContextContext.Provider value={{ context, setContext, clearContext }}>
      {children}
    </ComposeContextContext.Provider>
  )
}

export function useComposeContext() {
  const ctx = useContext(ComposeContextContext)
  if (!ctx) {
    // Return default values if provider is not found (shouldn't happen in production)
    return {
      context: null,
      setContext: () => {},
      clearContext: () => {},
    }
  }
  return ctx
}
