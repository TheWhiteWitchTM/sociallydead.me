"use client"

import { useEffect, useState } from "react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const [isDark, setIsDark] = useState(true)
  const [showDetails, setShowDetails] = useState(false)
  
  useEffect(() => {
    console.error("Global Error:", error)
    // Detect system preference for dark mode
    if (typeof window !== 'undefined') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      const storedTheme = localStorage.getItem('theme')
      setIsDark(storedTheme === 'dark' || (storedTheme !== 'light' && prefersDark))
    }
  }, [error])

  // Theme-aware colors
  const colors = isDark ? {
    bg: "#09090b",
    cardBg: "#18181b",
    border: "#27272a",
    text: "#fafafa",
    textMuted: "#a1a1aa",
    textDimmed: "#71717a",
    accent: "#3b82f6",
    accentHover: "#2563eb",
  } : {
    bg: "#fafafa",
    cardBg: "#ffffff",
    border: "#e4e4e7",
    text: "#09090b",
    textMuted: "#71717a",
    textDimmed: "#a1a1aa",
    accent: "#3b82f6",
    accentHover: "#2563eb",
  }

  return (
    <html lang="en" className={isDark ? "dark" : ""}>
      <body>
        <div style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem",
          backgroundColor: colors.bg,
          color: colors.text,
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}>
          <div style={{
            maxWidth: "28rem",
            width: "100%",
            backgroundColor: colors.cardBg,
            borderRadius: "0.75rem",
            border: `1px solid ${colors.border}`,
            padding: "2rem",
            textAlign: "center",
            boxShadow: isDark ? "0 25px 50px -12px rgba(0, 0, 0, 0.5)" : "0 25px 50px -12px rgba(0, 0, 0, 0.1)",
          }}>
            {/* Icon */}
            <div style={{
              width: "4rem",
              height: "4rem",
              backgroundColor: `${colors.accent}15`,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.25rem",
            }}>
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke={colors.accent}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 8v4"/>
                <path d="M12 16h.01"/>
              </svg>
            </div>
            
            <h1 style={{ 
              fontSize: "1.25rem", 
              fontWeight: "600", 
              marginBottom: "0.5rem",
              color: colors.text,
            }}>
              Something went wrong
            </h1>
            <p style={{ 
              color: colors.textMuted, 
              marginBottom: "1.5rem", 
              fontSize: "0.875rem",
              lineHeight: "1.5",
            }}>
              We encountered an unexpected error. Please try again or return to the home page.
            </p>
            
            {/* Action Buttons */}
            <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem" }}>
              <button
                onClick={reset}
                style={{
                  flex: 1,
                  padding: "0.75rem 1rem",
                  backgroundColor: colors.accent,
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "0.5rem",
                  cursor: "pointer",
                  fontWeight: "500",
                  fontSize: "0.875rem",
                  transition: "background-color 0.2s",
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = colors.accentHover}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = colors.accent}
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.href = "/"}
                style={{
                  flex: 1,
                  padding: "0.75rem 1rem",
                  backgroundColor: "transparent",
                  color: colors.text,
                  border: `1px solid ${colors.border}`,
                  borderRadius: "0.5rem",
                  cursor: "pointer",
                  fontWeight: "500",
                  fontSize: "0.875rem",
                  transition: "background-color 0.2s, border-color 0.2s",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = isDark ? "#27272a" : "#f4f4f5"
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent"
                }}
              >
                Go Home
              </button>
            </div>
            
            {/* Show Details Toggle */}
            <button
              onClick={() => setShowDetails(!showDetails)}
              style={{
                background: "none",
                border: "none",
                color: colors.textDimmed,
                cursor: "pointer",
                fontSize: "0.75rem",
                padding: "0.5rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.25rem",
                margin: "0 auto",
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  transform: showDetails ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.2s",
                }}
              >
                <path d="m6 9 6 6 6-6"/>
              </svg>
              {showDetails ? "Hide details" : "Show details"}
            </button>
            
            {/* Error Details (Collapsible) */}
            {showDetails && (
              <div style={{
                backgroundColor: isDark ? "#0f0f10" : "#f4f4f5",
                borderRadius: "0.5rem",
                padding: "1rem",
                marginTop: "0.75rem",
                textAlign: "left",
                border: `1px solid ${colors.border}`,
              }}>
                <p style={{ 
                  fontFamily: "ui-monospace, monospace", 
                  fontSize: "0.75rem", 
                  color: colors.textMuted,
                  wordBreak: "break-word",
                  whiteSpace: "pre-wrap",
                  margin: 0,
                }}>
                  {error.message || "Unknown error"}
                </p>
                {error.digest && (
                  <p style={{ 
                    fontSize: "0.625rem", 
                    color: colors.textDimmed, 
                    marginTop: "0.75rem",
                    marginBottom: 0,
                  }}>
                    Error ID: {error.digest}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </body>
    </html>
  )
}
