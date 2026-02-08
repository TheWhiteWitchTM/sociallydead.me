import React from "react"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import { BlueskyProvider } from "@/lib/bluesky-context"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { AppFooter } from "@/components/app-footer"
import { MainScrollIndicator } from "@/components/main-scroll-indicator"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

import { Metadata } from 'next';
import {SociallyDeadRepoProvider} from "@/lib/sociallydead-repo-context";

export const metadata: Metadata = {
	// SEO title: Keep under ~60 chars, front-load keywords
	title: "SociallyDead - Advanced Bluesky Client with Markdown & Post Editing",

	// Meta description: Under ~160 chars, compelling + keywords
	description:
		"SociallyDead is a modern Bluesky client featuring markdown formatting, syntax highlighting, article support, pseudo-edit for posts, and a clean interface for better Bluesky experience.",

	// Helps some crawlers
	generator: "v0.app",

	// PWA manifest
	manifest: "/manifest.json",

	// iOS/Android web app
	appleWebApp: {
		capable: true,
		statusBarStyle: "default",
		title: "SociallyDead",
	},

	// Icons (you can expand with more sizes if needed)
	icons: {
		icon: "/icons/icon-192.png",
		apple: "/icons/icon-192.png",
	},

	// Open Graph – great for Facebook, Bluesky link previews, etc.
	openGraph: {
		title: "SociallyDead – Bluesky Client with Markdown, Editing & Articles",
		description:
			"Enhance your Bluesky experience: full markdown support, code highlighting, article formatting, pseudo-editing of posts, and more in a fast, modern client.",
		url: "https://your-domain.com", // ← replace with actual site URL
		siteName: "SociallyDead",
		type: "website",
		// Use your banner as the main preview image
		images: [
			{
				url: "/banner.png",
				width: 1200, // ideal OG width
				height: 630, // ideal OG height (1.91:1 ratio)
				alt: "SociallyDead Bluesky Client Banner – Markdown & Edit Features",
			},
		],
		locale: "en_US", // optional but good
	},

	// Twitter / X cards – falls back to OG if missing, but explicit is better
	twitter: {
		card: "summary_large_image",
		title: "SociallyDead – Markdown + Edit for Bluesky",
		description:
			"Powerful Bluesky client: markdown highlights, articles, pseudo-edit posts and cleaner UI.",
		// Same banner works here (X loves large images)
		images: ["/banner.png"],
		// Optional: your X handle if you have one
		// creator: "@yourhandle",
	},

	// Optional: keywords if you want to hint at them (less important in 2026 but harmless)
	keywords: [
		"Bluesky client",
		"Bluesky markdown",
		"edit Bluesky posts",
		"Bluesky alternative",
		"Bluesky articles",
	],
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var fs = localStorage.getItem('sociallydead_font_size');
                  if (fs) document.documentElement.style.fontSize = fs + 'px';
                  var hc = localStorage.getItem('sociallydead_high_contrast');
                  if (hc === 'true') document.documentElement.classList.add('high-contrast');
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <BlueskyProvider>
	          <SociallyDeadRepoProvider>
            <AppSidebar />
            <div className="flex min-h-screen flex-col pl-0 transition-all md:pl-20 lg:pl-64">
              <AppHeader />
              <main className="flex-1 pb-16 md:pb-0">{children}</main>
              <MainScrollIndicator />
              <AppFooter />
            </div>
	          </SociallyDeadRepoProvider>
          </BlueskyProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
