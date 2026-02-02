// src/mdx-components.tsx
import type { MDXComponents } from 'mdx/types'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

const components: MDXComponents = {
	// Use shadcn/legacy for callouts/alerts
	blockquote: ({ children }) => (
		<Alert className="my-6 border-l-4 border-primary bg-muted/50">
			<AlertTitle className="font-semibold">Note</AlertTitle>
			<AlertDescription>{children}</AlertDescription>
		</Alert>
	),

	// Nicer cards for tips/warnings
	Card: ({ children, title }: { children: React.ReactNode; title?: string }) => (
		<Card className="my-6">
			{title && <CardHeader><CardTitle>{title}</CardTitle></CardHeader>}
			<CardContent>{children}</CardContent>
		</Card>
	),

	// Better links
	a: ({ href, children }) => (
		<Link href={href as string} className="text-primary underline underline-offset-4 hover:text-primary/80">
			{children}
		</Link>
	),

	// Optional: override headings, etc.
	h1: ({ children }) => <h1 className="scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl">{children}</h1>,
	h2: ({ children }) => <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">{children}</h2>,
}

export function useMDXComponents(otherComponents: MDXComponents): MDXComponents {
	return { ...otherComponents, ...components }
}