import type { APIRoute } from 'astro'
import { getCollection, type CollectionEntry } from 'astro:content'
import path from 'node:path'
import { toMarkdownHref } from '../lib/markdown-routes'
import { computeStrippedSlug } from '../lib/sidebar-tree'

const contentDir = path.resolve('./src/content/docs')

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

function serializeEntry(entry: CollectionEntry<'docs'>): string {
  const sections = [`# ${entry.data.title}`]
  const description = entry.data.description?.trim()
  const body = rewriteInternalLinks(stripMdxPreamble(entry.body ?? '').trim())

  if (description) sections.push(description)
  if (body) sections.push(body)

  return `${sections.join('\n\n')}\n`
}

export async function getStaticPaths() {
  const entries = await getCollection('docs')

  return entries.map((entry) => {
    const rawSlug = entry.id.replace(/\.(md|mdx)$/, '')
    const strippedSlug = computeStrippedSlug(rawSlug, contentDir)

    return {
      params: { slug: strippedSlug },
      props: { entry },
    }
  })
}

export const GET: APIRoute = async ({ props }) => {
  const { entry } = props as { entry: CollectionEntry<'docs'> }

  return new Response(serializeEntry(entry), {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
    },
  })
}
