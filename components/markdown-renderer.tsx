"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { cn } from "@/lib/utils"

interface MarkdownRendererProps {
  content: string
  className?: string
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
		<div className={cn("prose prose-sm dark:prose-invert max-w-none", className)}>
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
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
        p: ({ children }) => <p className="mb-2 last:mb-0">{children}<br/></p>,
        ul: ({ children }) => <ul className="mb-2 list-disc pl-4">{children}</ul>,
        ol: ({ children }) => <ol className="mb-2 list-decimal pl-4">{children}</ol>,
        li: ({ children }) => <li className="mb-1">{children}</li>,
        code: ({ className, children }) => {
          const isInline = !className
          return isInline ? (
            <code className="rounded bg-muted px-1 py-0.5 text-sm">{children}</code>
          ) : (
            <code className={cn("block rounded bg-muted p-2 text-sm overflow-x-auto", className)}>
              {children}
            </code>
          )
        },
        pre: ({ children }) => (
          <pre className="rounded bg-muted p-3 overflow-x-auto mb-2">{children}</pre>
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
