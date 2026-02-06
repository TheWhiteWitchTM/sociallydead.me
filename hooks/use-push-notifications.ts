"use client"

import { useState, useEffect, useCallback } from "react"

interface PushNotificationState {
  isSupported: boolean
  isSubscribed: boolean
  permission: NotificationPermission | null
  subscription: PushSubscription | null
}

// Sound settings stored in localStorage
const SOUND_ENABLED_KEY = "sociallydead_notification_sound"

export function getNotificationSoundEnabled(): boolean {
  if (typeof window === "undefined") return true
  const stored = localStorage.getItem(SOUND_ENABLED_KEY)
  return stored === null ? true : stored === "true"
}

export function setNotificationSoundEnabled(enabled: boolean) {
  if (typeof window === "undefined") return
  localStorage.setItem(SOUND_ENABLED_KEY, String(enabled))
}

export function usePushNotifications() {
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    isSubscribed: false,
    permission: null,
    subscription: null,
  })
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)
  const [soundEnabled, setSoundEnabledState] = useState(true)

  // Load sound preference
  useEffect(() => {
    setSoundEnabledState(getNotificationSoundEnabled())
  }, [])

  // Check if push notifications are supported
  useEffect(() => {
    const isSupported = 
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window

    setState((prev) => ({
      ...prev,
      isSupported,
      permission: isSupported ? Notification.permission : null,
    }))

    if (isSupported) {
      registerServiceWorker()
    }
  }, [])

  const registerServiceWorker = async () => {
    try {
      const reg = await navigator.serviceWorker.register("/sw.js")
      setRegistration(reg)

      // Check for existing subscription
      const existingSubscription = await reg.pushManager.getSubscription()
      if (existingSubscription) {
        setState((prev) => ({
          ...prev,
          isSubscribed: true,
          subscription: existingSubscription,
        }))
      }

      reg.addEventListener("updatefound", () => {
        const newWorker = reg.installing
        if (newWorker) {
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              console.log("[Push] New service worker available")
            }
          })
        }
      })
    } catch (error) {
      console.error("[Push] Service worker registration failed:", error)
    }
  }

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported) return false

    try {
      const permission = await Notification.requestPermission()
      setState((prev) => ({ ...prev, permission }))
      return permission === "granted"
    } catch (error) {
      console.error("[Push] Permission request failed:", error)
      return false
    }
  }, [state.isSupported])

  const subscribe = useCallback(async (): Promise<PushSubscription | null> => {
    if (!registration || !state.isSupported) return null

    if (Notification.permission !== "granted") {
      const granted = await requestPermission()
      if (!granted) return null
    }

    try {
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U"
        ),
      })

      setState((prev) => ({
        ...prev,
        isSubscribed: true,
        subscription,
      }))

      console.log("[Push] Subscription:", JSON.stringify(subscription))

      return subscription
    } catch (error) {
      console.error("[Push] Subscription failed:", error)
      return null
    }
  }, [registration, state.isSupported, requestPermission])

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!state.subscription) return false

    try {
      await state.subscription.unsubscribe()
      setState((prev) => ({
        ...prev,
        isSubscribed: false,
        subscription: null,
      }))
      return true
    } catch (error) {
      console.error("[Push] Unsubscribe failed:", error)
      return false
    }
  }, [state.subscription])

  // Play notification sound locally
  const playNotificationSound = useCallback(() => {
    if (!soundEnabled) return
    try {
      const audioCtx = new AudioContext()
      // Play a pleasant two-tone notification sound
      const playTone = (freq: number, start: number, duration: number) => {
        const osc = audioCtx.createOscillator()
        const gain = audioCtx.createGain()
        osc.connect(gain)
        gain.connect(audioCtx.destination)
        osc.frequency.value = freq
        osc.type = 'sine'
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime + start)
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + start + duration)
        osc.start(audioCtx.currentTime + start)
        osc.stop(audioCtx.currentTime + start + duration)
      }
      playTone(587.33, 0, 0.15) // D5
      playTone(880, 0.12, 0.2) // A5
    } catch {
      // Audio not supported
    }
  }, [soundEnabled])

  // Show a local notification
  const showNotification = useCallback(
    async (title: string, options?: NotificationOptions & { url?: string }) => {
      if (!state.isSupported || Notification.permission !== "granted") {
        const granted = await requestPermission()
        if (!granted) return
      }

      // Play sound if enabled
      if (soundEnabled) {
        playNotificationSound()
      }

      // Use service worker to show notification
      if (registration) {
        registration.active?.postMessage({
          type: "SHOW_NOTIFICATION",
          title,
          body: options?.body,
          url: options?.url,
          tag: options?.tag,
          playSound: false, // We play sound locally for more control
        })
      } else {
        new Notification(title, options)
      }
    },
    [state.isSupported, registration, requestPermission, soundEnabled, playNotificationSound]
  )

  // Set app badge count
  const setAppBadge = useCallback((count: number) => {
    // Direct badge API (works on some platforms)
    if ('setAppBadge' in navigator) {
      try {
        if (count > 0) {
          (navigator as any).setAppBadge(count)
        } else {
          (navigator as any).clearAppBadge()
        }
      } catch {
        // Not supported
      }
    }
    // Also tell the service worker
    if (registration?.active) {
      registration.active.postMessage({
        type: count > 0 ? 'SET_BADGE' : 'CLEAR_BADGE',
        count,
      })
    }
  }, [registration])

  // Toggle sound
  const setSoundEnabled = useCallback((enabled: boolean) => {
    setSoundEnabledState(enabled)
    setNotificationSoundEnabled(enabled)
  }, [])

  return {
    ...state,
    requestPermission,
    subscribe,
    unsubscribe,
    showNotification,
    setAppBadge,
    soundEnabled,
    setSoundEnabled,
    playNotificationSound,
  }
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
