// components/BlueSkyPost.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface BlueSkyPostProps {
	post: any;
}

const BlueSkyPost: React.FC<BlueSkyPostProps> = ({ post }) => {
	const { author, record, embed } = post;
	const createdAt = new Date(record.createdAt).toLocaleString();

	return (
		<Card className="w-full max-w-md mx-auto">
			<CardHeader className="flex flex-row items-center gap-4">
				<Avatar>
					<AvatarImage src={author.avatar} alt={author.displayName} />
					<AvatarFallback>{author.displayName?.[0] || 'U'}</AvatarFallback>
				</Avatar>
				<div>
					<CardTitle>{author.displayName || author.handle}</CardTitle>
					<p className="text-sm text-muted-foreground">@{author.handle}</p>
				</div>
			</CardHeader>
			<CardContent>
				<p className="mb-4">{record.text}</p>
				{embed?.images && (
					<div className="grid grid-cols-1 gap-2">
						{embed.images.map((img: any, index: number) => (
							<img key={index} src={img.thumb} alt={img.alt} className="rounded-md w-full" />
						))}
					</div>
				)}
				{embed?.external && (
					<a href={embed.external.uri} target="_blank" rel="noopener noreferrer" className="block">
						<img src={embed.external.thumb} alt={embed.external.title} className="rounded-md w-full" />
						<p className="mt-2 font-semibold">{embed.external.title}</p>
					</a>
				)}
				<div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
					<Badge variant="outline">{createdAt}</Badge>
				</div>
			</CardContent>
		</Card>
	);
};

export default BlueSkyPost;