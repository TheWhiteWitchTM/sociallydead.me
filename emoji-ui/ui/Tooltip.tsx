// components/ui/tooltip.tsx
"use client"

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"
import { cn } from "@/lib/utils"

const TooltipProvider = TooltipPrimitive.Provider

const TooltipRoot = TooltipPrimitive.Root

const TooltipTrigger = TooltipPrimitive.Trigger

const TooltipContent = React.forwardRef<
	React.ElementRef<typeof TooltipPrimitive.Content>,
	React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
	<TooltipPrimitive.Content
		ref={ref}
		sideOffset={sideOffset}
		className={cn(
			"z-50 overflow-hidden rounded border bg-popover",
			"px-2.5 py-1.5 text-sm text-popover-foreground shadow-xs",
			"animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out",
			"data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
			"data-[side=bottom]:slide-in-from-top-2",
			"data-[side=left]:slide-in-from-right-2",
			"data-[side=right]:slide-in-from-left-2",
			"data-[side=top]:slide-in-from-bottom-2",
			className
		)}
		{...props}
	>
		{props.children}
		<TooltipPrimitive.Arrow
			className="fill-popover stroke-border stroke-1"
			width={8}
			height={4}
		/>
	</TooltipPrimitive.Content>
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

export interface TooltipProps {
	children: React.ReactNode
	tooltip: React.ReactNode
	side?: "top" | "right" | "bottom" | "left"
	delay?: number
	className?: string
	ref?: React.Ref<HTMLElement>
}

export const Tooltip: React.FC<TooltipProps> = ({
	                                                children,
	                                                tooltip,
	                                                side = "top",
	                                                delay = 1,
	                                                className,
	                                                ref,
	                                                ...props
                                                }) => {
	return (
		<TooltipProvider delayDuration={delay * 1000}>
			<TooltipRoot>
				<TooltipTrigger
					asChild
					ref={ref as any}  // bridge until Radix types fully support ref prop
					{...props}
				>
					{children}
				</TooltipTrigger>

				<TooltipPrimitive.Portal>
					<TooltipContent side={side} className={className}>
						{tooltip}
					</TooltipContent>
				</TooltipPrimitive.Portal>
			</TooltipRoot>
		</TooltipProvider>
	)
}

Tooltip.displayName = "Tooltip"