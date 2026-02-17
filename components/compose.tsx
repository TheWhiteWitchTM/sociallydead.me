"use client"

import Link from "next/link";
import {Button} from "@/components/ui/button";
import {cn} from "@/lib/utils";
import {PenSquare} from "lucide-react";
import {useBluesky} from "@/lib/bluesky-context";
import React from "react";

export default function ComposeButton() {
	const {isAuthenticated} = useBluesky()
	if (!isAuthenticated) {
		return null
	}
	return(
		<div className={"fixed z-30 right-12 bottom-14"}>
		<div className="rounded-lg border-t border-sidebar-border p-2 lg:p-4">
			<Link href="/compose">
				<Button
					className={cn(
						"w-full h-12 text-base font-semibold shadow-lg",
						"bg-primary hover:bg-primary/90 text-primary-foreground",
						"transition-all duration-200 hover:scale-105"
					)}
					size="lg"
				>
					<PenSquare className="h-5 w-5 lg:mr-3" />
					<span className="hidden lg:inline">Compose</span>
				</Button>
			</Link>
		</div>
		</div>
	)
}