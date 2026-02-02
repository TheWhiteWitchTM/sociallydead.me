import nextMDX from '@next/mdx'

const withMDX = nextMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [
      'remark-gfm',  // string name — works great
    ],
    rehypePlugins: [
      'rehype-slug',                    // string
      'rehype-autolink-headings',       // string
      [
        '@shikijs/rehype', {
        theme: 'nord',
        keepBackground: true,
        defaultLang: 'plaintext',
        }
      ],
    ],
  },
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
  reactCompiler: true,
  images: {
    unoptimized: true,
  },
  trailingSlash: false,

  // Optional but recommended: explicitly enable Turbopack if not already via CLI flag
  // (remove if you run with --turbo flag instead)
  // turbopack: {},  // or add rules/customizations if needed
}

export default withMDX(nextConfig)