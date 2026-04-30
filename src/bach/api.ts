import type { CollectionEntry } from 'astro:content'
import type { SidebarCategoryNode, SidebarArticleNode, ArticleEntry } from './types'
import type { ApiEntryData } from './loaders'
import { normalizeSlug } from './utils'

export function normalizeCollectionEntries(entries: CollectionEntry<'docs'>[]): ArticleEntry[] {
  return entries.map((entry) => {
    const rawSlug = entry.id.replace(/\.(md|mdx)$/, '')
    const slug = normalizeSlug(rawSlug)
    return {
      slug,
      title: entry.data.title,
    }
  })
}

export function buildApiSidebarNodes(apiEntries: { id: string; data: ApiEntryData }[]): SidebarCategoryNode[] {
  const grouped = new Map<string, { label: string; entries: { id: string; data: ApiEntryData }[] }>()

  for (const entry of apiEntries) {
    const { apiSlug, apiLabel } = entry.data
    if (!grouped.has(apiSlug)) {
      grouped.set(apiSlug, { label: apiLabel, entries: [] })
    }
    grouped.get(apiSlug)!.entries.push(entry)
  }

  for (const group of grouped.values()) {
    group.entries.sort((a, b) => a.data.sortOrder - b.data.sortOrder)
  }

  return [...grouped.keys()].map((apiSlug) => {
    const { label, entries } = grouped.get(apiSlug)!

    const articleNodes: SidebarArticleNode[] = entries.map((entry) => ({
      type: 'article',
      title: entry.data.title,
      href: `/api-reference/${entry.id}`,
      path: `api-reference/${entry.id}`,
      method: entry.data.method,
    }))

    const endpointsCategory: SidebarCategoryNode = {
      type: 'category',
      label: 'Endpoints',
      slug: 'endpoints',
      path: `api-reference/${apiSlug}/endpoints`,
      children: articleNodes,
    }

    return {
      type: 'category' as const,
      label,
      slug: apiSlug,
      path: `api-reference/${apiSlug}`,
      children: [endpointsCategory],
    }
  })
}

export function buildApiSidebarData(
  docsEntries: CollectionEntry<'docs'>[],
  apiEntries: { id: string; data: ApiEntryData }[],
  _contentDir: string
) {
  const articles = normalizeCollectionEntries(docsEntries)
  const titleMap = new Map<string, string>()
  const methodMap = new Map<string, string>()

  for (const a of articles) {
    titleMap.set(a.slug, a.title)
    if (a.method) methodMap.set(a.slug, a.method)
  }

  for (const entry of apiEntries) {
    const slug = `api-reference/${entry.id}`
    titleMap.set(slug, entry.data.title)
    methodMap.set(slug, entry.data.method)
  }

  return { titleMap, methodMap, articles }
}
