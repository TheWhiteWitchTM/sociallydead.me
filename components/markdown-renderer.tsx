"use client"

import React, { useEffect, useState, useMemo } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkBreaks from "remark-breaks"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

interface MarkdownRendererProps {
  content: string
  className?: string
}

/**
 * Renders Bluesky post text with proper newline handling.
 * Bluesky posts are plain text with \n for newlines.
 * We use whitespace-pre-wrap to faithfully render all line breaks
 * (LF, CR, CRLF) exactly as they appear in the source.
 * Links are auto-detected and made clickable.
 */
export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  // URL regex for auto-linking
  const urlRegex = /(https?:\/\/[^\s<]+[^\s<.,:;"')\]!?])/g

  // Split content into segments of text and URLs
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = urlRegex.exec(content)) !== null) {
    // Text before the URL
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index))
    }
    // The URL itself
    const url = match[1]
    parts.push(
      <a
        key={match.index}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:underline break-all"
      >
        {url}
      </a>
    )
    lastIndex = match.index + match[0].length
  }
  // Remaining text after last URL
  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex))
  }

  return (
    <div className={cn("whitespace-pre-wrap break-words text-sm", className)}>
      {parts}
    </div>
  )
}

/**
 * Shiki-powered syntax highlighted code block.
 * Lazy-loads shiki on first render to keep initial bundle small.
 * Uses github-light / github-dark themes to match the app theme.
 */
function ShikiCodeBlock({ code, language }: { code: string; language: string }) {
  const { resolvedTheme } = useTheme()
  const [html, setHtml] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function highlight() {
      try {
        const { codeToHtml } = await import("shiki")
        const theme = resolvedTheme === "dark" ? "github-dark" : "github-light"
        const result = await codeToHtml(code, {
          lang: language || "text",
          theme,
        })
        if (!cancelled) {
          setHtml(result)
        }
      } catch {
        // If language isn't supported, try plaintext
        try {
          const { codeToHtml } = await import("shiki")
          const theme = resolvedTheme === "dark" ? "github-dark" : "github-light"
          const result = await codeToHtml(code, {
            lang: "text",
            theme,
          })
          if (!cancelled) {
            setHtml(result)
          }
        } catch {
          if (!cancelled) {
            setHtml(null)
          }
        }
      }
    }

    highlight()
    return () => {
      cancelled = true
    }
  }, [code, language, resolvedTheme])

  if (!html) {
    // Fallback while loading or on error
    return (
      <code className="block text-sm font-mono whitespace-pre-wrap">
        {code}
      </code>
    )
  }

  return (
    <div
      className="shiki-wrapper text-sm [&_pre]:!p-0 [&_pre]:!m-0 [&_pre]:!bg-transparent [&_code]:!bg-transparent [&_.line]:leading-relaxed"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

/**
 * Full Markdown renderer for rich content (articles, AI responses, etc.)
 * Not used for Bluesky post text - use MarkdownRenderer for that.
 * Supports syntax highlighting via Shiki with GitHub themes.
 */
export function RichMarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={cn("prose prose-sm dark:prose-invert max-w-none", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {children}
            </a>
          ),
          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
          ul: ({ children }) => <ul className="mb-2 list-disc pl-4">{children}</ul>,
          ol: ({ children }) => <ol className="mb-2 list-decimal pl-4">{children}</ol>,
          li: ({ children }) => <li className="mb-1">{children}</li>,
          code: ({ className: codeClassName, children }) => {
            // Detect if this is a fenced code block (inside a <pre>)
            const match = /language-(\w+)/.exec(codeClassName || "")
            if (match) {
              // Fenced code block - use Shiki
              const codeString = String(children).replace(/\n$/, "")
              return <ShikiCodeBlock code={codeString} language={match[1]} />
            }
            // Inline code
            return (
              <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono text-foreground">
                {children}
              </code>
            )
          },
          pre: ({ children }) => (
            <pre className="rounded-lg border border-border bg-muted/50 p-4 overflow-x-auto mb-2 not-prose">
              {children}
            </pre>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-primary pl-3 italic text-muted-foreground">
              {children}
            </blockquote>
          ),
          h1: ({ children }) => <h1 className="text-xl font-bold mb-2">{children}</h1>,
          h2: ({ children }) => <h2 className="text-lg font-bold mb-2">{children}</h2>,
          h3: ({ children }) => <h3 className="text-base font-bold mb-2">{children}</h3>,
          strong: ({ children }) => <strong className="font-bold">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
