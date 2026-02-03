"use client"

import Image from "next/image"
import {PageContent} from "@/next-static/legacy/PageContent";
import BlueSkyFeed from "@/components/BlueSkyFeed";

export default function Home()  {
	return (
		<PageContent className={"fex flex-col"}>
			<center>
				<Image
				src={"/banner.jpg"}
				alt="Home Image"
				width={300}
				height={200}
				priority
				className="inset-3"
			/>
			</center>
			<center>
				<BlueSkyFeed/>
			</center>
		</PageContent>
	)
}