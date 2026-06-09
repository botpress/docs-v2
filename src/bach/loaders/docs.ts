import { glob, type Loader } from 'astro/loaders'

export type DocsLoaderOptions = {
  pattern: string | string[]
  base: string
}

export const docsLoader = (opts: DocsLoaderOptions): Loader => {
  const inner = glob({ pattern: opts.pattern, base: opts.base })
  return {
    name: 'docs-loader',
    load: async (context) => {
      let numErrors = 0
      await inner.load(context)
      for (const [id, entry] of context.store.entries()) {
        if (entry.data.description === undefined) {
          console.warn(`\x1b[33m[SEO] Missing description (#${++numErrors}): ${id}\x1b[0m`)
        }
      }
    },
  }
}
