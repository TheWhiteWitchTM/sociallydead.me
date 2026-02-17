"use client"

/**
 * HandleLink renders a user's @handle. If the handle is a custom domain
 * (i.e. NOT ending in .bsky.social), it becomes a clickable link that
 * opens that domain in a new tab. Regular .bsky.social handles are plain text.
 */

interface HandleLinkProps {
  handle: string
  className?: string
}

function isCustomDomain(handle: string): boolean {
  return !handle.endsWith(".bsky.social")
}

export function HandleLink({ handle, className = "" }: HandleLinkProps) {
  if (!handle) return (
    <span className={`text-muted-foreground ${className}`}>Invalid</span>
  )

  if (isCustomDomain(handle)) {
    return (
      <>
      <span className={`text-muted-foreground ${className}`}>@{handle}</span>
      <a
        href={`https://${handle}`}
        target="_blank"
        rel="noopener noreferrer"
        className={`text-muted-foreground hover:text-primary hover:underline transition-colors ${className}`}
        onClick={(e) => e.stopPropagation()}
        title={`Visit ${handle}`}
      >
        Website
      </a>
      </>
    )
  }

  return <span className={`text-muted-foreground ${className}`}>@{handle}</span>
}
