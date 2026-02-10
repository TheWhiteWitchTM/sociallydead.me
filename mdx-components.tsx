import type { MDXComponents } from 'mdx/types'
import { codeToHtml } from 'shiki'

async function Code({ children, className, ...props }: { children: string, className?: string }) {
  const lang = className?.replace('language-', '') || 'text'
  const html = await codeToHtml(children, {
    lang,
    themes: {
      light: 'github-light',
      dark: 'github-dark',
    },
  })

  return <div dangerouslySetInnerHTML={{ __html: html }} />
}

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
    code: (props: any) => {
      if (typeof props.children === 'string') {
        return <Code {...props} />
      }
      return <code {...props} />
    },
  }
}
