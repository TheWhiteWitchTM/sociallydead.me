'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ChevronDown, MoreHorizontal, RefreshCw } from 'lucide-react'
import { useState } from 'react'

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
	isLoading?: boolean
	onRefresh?: () => void | Promise<void>
	centerContent?: React.ReactNode
	rightContent?: React.ReactNode
}

export function PageHeader({
	                           children,
	                           className,
	                           dropdownMenu,
	                           isLoading = false,
	                           onRefresh,
	                           centerContent,
	                           rightContent,
                           }: PageHeaderProps) {
	const pathname = usePathname()
	const router = useRouter()
	const [showBreadcrumbs, setShowBreadcrumbs] = useState(false)

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
		if (result instanceof Promise) {
			result.catch((err) => console.error('Refresh handler failed:', err))
		}
	}

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

	const hasBreadcrumbs = breadcrumbs.length > 1

	return (
		<header
			className={cn(
				'sticky top-14 w-full px-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
				className
			)}
		>
			<div className="container flex h-14 max-w-screen-2xl items-center justify-between mx-auto">
				{/* LEFT: back + toggle + title */}
				<div className="flex items-center">
					<Button
						variant="ghost"
						size="icon"
						onClick={handleBack}
						aria-label="Go back"
						className={cn('shrink-0', !canGoBack && 'invisible')}
					>
						<ArrowLeft className="h-5 w-5" />
					</Button>

					<Button
						variant="ghost"
						size="icon"
						onClick={() => setShowBreadcrumbs(!showBreadcrumbs)}
						aria-label="Toggle breadcrumbs"
						className={cn('shrink-0', !hasBreadcrumbs && 'invisible')}
					>
						<ChevronDown
							className={cn(
								'h-5 w-5 transition-transform duration-200',
								showBreadcrumbs && 'rotate-180'
							)}
						/>
					</Button>

					<div className="flex items-center gap-2 text-lg font-semibold tracking-tight">
						{children}
					</div>
				</div>

				{/* CENTER */}
				{centerContent && (
					<div className="flex-1 flex items-center justify-center px-4">
						{centerContent}
					</div>
				)}

				{/* RIGHT */}
				<div className="flex items-center gap-1 shrink-0">
					{dropdownMenu && (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" size="icon" aria-label="More options">
									<MoreHorizontal className="h-5 w-5" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">{dropdownMenu}</DropdownMenuContent>
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
							className={cn('h-5 w-5', isLoading && 'animate-spin')}
						/>
					</Button>

					{rightContent}
				</div>
			</div>

			{/* Breadcrumbs as overlay */}
			{showBreadcrumbs && hasBreadcrumbs && (
				<div className="absolute left-0 right-0 top-full z-40 bg-background border-b shadow-md animate-in fade-in slide-in-from-top-2 duration-150">
					<div className="container px-4 lg:px-8 py-2.5 mx-auto">
						<Breadcrumb className="text-muted-foreground text-xs">
							<BreadcrumbList className="flex-nowrap overflow-x-auto gap-1.5">
								{breadcrumbs.map((crumb, i) => (
									<BreadcrumbItem key={crumb.href} className="shrink-0 overflow-hidden">
										{crumb.isCurrent ? (
											<BreadcrumbPage className="font-medium text-foreground truncate max-w-[140px]">
												{crumb.label}
											</BreadcrumbPage>
										) : (
											<BreadcrumbLink asChild>
												<Link
													href={crumb.href}
													className="hover:text-foreground transition-colors truncate max-w-[140px]"
													onClick={() => setShowBreadcrumbs(false)}
												>
													{crumb.label}
												</Link>
											</BreadcrumbLink>
										)}
										{i < breadcrumbs.length - 1 && (
											<BreadcrumbSeparator className="mx-1 text-muted-foreground/60">/</BreadcrumbSeparator>
										)}
									</BreadcrumbItem>
								))}
							</BreadcrumbList>
						</Breadcrumb>
					</div>
				</div>
			)}
		</header>
	)
}