import {categoriesMeta} from "@/next-blog/meta/categories-meta";
import {Feed} from "@/next-blog/ui/Feed";
import {Suspense} from "react";
import {id} from "zod/locales";

type Props = {
	slug: string     // ← Promise in Next.js 15+
};

export default function ({slug}: Props) {
	const meta = categoriesMeta.find((category) => category.slug === slug);

	return (
		<div className={"prose dark:prose-invert"}>
			<h2>{meta?.emoji}{meta?.title}</h2>
			<Suspense key={slug} fallback={"Loading---"}>
				<Feed key={slug} category={slug}/>
			</Suspense>
		</div>
	)
}