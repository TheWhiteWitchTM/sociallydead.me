"use client"

import {useEffect, useState} from "react";
import {Bug} from "lucide-react";
import {useBluesky} from "@/lib/bluesky-context";
import {getSociallyDeadRecord} from "@/lib/sociallydead-me";
import {Agent} from "@atproto/api";

export default function Debug() {
	const [state, setState] = useState("Loading!");
	const [agent, setAgent] = useState<Agent | undefined>(undefined)
	const [record, setRecord] = useState("No record!");
	const [created, setCreated] = useState("Not created!");
	const blueSky = useBluesky()

	// @ts-ignore
	useEffect(() => {

	}, [agent])

	return(
		<div className="min-h-screen">
			<header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
				<div className="flex h-14 items-center justify-between px-4">
					<div className="flex items-center gap-2">
						<Bug className="h-5 w-5" />
						<h1 className="text-xl font-bold">Debug</h1>
					</div>
				</div>
			</header>
			<main>
				Debug!
			</main>
		</div>
	)
}