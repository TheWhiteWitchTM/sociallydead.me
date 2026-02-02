// app/lib/metadata.ts
import type { Metadata } from 'next'

const siteUrl = 'https://thewhitewitchtm.sociallydead.me'
const siteName = "🧙‍♀️The White Witch™✨"
const defaultTitle = "🧙‍♀️The White Witch™✨"
const defaultDescription = "🧙‍♀️The White Witch™✨"

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
	authors: [{ name: 'The White Witch', url: siteUrl }],
	creator: 'The White Witch',

	// Open Graph
	openGraph: {
		title: defaultTitle,
		description: defaultDescription,
		url: siteUrl,
		siteName,
		images: [
			{
				url: '/banner.jpg',
				alt: "The White Witch",
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