import type { APIRoute } from 'astro'
import { toMarkdownHref } from '../lib/markdown-routes'
import { site } from '@/site'
import type { DynamicCollectionEntry } from '@/bach/content'

function stripMdxPreamble(source: string): string {
  return source.replace(/^(?:import\s.+\n)+\n?/, '')
}

function rewriteInternalLinks(source: string): string {
  return source
    .replace(/(?<!!)\]\((\/[^)\s]+)\)/g, (_, href: string) => `](${toMarkdownHref(href)})`)
    .replace(/\bhref=(['"])(\/[^'"]*)\1/g, (_match, quote: string, href: string) => {
      return `href=${quote}${toMarkdownHref(href)}${quote}`
    })
}

function serializeEntry(entry: DynamicCollectionEntry): string {
  const sections = [`# ${entry.data.title}`]
  const description = entry.data.description?.trim()
  const body = rewriteInternalLinks(stripMdxPreamble(entry.body ?? '').trim())

  if (description) sections.push(description)
  if (body) sections.push(body)

  return `${sections.join('\n\n')}\n`
}

export async function getStaticPaths() {
  const { defaultCollection } = await site.getContext()
  return site.getStaticPaths({
    collections: [defaultCollection],
    includeIndex: true,
  })
}

export const GET: APIRoute = async ({ props }) => {
  const { entry } = props as { entry: DynamicCollectionEntry }

  return new Response(serializeEntry(entry), {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
    },
  })
}
