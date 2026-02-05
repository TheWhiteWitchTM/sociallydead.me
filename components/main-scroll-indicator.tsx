"use client"

import { useEffect, useState } from "react"
import { ChevronDown } from "lucide-react"

export function MainScrollIndicator() {
  const [showIndicator, setShowIndicator] = useState(false)

  useEffect(() => {
    const checkScroll = () => {
      const hasMoreContent = document.documentElement.scrollHeight > window.innerHeight + 100
      const notAtBottom = window.scrollY + window.innerHeight < document.documentElement.scrollHeight - 100
      setShowIndicator(hasMoreContent && notAtBottom)
    }

    // Initial check with a small delay for content to load
    const timeout = setTimeout(checkScroll, 500)
    
    window.addEventListener("scroll", checkScroll)
    window.addEventListener("resize", checkScroll)

    // Re-check periodically for dynamic content
    const interval = setInterval(checkScroll, 2000)

    return () => {
      clearTimeout(timeout)
      window.removeEventListener("scroll", checkScroll)
      window.removeEventListener("resize", checkScroll)
      clearInterval(interval)
    }
  }, [])

  if (!showIndicator) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none pl-20 lg:pl-64">
      <div className="flex flex-col items-center bg-background/80 backdrop-blur-sm rounded-full px-3 py-1.5 border border-border shadow-sm animate-bounce">
        <ChevronDown className="h-5 w-5 text-muted-foreground" />
      </div>
    </div>
  )
}
