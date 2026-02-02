import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: "🧙‍♀️The White Witch™✨ App",
		short_name: "White Witch App",
		description: "🧙‍♀️The White Witch™✨ presents the most magic app ever!",
		start_url: '/',
		display: 'standalone',
		background_color: '#000000',
		theme_color: '#ffffff',
		icons: [
			{
				src: '/icon-192x192.png',
				sizes: '192x192',
				type: 'image/png',
			},
			{
				src: '/icon-512x512.png',
				sizes: '512x512',
				type: 'image/png',
			},
		],
	}
}