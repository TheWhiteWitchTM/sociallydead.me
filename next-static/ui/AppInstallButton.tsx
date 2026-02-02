// /next-static/ui/AppInstallButton.tsx

"use client"

import * as React from "react"
import { Button } from "./Button"
import { Download, Check } from "lucide-react"

export interface AppInstallButtonProps
	extends Omit<React.ComponentProps<typeof Button>, "onClick" | "tooltip" | "children"> {
	installText?: string
	installedText?: string
	installTooltip?: string
	installedTooltip?: string
	swPath?: string
	showText?: boolean
	showTooltip?: boolean
}

const AppInstallButton = React.forwardRef<HTMLButtonElement, AppInstallButtonProps>(
	({
		 installText = "Install App",
		 installedText = "Installed",
		 installTooltip = "Add to home screen",
		 installedTooltip = "App installed",
		 swPath = "/sw.js",
		 showText = false,
		 showTooltip = false,
		 ...buttonProps
	 }, ref) => {
		const [deferredPrompt, setDeferredPrompt] = React.useState<Event | null>(null)
		const [isInstalled, setIsInstalled] = React.useState(false)

		React.useEffect(() => {
			const checkStandalone = () => {
				if (window.matchMedia("(display-mode: standalone)").matches) {
					setIsInstalled(true)
				}
			}
			checkStandalone()

			const handleBeforeInstallPrompt = (e: Event) => {
				e.preventDefault()
				setDeferredPrompt(e)
			}

			const handleAppInstalled = () => {
				setIsInstalled(true)
				setDeferredPrompt(null)
			}

			window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
			window.addEventListener("appinstalled", handleAppInstalled)
			window.addEventListener("focus", checkStandalone)

			return () => {
				window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
				window.removeEventListener("appinstalled", handleAppInstalled)
				window.removeEventListener("focus", checkStandalone)
			}
		}, [])

		const handleInstall = async () => {
			if (!deferredPrompt) return
				;(deferredPrompt as any).prompt()
			const { outcome } = await (deferredPrompt as any).userChoice
			if (outcome === "accepted") {
				setIsInstalled(true)
			}
			setDeferredPrompt(null)
		}

		if (!deferredPrompt && !isInstalled) {
			return null
		}

		return (
			<Button
				ref={ref}
				tooltip={showTooltip ? (isInstalled ? installedTooltip : installTooltip) : undefined}
				size="icon"
				variant="ghost"
				className="cursor-pointer hover:cursor-pointer hover:bg-accent/50 transition-colors"
				onClick={deferredPrompt && !isInstalled ? handleInstall : undefined}
				disabled={isInstalled}
				{...buttonProps}
			>
				{isInstalled ? <Check className="h-4 w-4" /> : <Download className="h-4 w-4" />}
				{showText && (isInstalled ? installedText : installText)}
			</Button>
		)
	}
)
AppInstallButton.displayName = "AppInstallButton"

export { AppInstallButton }