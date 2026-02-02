import { ReactNode, HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface AppbarProps extends HTMLAttributes<HTMLDivElement> {
	left?: ReactNode;
	right?: ReactNode;
	children?: ReactNode;
}

/**
 * Minimal horizontal Appbar primitive:
 * - left content sticks to the start (left side)
 * - children take up the remaining/center space
 * - right content sticks to the far end (right side)
 * - No built-in padding, margin, height, or background — control everything via className or child styles
 * - Full width, flex row, items centered vertically by default
 */
export const Appbar = forwardRef<HTMLDivElement, AppbarProps>(
	(
		{
			left,
			right,
			children,
			className,
			...rest
		},
		ref
	) => {
		return (
			<div
				ref={ref}
				className={cn(
					"grid grid-cols-[auto_1fr_auto]",
					className
				)}
				{...rest}
			>
				{/* Left section – aligned to start */}
				<div>
				{left && (
					<div className="">
						{left}
					</div>
				)}
				</div>

				{/* Center / main content – expands to fill available space */}
				<div className="">
					{children}
				</div>

				{/* Right section – aligned to end */}
				<div>
				{right && (
					<div className="">
						{right}
					</div>
				)}
				</div>
			</div>
		);
	}
);

Appbar.displayName = "Appbar";