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
  // Regex for hashtags, mentions and URLs
  // mentionRegex: @ followed by handle (alphanumeric, dots, hyphens)
  // hashtagRegex: # followed by word characters
  // urlRegex: http(s)://... OR www.... OR domain.tld/...
  const mentionRegex = /@([a-zA-Z0-9.-]+)/
  const hashtagRegex = /#(\w+)/
  const urlRegex = /((?:https?:\/\/|www\.)[^\s<]+[^\s<.,:;"')\]!?]|(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+(?:[a-zA-Z]{2,}))/

  // Combined regex to find all special elements
  // We use capturing groups for each type
  const combinedRegex = new RegExp(
    `(${mentionRegex.source})|(${hashtagRegex.source})|(${urlRegex.source})`,
    'g'
  )

  return (
    <div className={cn("whitespace-pre-wrap break-words text-sm", className)}>
      {renderContent(content, combinedRegex)}
    </div>
  )
}

function renderContent(content: string, combinedRegex: RegExp) {
  try {
    if (!content) {
      return null
    }
    if (!content.length) {
      return null
    }

    const parts: React.ReactNode[] = []
    let lastIndex = 0
    let match: RegExpExecArray | null

    while ((match = combinedRegex.exec(content)) !== null) {
      // Text before the match
      if (match.index > lastIndex) {
        parts.push(content.slice(lastIndex, match.index))
      }

      const [fullMatch, mentionMatch, mention, hashtagMatch, hashtag, urlMatch] = match

      if (mention) {
        parts.push(
          <a
            key={match.index}
            href={`/profile/${mention}`}
            className="text-blue-500 hover:underline font-medium"
          >
            {mentionMatch}
          </a>
        )
      } else if (hashtag) {
        parts.push(
          <a
            key={match.index}
            href={`/search?q=${encodeURIComponent('#' + hashtag)}`}
            className="text-blue-500 hover:underline font-medium"
          >
            {hashtagMatch}
          </a>
        )
      } else if (urlMatch) {
        const href = urlMatch.startsWith('http') ? urlMatch : urlMatch.startsWith('www.') ? `https://${urlMatch}` : `https://${urlMatch}`
        parts.push(
          <a
            key={match.index}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline break-all"
          >
            {urlMatch}
          </a>
        )
      }

      lastIndex = combinedRegex.lastIndex
    }
    // Remaining text after last URL
    if (lastIndex < content.length) {
      parts.push(content.slice(lastIndex))
    }
    return parts
  } catch {
    console.log ("Markdown Error!")
    return "";
  }
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
          p: ({ children }) => {
            if (typeof children === 'string') {
              const mentionRegex = /@([a-zA-Z0-9.-]+)/
              const hashtagRegex = /#(\w+)/
              const urlRegex = /((?:https?:\/\/|www\.)[^\s<]+[^\s<.,:;"')\]!?]|(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+(?:[a-zA-Z]{2,}))/
              const combinedRegex = new RegExp(
                `(${mentionRegex.source})|(${hashtagRegex.source})|(${urlRegex.source})`,
                'g'
              )
              return <p className="mb-2 last:mb-0">{renderContent(children, combinedRegex)}</p>
            }
            return <p className="mb-2 last:mb-0">{children}</p>
          },
          ul: ({ children }) => <ul className="mb-2 list-disc pl-4">{children}</ul>,
          ol: ({ children }) => <ol className="mb-2 list-decimal pl-4">{children}</ol>,
          li: ({ children }) => {
            if (typeof children === 'string') {
              const mentionRegex = /@([a-zA-Z0-9.-]+)/
              const hashtagRegex = /#(\w+)/
              const urlRegex = /((?:https?:\/\/|www\.)[^\s<]+[^\s<.,:;"')\]!?]|(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+(?:[a-zA-Z]{2,}))/
              const combinedRegex = new RegExp(
                `(${mentionRegex.source})|(${hashtagRegex.source})|(${urlRegex.source})`,
                'g'
              )
              return <li className="mb-1">{renderContent(children, combinedRegex)}</li>
            }
            return <li className="mb-1">{children}</li>
          },
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
          h1: ({ children }) => {
            if (typeof children === 'string') {
              const mentionRegex = /@([a-zA-Z0-9.-]+)/
              const hashtagRegex = /#(\w+)/
              const urlRegex = /((?:https?:\/\/|www\.)[^\s<]+[^\s<.,:;"')\]!?]|(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+(?:[a-zA-Z]{2,}))/
              const combinedRegex = new RegExp(
                `(${mentionRegex.source})|(${hashtagRegex.source})|(${urlRegex.source})`,
                'g'
              )
              return <h1 className="text-xl font-bold mb-2">{renderContent(children, combinedRegex)}</h1>
            }
            return <h1 className="text-xl font-bold mb-2">{children}</h1>
          },
          h2: ({ children }) => {
            if (typeof children === 'string') {
              const mentionRegex = /@([a-zA-Z0-9.-]+)/
              const hashtagRegex = /#(\w+)/
              const urlRegex = /((?:https?:\/\/|www\.)[^\s<]+[^\s<.,:;"')\]!?]|(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+(?:[a-zA-Z]{2,}))/
              const combinedRegex = new RegExp(
                `(${mentionRegex.source})|(${hashtagRegex.source})|(${urlRegex.source})`,
                'g'
              )
              return <h2 className="text-lg font-bold mb-2">{renderContent(children, combinedRegex)}</h2>
            }
            return <h2 className="text-lg font-bold mb-2">{children}</h2>
          },
          h3: ({ children }) => {
            if (typeof children === 'string') {
              const mentionRegex = /@([a-zA-Z0-9.-]+)/
              const hashtagRegex = /#(\w+)/
              const urlRegex = /((?:https?:\/\/|www\.)[^\s<]+[^\s<.,:;"')\]!?]|(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+(?:[a-zA-Z]{2,}))/
              const combinedRegex = new RegExp(
                `(${mentionRegex.source})|(${hashtagRegex.source})|(${urlRegex.source})`,
                'g'
              )
              return <h3 className="text-base font-bold mb-2">{renderContent(children, combinedRegex)}</h3>
            }
            return <h3 className="text-base font-bold mb-2">{children}</h3>
          },
          strong: ({ children }) => <strong className="font-bold">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
