import {Blog} from "@/next-blog/ui/Blog";
import {PageContent} from "@/next-static/legacy/PageContent";

export default function BlogHome() {
	return (
			<PageContent>
				<span className={"prose dark:prose-invert"}>
				<h2>
					📃Bloog Feeds
				</h2>
				</span>
				<Blog/>
			</PageContent>
	)
}