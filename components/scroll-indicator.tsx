"use client"

import { useEffect, useState, useRef, RefObject } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface ScrollIndicatorProps {
  containerRef?: RefObject<HTMLElement | null>
  className?: string
  position?: "bottom" | "bottom-center"
}

export function ScrollIndicator({ containerRef, className, position = "bottom-center" }: ScrollIndicatorProps) {
  const [showIndicator, setShowIndicator] = useState(false)

  useEffect(() => {
    const container = containerRef?.current || window

    const checkScroll = () => {
      if (containerRef?.current) {
        const { scrollTop, scrollHeight, clientHeight } = containerRef.current
        const hasMoreContent = scrollHeight > clientHeight
        const notAtBottom = scrollTop + clientHeight < scrollHeight - 50
        setShowIndicator(hasMoreContent && notAtBottom)
      } else {
        const hasMoreContent = document.documentElement.scrollHeight > window.innerHeight
        const notAtBottom = window.scrollY + window.innerHeight < document.documentElement.scrollHeight - 50
        setShowIndicator(hasMoreContent && notAtBottom)
      }
    }

    checkScroll()
    
    const element = containerRef?.current || window
    element.addEventListener("scroll", checkScroll)
    window.addEventListener("resize", checkScroll)

    // Re-check periodically for content changes
    const interval = setInterval(checkScroll, 1000)

    return () => {
      element.removeEventListener("scroll", checkScroll)
      window.removeEventListener("resize", checkScroll)
      clearInterval(interval)
    }
  }, [containerRef])

  if (!showIndicator) return null

  return (
    <div
      className={cn(
        "pointer-events-none animate-bounce",
        position === "bottom-center" && "fixed bottom-4 left-1/2 -translate-x-1/2",
        position === "bottom" && "absolute bottom-2 left-1/2 -translate-x-1/2",
        className
      )}
    >
      <div className="flex flex-col items-center gap-0.5 text-muted-foreground">
        <ChevronDown className="h-5 w-5" />
        <span className="text-xs sr-only">Scroll for more</span>
      </div>
    </div>
  )
}

export function SidebarScrollIndicator({ containerRef, className }: { containerRef: RefObject<HTMLElement | null>; className?: string }) {
  const [showIndicator, setShowIndicator] = useState(false)

  useEffect(() => {
    const container = containerRef?.current
    if (!container) return

    const checkScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      const hasMoreContent = scrollHeight > clientHeight
      const notAtBottom = scrollTop + clientHeight < scrollHeight - 20
      setShowIndicator(hasMoreContent && notAtBottom)
    }

    checkScroll()
    container.addEventListener("scroll", checkScroll)
    
    // Re-check for content changes
    const observer = new ResizeObserver(checkScroll)
    observer.observe(container)

    return () => {
      container.removeEventListener("scroll", checkScroll)
      observer.disconnect()
    }
  }, [containerRef])

  if (!showIndicator) return null

  return (
    <div className={cn("absolute bottom-0 left-0 right-0 pointer-events-none", className)}>
      <div className="flex justify-center py-1 bg-gradient-to-t from-sidebar to-transparent">
        <ChevronDown className="h-4 w-4 text-muted-foreground animate-bounce" />
      </div>
    </div>
  )
}
