"use client"

import { useState, useEffect, useCallback } from "react"

const FONT_SIZE_KEY = "sociallydead_font_size"
const HIGH_CONTRAST_KEY = "sociallydead_high_contrast"

function getStoredFontSize(): number {
  if (typeof window === "undefined") return 16
  const stored = localStorage.getItem(FONT_SIZE_KEY)
  return stored ? parseInt(stored, 10) : 16
}

function getStoredHighContrast(): boolean {
  if (typeof window === "undefined") return false
  return localStorage.getItem(HIGH_CONTRAST_KEY) === "true"
}

function applyFontSize(size: number) {
  if (typeof document === "undefined") return
  document.documentElement.style.fontSize = `${size}px`
}

function applyHighContrast(enabled: boolean) {
  if (typeof document === "undefined") return
  if (enabled) {
    document.documentElement.classList.add("high-contrast")
  } else {
    document.documentElement.classList.remove("high-contrast")
  }
}

export function useAccessibility() {
  const [fontSize, setFontSizeState] = useState(16)
  const [highContrast, setHighContrastState] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    const storedSize = getStoredFontSize()
    const storedContrast = getStoredHighContrast()
    setFontSizeState(storedSize)
    setHighContrastState(storedContrast)
    applyFontSize(storedSize)
    applyHighContrast(storedContrast)
  }, [])

  const setFontSize = useCallback((size: number) => {
    setFontSizeState(size)
    localStorage.setItem(FONT_SIZE_KEY, String(size))
    applyFontSize(size)
  }, [])

  const setHighContrast = useCallback((enabled: boolean) => {
    setHighContrastState(enabled)
    localStorage.setItem(HIGH_CONTRAST_KEY, String(enabled))
    applyHighContrast(enabled)
  }, [])

  return {
    fontSize,
    setFontSize,
    highContrast,
    setHighContrast,
  }
}
