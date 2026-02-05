"use client"

import { ThemeProvider } from "@/components/theme-provider"
import { BlueskyProvider } from "@/lib/bluesky-context"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { AppFooter } from "@/components/app-footer"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <BlueskyProvider>
        <AppSidebar />
        <div className="flex min-h-screen flex-col pl-0 transition-all lg:pl-64">
          <div className="flex min-h-screen flex-col pl-20 lg:pl-0">
            <AppHeader />
            <main className="flex-1">{children}</main>
            <AppFooter />
          </div>
        </div>
      </BlueskyProvider>
    </ThemeProvider>
  )
}
