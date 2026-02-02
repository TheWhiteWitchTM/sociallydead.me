// app/lib/metadata.ts
import type { Metadata } from 'next'

const siteUrl = 'https://sociallydead.me'
const siteName = "sociallydead.me"
const defaultTitle = "sociallydead.me"
const defaultDescription = "sociallydead.me, the darker social network..."

export const baseMetadata: Metadata = {
	// Core
	metadataBase: new URL(siteUrl),
	title: {
		default: defaultTitle,
		template: `%s | ${siteName}`,
	},
	description: defaultDescription,

	// Keywords / authors
	keywords: [
		'blog',
		'games',
		'humor',
	],
	authors: [{ name: 'sociallydead.me', url: siteUrl }],
	creator: 'sociallydead.me',

	// Open Graph
	openGraph: {
		title: defaultTitle,
		description: defaultDescription,
		url: siteUrl,
		siteName,
		images: [
			{
				url: '/banner.jpg',
				alt: "sociallydead-me",
			},
		],
		locale: 'en_US',
		type: 'website',
	},

	// Twitter / X Cards
	twitter: {
		card: 'summary_large_image',
		title: defaultTitle,
		description: defaultDescription,
		site: '@TheWhiteWitchTM',      // ← your actual handle, change if you prefer
		creator: '@TheWhiteWitchTM',
		images: ['/banner.jpg'],
	},

	// ────────────────────────────────────────────────
	//          F A V I C O N   &   I C O N S
	// ────────────────────────────────────────────────
	icons: {
		icon: [
			'/favicon.ixo',
		],
		// Apple Touch Icon for iOS home screen / bookmarks (add the file in public/)
		apple: '/apple-touch-icon.png',
	},
	// Extras
	alternates: {
		canonical: siteUrl,
	},
	robots: {
		index: true,
		follow: true,
	},
}