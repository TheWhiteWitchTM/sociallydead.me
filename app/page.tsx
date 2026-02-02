import Image from "next/image"
import {PageContent} from "@/next-static/legacy/PageContent";
import Intro from "./intro.mdx"

export default function Home()  {
	return (
		<PageContent className={"fex flex-col"}>
			<center>
				<Image
				src={"/banner.jpg"}
				alt="Home Image"
				width={400}
				height={200}
				priority
			/>
			</center>
			<div className={"prose dark:prose-invert"}>
				<Intro/>
			</div>
		</PageContent>
	)
}