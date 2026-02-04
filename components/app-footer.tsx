import Link from "next/link"

export function AppFooter() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background py-3 pl-20 lg:pl-64">
      <div className="flex items-center justify-center px-4">
        <p className="text-sm text-muted-foreground">
          Powered by{" "}
          <Link
            href="https://bsky.app"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary hover:underline"
          >
            Bluesky
          </Link>
        </p>
	      <p className="text-sm text-muted-foreground">
		      Created by{" "}
		      <Link
			      href="https://mirasworld.sociallydead.me/"
			      target="_blank"
			      rel="noopener noreferrer"
			      className="font-medium text-primary hover:underline"
		      >
			      ♥️Mira
		      </Link>
	      </p>
      </div>
    </footer>
  )
}
