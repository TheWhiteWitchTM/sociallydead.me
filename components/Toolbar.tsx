"use client"

import {AppInstallButton} from "@/next-static/ui/AppInstallButton";
import {ThemeToggleButton} from "@/next-static/ui/ThemeToggleButton";
import {PopupButton} from "@/next-static/ui/PopupButton";
import {Heart} from "lucide-react";

function Popup () {
	return (
		<div className="component space-y-3 text-sm">
			<p className="text-muted-foreground">
				If my open-source stuff, rants, or AI tinkering helps — a coffee or sponsor keeps the cauldron bubbling 🧙‍♀️
			</p>
			<div className="flex flex-col gap-2">
				<a
					href="https://www.paypal.com/ncp/payment/4P85EQRES3RGU"
					target="_blank"
					rel="noopener noreferrer"
					className="inline-flex h-8 items-center justify-center rounded bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90"
				>
					♥️Buy me a coffee!☕
				</a>
				<a
					href="https://github.com/sponsors/TheWhiteWitchTM"
					target="_blank"
					rel="noopener noreferrer"
					className="text-xs text-muted-foreground hover:text-foreground underline"
				>
					Sponsor on GitHub
				</a>
			</div>
		</div>
	)
}

function Toolbar () {
	return(
		<div className={"pt-0.5 pr-3 flex flex-row gap-2"}>
			<AppInstallButton/>
			<ThemeToggleButton/>
			<PopupButton
				icon={Heart}
				popupContent={<Popup/>}
			/>
		</div>
	)
}

export {Toolbar}