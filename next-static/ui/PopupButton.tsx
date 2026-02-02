"use client"

import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"
import { Button } from "./Button"

export interface PopupButtonProps {
	icon?: React.ComponentType<{ className?: string }>
	label?: string
	popupContent: React.ReactNode
	buttonClassName?: string
	contentClassName?: string
	tooltip?: string
	showTooltip?: boolean
}

export const PopupButton = React.forwardRef<HTMLButtonElement, PopupButtonProps>(
	(
		{
			icon: Icon,
			label,
			popupContent,
			buttonClassName = "",
			contentClassName = "",
			tooltip,
			showTooltip = false,
			...buttonProps
		},
		ref
	) => {
		return (
			<PopoverPrimitive.Root>
				<PopoverPrimitive.Trigger asChild>
					<Button
						ref={ref}
						variant="ghost"
						className={`inline-flex flex-row gap-2 ${buttonClassName}`}
						tooltip={showTooltip ? tooltip : undefined}
						{...buttonProps}
					>
						{Icon && <Icon className="text-red-500" />}
						{label}
					</Button>
				</PopoverPrimitive.Trigger>

				<PopoverPrimitive.Portal>
					<PopoverPrimitive.Content
						side="bottom"
						align="end"                     // or "end" or "center" — "start" is usually best for toolbar-like buttons
						sideOffset={6}
						alignOffset={0}
						avoidCollisions={true}
						collisionPadding={12}
						className={`
              w-80 p-0 border-0 shadow-md rounded-lg
              bg-popover text-popover-foreground
              animate-in fade-in-0 zoom-in-95 duration-150 origin-top-left
              data-[side=bottom]:slide-in-from-top-2
              ${contentClassName}
            `}
					>
						<div className="border-0 shadow-none rounded-lg">
							{popupContent}
						</div>
					</PopoverPrimitive.Content>
				</PopoverPrimitive.Portal>
			</PopoverPrimitive.Root>
		)
	}
)

PopupButton.displayName = "PopupButton"