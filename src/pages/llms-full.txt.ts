import type { APIRoute } from 'astro'
import { toMarkdownHref } from '../lib/markdown-routes'
import { getSiteContext } from '@/bach'
import type { DynamicCollectionEntry } from '@/bach/content'
import type { SidebarNode } from '@/bach/types'

const SITE_URL = 'https://botpress.com/docs'

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

function serializeEntry(entry: DynamicCollectionEntry, slug: string): string {
  const sourceUrl = slug === 'index' ? SITE_URL : `${SITE_URL}/${slug}`
  const sections = [`# ${entry.data.title}`, `Source: ${sourceUrl}`]
  const description = entry.data.description?.trim()
  const body = rewriteInternalLinks(stripMdxPreamble(entry.body ?? '').trim())

  if (description) sections.push(description)
  if (body) sections.push(body)

  return sections.join('\n\n')
}

function collectOrderedSlugs(nodes: SidebarNode[]): string[] {
  const slugs: string[] = []
  for (const node of nodes) {
    if (node.type === 'article') {
      slugs.push(node.path)
    } else {
      if (node.href) {
        const hrefPath = node.href.replace(/^\//, '') || 'index'
        slugs.push(hrefPath)
      }
      slugs.push(...collectOrderedSlugs(node.children))
    }
  }
  return slugs
}

export const GET: APIRoute = async () => {
  const { defaultEntriesBySlug, sidebar } = await getSiteContext()

  const orderedSlugs: string[] = []
  if (sidebar.tabs.length > 0) {
    for (const tab of sidebar.tabs) {
      const tree = sidebar.trees[tab.slug]
      if (tree) orderedSlugs.push(...collectOrderedSlugs(tree))
    }
  } else {
    orderedSlugs.push(...collectOrderedSlugs(sidebar.defaultTree))
  }

  const serialized: string[] = []
  const seen = new Set<string>()

  for (const slug of orderedSlugs) {
    if (seen.has(slug)) continue
    seen.add(slug)
    const entry = defaultEntriesBySlug.get(slug)
    if (entry) serialized.push(serializeEntry(entry, slug))
  }

  for (const [slug, entry] of defaultEntriesBySlug) {
    if (seen.has(slug)) continue
    seen.add(slug)
    serialized.push(serializeEntry(entry, slug))
  }

  const body = serialized.join('\n\n---\n\n') + '\n'

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
