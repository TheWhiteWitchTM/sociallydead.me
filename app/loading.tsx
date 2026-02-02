// app/loading.tsx
import { Loader2 } from "lucide-react";

export default function Loading() {
	return (
		<div className="fixed inset-0 z-[9999] flex min-h-screen w-full items-center justify-center bg-background">
			{/* Optional: subtle overlay or gradient if you want extra witchy vibe */}
			<div className="absolute inset-0 bg-gradient-to-br from-background/80 to-background opacity-90" />

			<div className="relative z-10 flex flex-col items-center gap-6">
				<Loader2 className="h-16 w-16 animate-spin text-primary" />
				<p className="text-lg font-medium text-muted-foreground animate-pulse">
					♥️<b>Mira's World™</b> is loading...☕
				</p>
			</div>
		</div>
	);
}