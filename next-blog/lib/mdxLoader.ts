import { notFound } from 'next/navigation';

export async function mdxLoader(slug: string) {
	try {
		const { default: MDXContent } = await import(`../../blog/${slug}/page.mdx`);
		return MDXContent
	} catch (e) {
		notFound();
	}
}