// /next-blog/ui/NewIndicator.tsx
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils'; // assuming you have this utility from shadcn or similar

interface NewIndicatorProps {
	date: string;                    // ISO string, e.g. "2025-10-15T14:30:00Z"
	className?: string;
	text?: string;                   // custom text instead of "New"
	icon?: React.ReactNode;          // custom icon instead of Clock
	days?: number;                   // how many days to consider "new" (default 1)
}

export function NewIndicator({
	                             date,
	                             className,
	                             text = 'New',
	                             icon,
	                             days = 1,
                             }: NewIndicatorProps) {
	// Parse the input date
	const itemDate = new Date(date);
	if (isNaN(itemDate.getTime())) {
		return null; // invalid date → hide
	}

	const now = new Date();
	const diffMs = now.getTime() - itemDate.getTime();
	const diffHours = diffMs / (1000 * 60 * 60);
	const thresholdHours = days * 24;

	// Not new → don't render anything
	if (diffHours > thresholdHours) {
		return null;
	}

	// Default icon if none provided
	const defaultIcon = <Clock className="h-3.5 w-3.5" />;

	return (
		<div
			className={cn(
				'inline-flex items-center',
				'rounded-full bg-red-50  text-xs font-medium text-red-600',
				'dark:bg-red-950/40 dark:text-red-400',
				'border border-red-200/70 dark:border-red-800/50',
				className
			)}
		>
			{icon ?? defaultIcon}
			<span>{text}</span>
		</div>
	);
}