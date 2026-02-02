import type { Metadata } from "next";
import "./css/globals.css";
import { Toaster } from "@/components/ui/sonner"
import {baseMetadata} from "@/app/metadata";
import {Appbar} from "@/next-static/legacy/Appbar";
import {MainMenu} from "@/components/MainMenu";
import Link from "next/link";
import * as React from "react";
import { ThemeProvider } from "next-themes"
import {Toolbar} from "@/components/Toolbar";
import Image from "next/image";
import SidebarRight from "@/components/SidebarRight";
import { Analytics } from "@vercel/analytics/next"
import { Layout } from "@/emoji-ui/ui/Layout"
import SidebarLeft from "@/components/SidebarLeft";

export const metadata: Metadata = baseMetadata

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
	const header = (
		<Appbar className={"bg-black text-white"}
			left={
			<div className={"text-red-500 text-lg mt-0.5"}>
				☠️sociallydead.me
			</div>
		}
			right={<Toolbar/>}
		>
			<MainMenu/>
		</Appbar>
	)

	const footer = (
		<Appbar className={"bg-black text-white"}
			left={
				<div className={"px-3"}>
					🧙‍♀️Spell Book✨
				</div>
			}
			right={
			<span className={"px-5"}>
			<Link
				href="https://www.paypal.com/ncp/payment/4P85EQRES3RGU"
				target="_blank"
				rel="noopener noreferrer"
			>
				♥️Buy me a coffee!☕
			</Link>
			</span>
		}>
			<span className={"px-5 flex flex-row gap-1"}>
				<span>
				Build using
				</span>
				<Link
					href={"https://mirasworld.sociallydead.me/projects/next-static"}
					target={"_blank"}
					>
					⚡NEXT-static
				</Link>
				<span>
					&
				</span>
				<Link
					href={"https://mirasworld.sociallydead.me/projects/emoji-ui"}
					target={"_blank"}
				>
					🤣emoji-ui
				</Link>
				<span>
					by
				</span>
				<Link
					href={"https://mirasworld.sociallydead.me"}
					target={"_blank"}
					>
						♥️Mira♥️
				</Link>
			</span>
		</Appbar>
	)

	const left = (
		<div className={"hidden md:flex flex-col flex-1 my-4 p-2 w-40"}>
			<SidebarLeft/>
		</div>
	)

	const right = (
		<div className={"hidden md:flex flex-col flex-1 my-4 p-2 w-20"}>
			<SidebarRight/>
		</div>
	)

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={"w-full h-full m-0 p-0 min-h-screen bg-background text-foreground antialiased"}>
      <Analytics/>
      <ThemeProvider
	      attribute="class"
	      defaultTheme="system"
	      enableSystem
	      disableTransitionOnChange
      >
	        <Layout
		        header={header}
		        footer={footer}
		        leftSidebar={left}
		        rightSidebar={right}
		        children={children}
	        />
          <Toaster/>
      </ThemeProvider>
      </body>
    </html>
  );
}
