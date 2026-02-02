// /next-static/legacy/AppLayout.tsx
import { ReactNode, forwardRef, HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface AppLayoutProps extends HTMLAttributes<HTMLDivElement> {
	header?: ReactNode;
	footer?: ReactNode;
	leftAside?: ReactNode;
	rightAside?: ReactNode;
	children: ReactNode;
}

export const AppLayout = forwardRef<HTMLDivElement, AppLayoutProps>(
	({ header, footer, leftAside, rightAside, children, className, ...rest }, ref) => {
		return (
			// Outer grid fills exactly screen height
			<div
				ref={ref}
				className={cn(
					"fixed top-0 left-0 grid h-screen w-full min-h-full grid-rows-[auto_1fr_auto] overflow-hidden",
					className
				)}
				{...rest}
			>
				{/* Header row - auto height, stays at top */}
				<div>
				{header && (
					<header className="bg-background z-50">
						{header}
					</header>
				)}
				</div>

				{/* Main row - 1fr takes remaining space, 3-column grid */}
				<div className="grid grid-cols-[auto_1fr_auto] overflow-hidden bg-background">
					{/* Left sidebar - full height of this row, no scroll here */}
					<div className={"flex.1 flex-grow"}>
					{leftAside && (
						<aside className="flex-1 bg-red-600 overflow-hidden">
							WTF
						</aside>
					)}
					</div>

					{/* Center - ONLY place with scroll when needed */}
					<main className="scrollbar overflow-y-auto">
						{children}
					</main>

					{/* Right sidebar - full height of this row, no scroll here */}
					<div>
					{rightAside && (
						<aside className="bg-background border-l overflow-hidden">
							<div className="h-full overflow-y-auto">
								{rightAside}
							</div>
						</aside>
					)}
					</div>
				</div>

				{/* Footer row - auto height, stays at bottom */}
				<div>
				{footer && (
					<footer className="bg-background border-t z-50">
						{footer}
					</footer>
				)}
				</div>
			</div>
		);
	}
);

AppLayout.displayName = "AppLayout";