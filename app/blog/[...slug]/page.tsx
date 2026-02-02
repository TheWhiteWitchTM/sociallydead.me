import * as React from "react";
import Feed from "./feed"
import Post from "./post"
import {PageContent} from "@/next-static/legacy/PageContent";


type Props = {
	params: Promise<{ slug: string[] }>;       // ← Promise in Next.js 15+
};

export default async function Page({params}:Props) {
	const { slug: segments } = await params;
	let feed = true;
	if (segments.length==2)
		feed=false

	return (
		<PageContent>
			{feed
				? <Feed slug={segments[0]}/>
				: <Post slug={segments[0]+"/"+segments[1]}/>
			}
		</PageContent>
	)
}