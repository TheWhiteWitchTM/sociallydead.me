// /next-static/ui/Waiting.tsx
import type { FC } from 'react'

const Waiting: FC = () => {
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
			<div className="flex flex-col items-center gap-6">
				{/* Spinner */}
				<div className="relative h-16 w-16">
					<div className="absolute inset-0 rounded-full border-4 border-primary/30 animate-[spin_2.2s_linear_infinite]" />
					<div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-[spin_1.8s_linear_infinite_reverse]" />
				</div>

				{/* Pulsating "Loading" text */}
				<div className="flex items-center gap-2">
          <span
	          className="
              text-3xl font-semibold tracking-wide text-foreground
              animate-pulse-soft
            "
          >
            Loading...
          </span>
				</div>
			</div>
		</div>
	)
}

export {Waiting}