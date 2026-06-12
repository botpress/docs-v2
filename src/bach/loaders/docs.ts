import { execFile } from 'node:child_process'
import path from 'node:path'
import { promisify } from 'node:util'
import { glob, type Loader } from 'astro/loaders'

const execFileAsync = promisify(execFile)

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

      await Promise.all(
        context.store.entries().map(async ([id, entry]) => {
          if (entry.data.description === undefined) {
            console.warn(`\x1b[33m[SEO] Missing description (#${++numErrors}): ${id}\x1b[0m`)
          }

          const data = await context.parseData({
            id,
            data: {
              ...entry.data,
              lastModified: entry.filePath ? await getLastModifiedDate(entry.filePath) : null,
            },
          })

          context.store.set({
            ...entry,
            data,
            digest: context.generateDigest({
              body: entry.body ?? '',
              data,
            }),
          })
        })
      )
    },
  }
}

async function getLastModifiedDate(filePath: string): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync('git', ['log', '-1', '--follow', '--format=%aI', '--', filePath], {
      cwd: path.dirname(filePath),
    })

    return stdout.trim() || null
  } catch {
    return null
  }
}
