"use client"

import { useState } from "react"
import useSWR from "swr"
import { BadgeCheck, CreditCard, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useBluesky } from "@/lib/bluesky-context"

type CheckoutStep = "amount" | "processing" | "success" | "error"

interface VerificationCheckoutProps {
  trigger?: React.ReactNode
  onSuccess?: () => void
}

export function VerificationCheckout({ trigger, onSuccess }: VerificationCheckoutProps) {
  const { user, isAuthenticated, agent } = useBluesky()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<CheckoutStep>("amount")
  const [amount, setAmount] = useState("1.00")
  const [error, setError] = useState("")

  const handleCheckout = async () => {
    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount < 1.0) {
      setError("Minimum amount is $1.00")
      return
    }

    setStep("processing")
    setError("")

    try {
      // 1. Create the order
      const createRes = await fetch("/api/paypal/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: numAmount.toFixed(2) }),
      })

      if (!createRes.ok) {
        throw new Error("Failed to create order")
      }

      const { orderId, approvalUrl } = await createRes.json()

      // 2. Open PayPal approval in a popup window using the URL returned by our API
      const popup = window.open(
        approvalUrl,
        "paypal_checkout",
        "width=500,height=700,scrollbars=yes"
      )

      // 3. Poll for popup close (user completed or cancelled)
      await new Promise<void>((resolve, reject) => {
        const interval = setInterval(() => {
          if (popup?.closed) {
            clearInterval(interval)
            resolve()
          }
        }, 500)

        // Timeout after 10 minutes
        setTimeout(() => {
          clearInterval(interval)
          popup?.close()
          reject(new Error("Payment timed out"))
        }, 600000)
      })

      // 4. Capture the order
      const captureRes = await fetch("/api/paypal/capture-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      })

      if (!captureRes.ok) {
        throw new Error("Payment was not completed. If you approved the payment, please try again.")
      }

      const captureData = await captureRes.json()
      if (captureData.status !== "COMPLETED") {
        throw new Error("Payment was not completed. Please try again.")
      }

      // 5. Verify and write the supporter record
      const session = agent?.sessionManager?.session
      const verifyRes = await fetch("/api/paypal/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          handle: user?.handle,
          did: user?.did,
          accessJwt: session?.accessJwt,
          pdsUrl: session?.pdsUri || "https://bsky.social",
        }),
      })

      if (!verifyRes.ok) {
        const errData = await verifyRes.json()
        throw new Error(errData.error || "Verification failed")
      }

      setStep("success")
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      setStep("error")
    }
  }

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) {
      // Reset state when closing
      setTimeout(() => {
        setStep("amount")
        setAmount("1.00")
        setError("")
      }, 200)
    }
  }

  if (!isAuthenticated) {
    return trigger || null
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" className="h-9 w-9" title="Get Verified">
            <CreditCard className="h-5 w-5" />
            <span className="sr-only">Get Verified</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {step === "amount" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BadgeCheck className="h-5 w-5 text-blue-500" />
                Support SociallyDead
              </DialogTitle>
              <DialogDescription>
                Help fund development and keep SociallyDead free for everyone.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="flex gap-3 p-3 rounded-lg border border-border bg-muted/30">
                <CreditCard className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">Support development</p>
                  <p className="text-muted-foreground mt-1">
                    Your contribution goes directly toward hosting, development, and keeping SociallyDead running as a free, open client for Bluesky.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 p-3 rounded-lg border border-blue-500/20 bg-blue-500/5">
                <BadgeCheck className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">As a thank you</p>
                  <p className="text-muted-foreground mt-1">
                    You will receive a blue verified badge next to your name across SociallyDead as our way of saying thanks.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount (USD)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="amount"
                    type="number"
                    min="1.00"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-7"
                    placeholder="1.00"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Minimum $1.00. Every dollar helps keep SociallyDead alive and improving.</p>
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <Button onClick={handleCheckout} className="w-full gap-2">
                <CreditCard className="h-4 w-4" />
                Pay with PayPal
              </Button>
            </div>
          </>
        )}

        {step === "processing" && (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
            <div className="text-center">
              <p className="font-semibold">Processing Payment</p>
              <p className="text-sm text-muted-foreground mt-1">
                Complete the payment in the PayPal window, then wait here.
              </p>
            </div>
          </div>
        )}

        {step === "success" && (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10">
              <CheckCircle className="h-8 w-8 text-blue-500" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-lg">Thank you for your support!</p>
              <p className="text-sm text-muted-foreground mt-1">
                Your contribution helps keep SociallyDead running. A blue checkmark will now appear next to your name as our thanks.
              </p>
            </div>
            <Button onClick={() => handleOpen(false)} className="mt-2">
              Done
            </Button>
          </div>
        )}

        {step === "error" && (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-lg">Something went wrong</p>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
            </div>
            <div className="flex gap-2 mt-2">
              <Button variant="outline" onClick={() => setStep("amount")}>
                Try Again
              </Button>
              <Button variant="ghost" onClick={() => handleOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

/**
 * A subtle inline prompt for unverified users. 
 * Discrete, not spammy - just a small text link.
 */
async function checkSupporterRecord(did: string): Promise<boolean> {
  if (!did) return false
  try {
    const res = await fetch(
      `https://public.api.bsky.app/xrpc/com.atproto.repo.getRecord?repo=${encodeURIComponent(did)}&collection=me.sociallydead.supporter&rkey=self`
    )
    if (!res.ok) return false
    const data = await res.json()
    return !!data?.value?.verifiedAt
  } catch {
    return false
  }
}

export function VerificationPrompt({ className = "" }: { className?: string }) {
  const { user, isAuthenticated } = useBluesky()
  
  // Check if already a supporter via PDS
  const { data: isSupporter } = useSWR(
    isAuthenticated && user?.did ? `supporter-prompt:${user.did}` : null,
    () => checkSupporterRecord(user!.did),
    { revalidateOnFocus: false, dedupingInterval: 300000 }
  )
  
  // Don't show if not authenticated
  if (!isAuthenticated || !user) return null
  
  // Don't show if user already has gold or green (domain/sociallydead verified)
  const handle = user.handle
  if (handle.endsWith(".sociallydead.me") || handle === "sociallydead.me") return null
  if (!handle.endsWith(".bsky.social")) return null
  
  // Don't show if already a blue supporter
  if (isSupporter) return null
  
  // For .bsky.social users, show a subtle prompt
  return (
    <VerificationCheckout
      trigger={
        <button className={`inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-blue-500 transition-colors ${className}`}>
          <BadgeCheck className="h-3 w-3" />
          <span>Get verified</span>
        </button>
      }
    />
  )
}
