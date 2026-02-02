// types/blog.ts

export type UrlType = 'website' | 'image' | 'video' | 'youtube' | 'embedded';

// ── Common base for all meta types ────────────────────────────────
export interface MetaBase {
	slug: string;
	title: string;
	description?: string;
	date?: string;
	path: string;
	url?: string;
	urlType?: UrlType;
	emoji?: string;
	pinned?: boolean;
	featured?: boolean;
	tags?: string[];          // ← Added: common for posts & categories
}

// ── POST ───────────────────────────────────────────────────────────
export interface PostMetaBase extends MetaBase {
	category?: string;
	excerpt?: string;
	expanded?: boolean;
	long: boolean;
}

export interface PostMeta extends PostMetaBase {
	slug: string;
	title: string;
	description: string;
	date: string;
	category: string;
	path: string;
	emoji: string;
	pinned: boolean;
	featured: boolean;
	expanded: boolean;
	tags: string[];           // now required in full PostMeta
	// url & urlType remain optional
}

// ── CATEGORY ───────────────────────────────────────────────────────
export interface CategoryMetaBase extends MetaBase {
	posts: number;
	latest?: string;
}

export interface CategoryMeta extends CategoryMetaBase {
	slug: string;
	title: string;
	description: string;
	date: string;
	path: string;
	posts: number;
	latest: string;
	tags: string[];           // ← Added: now required in full CategoryMeta
	// url, urlType, emoji, pinned, featured remain optional
}