"use client"

import { useEffect } from "react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Global Error:", error)
  }, [error])

  return (
    <html>
      <body>
        <div style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem",
          backgroundColor: "#09090b",
          color: "#fafafa",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}>
          <div style={{
            maxWidth: "28rem",
            width: "100%",
            backgroundColor: "#18181b",
            borderRadius: "0.75rem",
            border: "1px solid #27272a",
            padding: "1.5rem",
            textAlign: "center",
          }}>
            <div style={{
              width: "4rem",
              height: "4rem",
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1rem",
            }}>
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ef4444"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/>
                <path d="M12 9v4"/>
                <path d="M12 17h.01"/>
              </svg>
            </div>
            
            <h1 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "0.5rem" }}>
              Critical Error
            </h1>
            <p style={{ color: "#a1a1aa", marginBottom: "1rem", fontSize: "0.875rem" }}>
              A critical error occurred. The application needs to be reloaded.
            </p>
            
            <div style={{
              backgroundColor: "#27272a",
              borderRadius: "0.5rem",
              padding: "1rem",
              marginBottom: "1rem",
              textAlign: "left",
            }}>
              <p style={{ 
                fontFamily: "monospace", 
                fontSize: "0.75rem", 
                color: "#ef4444",
                wordBreak: "break-all",
              }}>
                {error.message || "Unknown error"}
              </p>
              {error.digest && (
                <p style={{ fontSize: "0.625rem", color: "#71717a", marginTop: "0.5rem" }}>
                  Error ID: {error.digest}
                </p>
              )}
            </div>
            
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                onClick={reset}
                style={{
                  flex: 1,
                  padding: "0.625rem 1rem",
                  backgroundColor: "#fafafa",
                  color: "#09090b",
                  border: "none",
                  borderRadius: "0.375rem",
                  cursor: "pointer",
                  fontWeight: "500",
                  fontSize: "0.875rem",
                }}
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.href = "/"}
                style={{
                  flex: 1,
                  padding: "0.625rem 1rem",
                  backgroundColor: "transparent",
                  color: "#fafafa",
                  border: "1px solid #27272a",
                  borderRadius: "0.375rem",
                  cursor: "pointer",
                  fontWeight: "500",
                  fontSize: "0.875rem",
                }}
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
