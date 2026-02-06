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

export const metadata: Metadata = {
  title: "SociallyDead - Bluesky Client",
  description: "A Bluesky client with markdown support and pseudo-edit feature",
  generator: "v0.app",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SociallyDead",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
}

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
            <AppSidebar />
            <div className="flex min-h-screen flex-col pl-0 transition-all md:pl-20 lg:pl-64">
              <AppHeader />
              <main className="flex-1 pb-16 md:pb-0">{children}</main>
              <MainScrollIndicator />
              <AppFooter />
            </div>
          </BlueskyProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
