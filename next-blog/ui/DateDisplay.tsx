// @/components/emoji-legacy/blog/DateDisplay.tsx

import * as React from 'react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';

interface DateDisplayProps {
	date: string;
}

export function DateDisplay({ date }: DateDisplayProps) {
	const parsedDate = parseISO(date);
	const ago = formatDistanceToNow(parsedDate, { addSuffix: false });
	const fullDate = parsedDate.toLocaleDateString();

	return (
		<div className="flex items-start">
			<span>⏰ {ago}</span>
			<span>📅 {fullDate}</span>
		</div>
	);
}