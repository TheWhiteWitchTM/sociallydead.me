"use client"

import {AppInstallButton} from "@/next-static/ui/AppInstallButton";
import {ThemeToggleButton} from "@/next-static/ui/ThemeToggleButton";

function Toolbar () {
	return(
		<div className={"pt-0.5 pr-3 flex flex-row gap-2"}>
			<AppInstallButton/>
			<ThemeToggleButton/>
		</div>
	)
}

export {Toolbar}