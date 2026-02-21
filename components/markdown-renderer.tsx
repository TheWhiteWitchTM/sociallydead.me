"use client"

import React, { useEffect, useState } from "react"
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
 * Simple renderer for Bluesky-style post text.
 * Preserves all newlines exactly as they appear (whitespace-pre-wrap).
 * No automatic linkification, hashtag, or mention handling anymore.
 */
export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={cn("whitespace-pre-wrap break-words text-sm", className)}>
      {content?.trim() ? content.trim() : null}
    </div>
  )
}

/**
 * Shiki-powered syntax highlighted code block.
 * Lazy-loads shiki only when needed.
 * Uses github-light / github-dark depending on current theme.
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
        if (!cancelled) setHtml(result)
      } catch {
        // fallback to plain text highlighting
        try {
          const { codeToHtml } = await import("shiki")
          const theme = resolvedTheme === "dark" ? "github-dark" : "github-light"
          const result = await codeToHtml(code, {
            lang: "text",
            theme,
          })
          if (!cancelled) setHtml(result)
        } catch {
          if (!cancelled) setHtml(null)
        }
      }
    }

    highlight()
    return () => {
      cancelled = true
    }
  }, [code, language, resolvedTheme])

  if (!html) {
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
 * Clean rich markdown renderer – no custom link/mention/hashtag parsing.
 * Formatting (bold, italic, lists, code blocks, etc.) is handled by ReactMarkdown.
 * Links that are already written as proper Markdown `[text](url)` will work.
 * Syntax highlighting via Shiki for fenced code blocks.
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
          code: ({ className: codeClassName, children }) => {
            const match = /language-(\w+)/.exec(codeClassName || "")
            if (match) {
              // fenced code block → use Shiki
              const codeString = String(children).replace(/\n$/, "")
              return <ShikiCodeBlock code={codeString} language={match[1]} />
            }
            // inline code
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
          ul: ({ children }) => <ul className="mb-2 list-disc pl-4">{children}</ul>,
          ol: ({ children }) => <ol className="mb-2 list-decimal pl-4">{children}</ol>,
          // headings keep simple defaults (you can customize further if needed)
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