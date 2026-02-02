// /next-static/ui/ThemeToggleButton.tsx

"use client"

import * as React from "react"
import { Button } from "./Button"
import { Sun, Moon } from "lucide-react"
import { useTheme } from "next-themes"

export interface ThemeToggleButtonProps
	extends Omit<React.ComponentProps<typeof Button>, "onClick" | "tooltip" | "children"> {
	lightText?: string
	darkText?: string
	lightTooltip?: string
	darkTooltip?: string
	showText?: boolean
	showTooltip?: boolean
}

const ThemeToggleButton = React.forwardRef<HTMLButtonElement, ThemeToggleButtonProps>(
	({
		 lightText = "Light",
		 darkText = "Dark",
		 lightTooltip = "Switch to light",
		 darkTooltip = "Switch to dark",
		 showText = false,
		 showTooltip = false,
		 ...buttonProps
	 }, ref) => {
		const { theme, setTheme } = useTheme()
		const isDark = theme === "dark"

		const toggleTheme = () => {
			setTheme(isDark ? "light" : "dark")
		}

		return (
			<Button
				ref={ref}
				tooltip={showTooltip ? (isDark ? lightTooltip : darkTooltip) : undefined}
				size="icon"
				variant="ghost"
				className="cursor-pointer hover:cursor-pointer hover:bg-accent/50 transition-colors"
				onClick={toggleTheme}
				{...buttonProps}
			>
				{isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
				{showText && (isDark ? lightText : darkText)}
			</Button>
		)
	}
)
ThemeToggleButton.displayName = "ThemeToggleButton"

export { ThemeToggleButton }