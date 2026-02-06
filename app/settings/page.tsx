"use client"

import { useState } from "react"
import { useBluesky } from "@/lib/bluesky-context"
import { SignInPrompt } from "@/components/sign-in-prompt"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Loader2, LogOut, Moon, Sun, Smartphone, Bell, BellOff, BellRing, Settings, Volume2, VolumeX, Eye, Type, Contrast, BadgeCheck, CreditCard } from "lucide-react"
import { VerificationCheckout } from "@/components/verification-checkout"
import { getVerificationType } from "@/components/verified-badge"
import { useTheme } from "next-themes"
import { usePushNotifications } from "@/hooks/use-push-notifications"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { useAccessibility } from "@/hooks/use-accessibility"

export default function SettingsPage() {
  const { user, logout, isAuthenticated, isLoading } = useBluesky()
  const { theme, setTheme } = useTheme()
  const { 
    isSupported: pushSupported, 
    isSubscribed, 
    notificationsEnabled,
    toggleNotifications,
    permission,
    showNotification,
    soundEnabled,
    setSoundEnabled,
    playNotificationSound,
  } = usePushNotifications()
  const { fontSize, setFontSize, highContrast, setHighContrast } = useAccessibility()
  
  const [pushLoading, setPushLoading] = useState(false)

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <SignInPrompt title="Settings" description="Sign in to access settings" />
  }

  const handlePushToggle = async (checked: boolean) => {
    setPushLoading(true)
    try {
      await toggleNotifications(checked)
    } catch (error) {
      console.error("Failed to toggle push notifications:", error)
    } finally {
      setPushLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-4">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            <h1 className="text-xl font-bold">Settings</h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sun className="h-5 w-5" />
              Appearance
            </CardTitle>
            <CardDescription>Customize how SociallyDead looks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={theme === "light" ? "default" : "outline"}
                className="flex flex-col gap-1 h-auto py-3"
                onClick={() => setTheme("light")}
              >
                <Sun className="h-5 w-5" />
                <span className="text-xs">Light</span>
              </Button>
              <Button
                variant={theme === "dark" ? "default" : "outline"}
                className="flex flex-col gap-1 h-auto py-3"
                onClick={() => setTheme("dark")}
              >
                <Moon className="h-5 w-5" />
                <span className="text-xs">Dark</span>
              </Button>
              <Button
                variant={theme === "system" ? "default" : "outline"}
                className="flex flex-col gap-1 h-auto py-3"
                onClick={() => setTheme("system")}
              >
                <Smartphone className="h-5 w-5" />
                <span className="text-xs">System</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Accessibility */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Accessibility
            </CardTitle>
            <CardDescription>Adjust display for better readability</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* High Contrast */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="high-contrast" className="flex items-center gap-2">
                  <Contrast className="h-4 w-4" />
                  High Contrast
                </Label>
                <p className="text-sm text-muted-foreground">
                  Stronger colors and borders for better visibility
                </p>
              </div>
              <Switch
                id="high-contrast"
                checked={highContrast}
                onCheckedChange={setHighContrast}
              />
            </div>

            <Separator />

            {/* Font Size */}
            <div className="space-y-3">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <Type className="h-4 w-4" />
                  Font Size
                </Label>
                <p className="text-sm text-muted-foreground">
                  Adjust text size across the app
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-muted-foreground">A</span>
                <Slider
                  value={[fontSize]}
                  onValueChange={([v]) => setFontSize(v)}
                  min={12}
                  max={24}
                  step={1}
                  className="flex-1"
                />
                <span className="text-lg text-muted-foreground font-bold">A</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{fontSize}px</span>
                {fontSize !== 16 && (
                  <Button variant="ghost" size="sm" onClick={() => setFontSize(16)}>
                    Reset to default
                  </Button>
                )}
              </div>
              <div className="rounded-lg border border-border p-3 bg-muted/30">
                <p style={{ fontSize: `${fontSize}px` }}>
                  This is a preview of how text will look at this size.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Push Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>Control notification behaviour</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!pushSupported ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <BellOff className="h-4 w-4" />
                <span>Push notifications are not supported in this browser</span>
              </div>
            ) : permission === "denied" ? (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <BellOff className="h-4 w-4" />
                <span>Notifications are blocked. Please enable them in your browser settings.</span>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="push-notifications">Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications for likes, replies, and new followers
                    </p>
                  </div>
                  <Switch
                    id="push-notifications"
                    checked={notificationsEnabled}
                    disabled={pushLoading}
                    onCheckedChange={handlePushToggle}
                  />
                </div>

                <Separator />

                {/* Notification Sound - always visible, works independently */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="notification-sound" className="flex items-center gap-2">
                      {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                      Notification Beep
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Play a beep sound when new notifications arrive (off by default)
                    </p>
                  </div>
                  <Switch
                    id="notification-sound"
                    checked={soundEnabled}
                    onCheckedChange={setSoundEnabled}
                  />
                </div>
                {soundEnabled && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={playNotificationSound}
                  >
                    <Volume2 className="h-4 w-4 mr-2" />
                    Test Beep
                  </Button>
                )}

                {isSubscribed && (
                  <>
                    <Separator />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => showNotification("Test Notification", {
                        body: "Push notifications are working!",
                        url: "/notifications",
                      })}
                    >
                      <BellRing className="h-4 w-4 mr-2" />
                      Send Test Notification
                    </Button>
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Verification */}
        {user && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BadgeCheck className="h-5 w-5 text-blue-500" />
                Verification
              </CardTitle>
              <CardDescription>Your verification status on SociallyDead</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Show current status */}
              {(() => {
                const type = getVerificationType(user.handle)
                if (type === "gold") {
                  return (
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-yellow-500/20 bg-yellow-500/5">
                      <BadgeCheck className="h-5 w-5 text-yellow-500 shrink-0" />
                      <div className="text-sm">
                        <p className="font-medium text-yellow-600 dark:text-yellow-400">SociallyDead Verified</p>
                        <p className="text-muted-foreground">Your account is verified through SociallyDead</p>
                      </div>
                    </div>
                  )
                }
                if (type === "green") {
                  return (
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-green-500/20 bg-green-500/5">
                      <BadgeCheck className="h-5 w-5 text-green-500 shrink-0" />
                      <div className="text-sm">
                        <p className="font-medium text-green-600 dark:text-green-400">Domain Verified</p>
                        <p className="text-muted-foreground">Your account is verified through your custom domain</p>
                      </div>
                    </div>
                  )
                }
                // For .bsky.social users without a static badge
                return null
              })()}

              {/* Show supporter badge status via VerifiedBadge component's PDS check */}
              {!getVerificationType(user.handle) && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Support SociallyDead development and receive a blue verified badge as a thank you. Every dollar helps keep the platform running.
                  </p>
                  <VerificationCheckout
                    trigger={
                      <Button variant="outline" className="w-full gap-2">
                        <BadgeCheck className="h-4 w-4 text-blue-500" />
                        Support & Get Verified
                      </Button>
                    }
                  />
                </div>
              )}

              {/* Always show a way to support even if already verified */}
              {getVerificationType(user.handle) && (
                <div className="pt-1">
                  <VerificationCheckout
                    trigger={
                      <Button variant="ghost" size="sm" className="text-muted-foreground gap-2 w-full">
                        <CreditCard className="h-4 w-4" />
                        Support SociallyDead Development
                      </Button>
                    }
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* About */}
        <Card>
          <CardHeader>
            <CardTitle>About SociallyDead</CardTitle>
            <CardDescription>A Bluesky client with superpowers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">Markdown Support:</strong> Write posts with bold, italic, code, links, and more.
            </p>
            <p>
              <strong className="text-foreground">Pseudo-Edit:</strong> Edit your posts by automatically deleting and reposting with new content.
            </p>
            <p>
              <strong className="text-foreground">AI Integration:</strong> Get AI assistance for your posts.
            </p>
            <p>
              <strong className="text-foreground">PWA:</strong> Install as an app on your device for a native experience.
            </p>
          </CardContent>
        </Card>

        {/* Account */}
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Manage your Bluesky connection</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {user && (
              <div className="text-sm">
                <p><strong>Handle:</strong> @{user.handle}</p>
                <p><strong>Display Name:</strong> {user.displayName || "Not set"}</p>
              </div>
            )}
            <Separator />
            <Button variant="destructive" onClick={logout} className="w-full">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
