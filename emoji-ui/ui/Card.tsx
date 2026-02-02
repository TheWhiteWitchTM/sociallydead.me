"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const card = cva(
	"flex flex-col overflow-hidden text-sm",
	{
		variants: {
			look: {
				plain: "",
				bordered: "rounded border bg-card shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]"
			}
		},
		defaultVariants: { look: "bordered" }
	}
)

export interface CardProps
	extends React.HTMLAttributes<HTMLDivElement>,
		VariantProps<typeof card> {
	asChild?: boolean
	header?: React.ReactNode
	footer?: React.ReactNode
}

export const Card: React.FC<
	CardProps & { ref?: React.Ref<HTMLDivElement> }
> = ({
	     className,
	     look = "bordered",
	     asChild = false,
	     header,
	     footer,
	     children,
	     ref,
	     ...props
     }) => {
	const Comp = asChild ? Slot : "div"

	return (
		<Comp
			className={cn(card({ look, className }))}
			ref={ref}
			{...props}
		>
			{header && (
				<div className="px-3 py-1.5 border-b text-xs font-medium">
					{header}
				</div>
			)}

			<div className="p-2.5">{children}</div>

			{footer && (
				<div className="px-3 py-1 border-t text-xs">
					{footer}
				</div>
			)}
		</Comp>
	)
}

Card.displayName = "Card"