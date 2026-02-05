"use client"

import { useState, useEffect, useCallback } from "react"

interface PushNotificationState {
  isSupported: boolean
  isSubscribed: boolean
  permission: NotificationPermission | null
  subscription: PushSubscription | null
}

export function usePushNotifications() {
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    isSubscribed: false,
    permission: null,
    subscription: null,
  })
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)

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

      // Update on service worker state changes
      reg.addEventListener("updatefound", () => {
        const newWorker = reg.installing
        if (newWorker) {
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              // New service worker available
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

    // First, ensure we have permission
    if (Notification.permission !== "granted") {
      const granted = await requestPermission()
      if (!granted) return null
    }

    try {
      // For demo purposes, we use a placeholder VAPID key
      // In production, you'd use real VAPID keys from your server
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        // Note: In production, this applicationServerKey should come from your server
        applicationServerKey: urlBase64ToUint8Array(
          "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U"
        ),
      })

      setState((prev) => ({
        ...prev,
        isSubscribed: true,
        subscription,
      }))

      // In production, send subscription to your server
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

  // Show a local notification (doesn't require push subscription)
  const showNotification = useCallback(
    async (title: string, options?: NotificationOptions & { url?: string }) => {
      if (!state.isSupported || Notification.permission !== "granted") {
        const granted = await requestPermission()
        if (!granted) return
      }

      // Use service worker to show notification
      if (registration) {
        registration.active?.postMessage({
          type: "SHOW_NOTIFICATION",
          title,
          body: options?.body,
          url: options?.url,
          tag: options?.tag,
        })
      } else {
        // Fallback to regular notification
        new Notification(title, options)
      }
    },
    [state.isSupported, registration, requestPermission]
  )

  return {
    ...state,
    requestPermission,
    subscribe,
    unsubscribe,
    showNotification,
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
