import {ListIcon} from "lucide-react";

export default function () {
	return (
		<div className="min-h-screen">
			<header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
				<div className="flex h-14 items-center justify-between px-4">
					<div className="flex items-center gap-2">
						<ListIcon className="h-5 w-5" />
						<h1 className="text-xl font-bold">List</h1>
					</div>
				</div>
			</header>
			<code className={"text-red-500"}>
				Under construction!
			</code>
		</div>
	)
}