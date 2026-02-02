import { ReactNode, HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

type PageContentVariant =
	| "auto"
	| "small"
	| "default"
	| "medium"
	| "large"
	| "full";

interface PageContentProps extends HTMLAttributes<HTMLDivElement> {
	variant?: PageContentVariant;
	children: ReactNode;
}

const maxWidthClasses: Record<PageContentVariant, string> = {
	auto: "",
	small: "max-w-md",
	default: "max-w-2xl",
	medium: "max-w-3xl",
	large: "max-w-5xl",
	full: "max-w-full",
};

const paddingXClasses: Record<PageContentVariant, string> = {
	auto: "px-4 sm:px-6 lg:px-8",
	small: "px-4 sm:px-6 lg:px-8",
	default: "px-4 sm:px-6 lg:px-8",
	medium: "px-4 sm:px-6 lg:px-8",
	large: "px-4 sm:px-6 lg:px-8",
	full: "px-4", // only minimal side padding
};

/**
 * Centered content wrapper with responsive max-width variants
 * - Always has p-4 top & bottom
 * - Horizontal padding & max-width controlled by variant
 * - Centers itself in available space
 */
export const PageContent = forwardRef<HTMLDivElement, PageContentProps>(
	(
		{
			variant = "default",
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
					"mx-auto w-full",
					"py-4", // consistent top/bottom padding
					paddingXClasses[variant],
					maxWidthClasses[variant],
					"min-h-[calc(100vh-var(--header-height,0px)-var(--footer-height,0px)-2rem)]", // optional: prevents too short content
					className
				)}
				{...rest}
			>
				{children}
			</div>
		);
	}
);

PageContent.displayName = "PageContent";