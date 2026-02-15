// components/PageHeader.tsx
'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MoreHorizontal, RefreshCw } from 'lucide-react'

import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
	children: React.ReactNode
	className?: string
	dropdownMenu?: React.ReactNode
	isLoading?: boolean                 // parent still controls loading UI
	onRefresh?: () => void | Promise<void>   // accepts both sync & async
}

export function PageHeader({
	                           children,
	                           className,
	                           dropdownMenu,
	                           isLoading = false,
	                           onRefresh,
                           }: PageHeaderProps) {
	const pathname = usePathname()
	const router = useRouter()

	const canGoBack = typeof window !== 'undefined' && window.history.length > 1

	const handleBack = () => {
		if (canGoBack) router.back()
		else router.push('/')
	}

	const handleRefresh = () => {
		if (!onRefresh) {
			window.location.reload()
			return
		}

		const result = onRefresh()

		// If it returned a promise → prevent unhandled rejection
		if (result instanceof Promise) {
			result.catch((err) => {
				console.error('Refresh handler failed:', err)
				// Optional: toast.error("Refresh failed") here
			})
		}
		// We do NOT await → fire-and-forget style
		// Parent still manages isLoading → no blocking here
	}

	// Breadcrumbs logic (unchanged, compact)
	const segments = pathname.split('/').filter(Boolean)
	const breadcrumbs = [
		{ label: 'Home', href: '/', isCurrent: pathname === '/' },
		...segments.map((seg, idx) => {
			const href = '/' + segments.slice(0, idx + 1).join('/')
			let label = decodeURIComponent(seg)
				.replace(/-/g, ' ')
				.replace(/%20/g, ' ')
			label = label.charAt(0).toUpperCase() + label.slice(1)

			if (seg.startsWith('at://')) label = 'Thread'
			if (label.length > 20) label = label.slice(0, 17) + '...'

			return { label, href, isCurrent: idx === segments.length - 1 }
		}),
	]

	return (
		<header
			className={cn(
				'sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
				className
			)}
		>
			<div className="container flex h-14 max-w-screen-2xl items-center justify-between px-4 lg:px-8">
				{/* Left: Back + Icon + Title */}
				<div className="flex items-center gap-3">
					{canGoBack && (
						<Button
							variant="ghost"
							size="icon"
							onClick={handleBack}
							aria-label="Go back"
						>
							<ArrowLeft className="h-5 w-5" />
						</Button>
					)}

					<h4 className="text-lg font-semibold tracking-tight flex items-center gap-2">
						{children}
					</h4>
				</div>

				{/* Right: Menu + Refresh */}
				<div className="flex items-center gap-1">
					{dropdownMenu && (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" size="icon" aria-label="More options">
									<MoreHorizontal className="h-5 w-5" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								{dropdownMenu}
							</DropdownMenuContent>
						</DropdownMenu>
					)}

					<Button
						variant="ghost"
						size="icon"
						onClick={handleRefresh}
						disabled={isLoading}
						aria-label="Refresh page"
					>
						<RefreshCw
							className={cn(
								'h-5 w-5',
								isLoading && 'animate-spin'
							)}
						/>
					</Button>
				</div>
			</div>

			{/* Breadcrumbs */}
			{breadcrumbs.length > 1 && (
				<div className="container px-4 lg:px-8 pb-2 pt-1">
					<Breadcrumb className="text-muted-foreground text-xs">
						<BreadcrumbList className="gap-1.5 flex-nowrap overflow-hidden">
							{breadcrumbs.map((crumb, i) => (
								<BreadcrumbItem key={crumb.href} className="overflow-hidden">
									{crumb.isCurrent ? (
										<BreadcrumbPage className="font-medium text-foreground truncate max-w-[140px]">
											{crumb.label}
										</BreadcrumbPage>
									) : (
										<BreadcrumbLink asChild>
											<Link href={crumb.href} className="hover:text-foreground transition-colors truncate max-w-[140px]">
												{crumb.label}
											</Link>
										</BreadcrumbLink>
									)}
									{i < breadcrumbs.length - 1 && (
										<BreadcrumbSeparator className="text-muted-foreground/60 mx-1">/</BreadcrumbSeparator>
									)}
								</BreadcrumbItem>
							))}
						</BreadcrumbList>
					</Breadcrumb>
				</div>
			)}
		</header>
	)
}