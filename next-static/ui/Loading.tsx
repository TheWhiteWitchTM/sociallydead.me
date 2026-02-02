// /next-static/ui/Loading.tsx
import type { FC, ReactNode } from 'react'
import { Suspense } from 'react'

interface LoadingProps {
	/** Custom text instead of "Loading..." */
	text?: string
	/** If truthy and children are provided, wraps children in Suspense with this as fallback */
	suspense?: boolean | ReactNode
	/** Children to wrap in Suspense when `suspense` is truthy */
	children?: ReactNode
	/** Optional className to customize container styles (e.g. bg, padding) */
	className?: string
}

const Loading: FC<LoadingProps> = ({
	                                   text = 'Loading...',
	                                   suspense,
	                                   children,
	                                   className = '',
                                   }) => {
	const loadingContent = (
		<div
			className={`
        absolute inset-0 
        flex items-center justify-center 
        bg-background/60 
        z-10 
        ${className}
      `}
		>
			<div className="flex flex-col items-center gap-5">
				{/* Dual-ring spinner */}
				<div className="relative h-12 w-12">
					<div className="absolute inset-0 rounded-full border-4 border-primary/30 animate-[spin_2.2s_linear_infinite]" />
					<div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-[spin_1.8s_linear_infinite_reverse]" />
				</div>

				{/* Pulsing text */}
				<span
					className="
            text-2xl font-medium tracking-wide text-foreground
            animate-pulse-soft
          "
				>
          {text}
        </span>
			</div>
		</div>
	)

	if (suspense && children) {
		return (
			<div className="relative">
				<Suspense fallback={loadingContent}>{children}</Suspense>
			</div>
		)
	}

	return loadingContent
}

export {Loading}