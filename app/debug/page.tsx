"use client"

import {useState} from "react";
import {Bug} from "lucide-react";

export default function Debug() {
	const [record, setRecord] = useState("No record!");
	const [created, setCreated] = useState("Not created!");


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
			<div>
				<p>
					{record ? "Record found" : "No record found!"}
					{record &&
						<>
						<h2>sociallydead.me record:</h2>
						{record}
						</>
					}
					{created &&
						<>
							Created: {created}
						</>
					}
				</p>
			</div>
		</div>
	)
}