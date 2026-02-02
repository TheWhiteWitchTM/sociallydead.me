import {Suspense, use} from "react";
import {mdxLoader} from "@/next-blog/lib/mdxLoader";

interface BlogPostMDXProps {
	slug: string
}
export function BlogPostMDX({ slug }: BlogPostMDXProps) {
	const MDX = use(mdxLoader(slug))

	return(
		<Suspense key={slug} fallback={"Loading---"}>
			<MDX/>
		</Suspense>
	)
}