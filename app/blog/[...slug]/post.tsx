import { postsMeta } from "@/next-blog/meta/posts-meta";
import {SUSE} from "next/dist/compiled/@next/font/dist/google";
import {Suspense} from "react";
import {BlogPostMDX} from "@/next-blog/ui/BlogPostMDX";

type Props = {
	slug: string;
};

export default function ({slug}: Props) {
	const meta = postsMeta.find((post) => post.slug === slug);

	return (
		<>
			<div className={"prose dark:prose-invert"}>
				<h2>{meta?.emoji}{meta?.title}</h2>
			</div>
			<div className={"mt-3 component prose dark:prose-invert"}>
				<Suspense key={slug} fallback={"Loading..."}>
					<BlogPostMDX slug={slug} />
				</Suspense>
			</div>
		</>
	)
}