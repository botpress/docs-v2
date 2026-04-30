import type { CollectionEntry } from 'astro:content'
import type { ArticleEntry } from './types'
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

export function buildApiEntriesMap(
  apiEntries: { id: string; data: ApiEntryData }[]
): Map<string, { id: string; title: string; method: string }[]> {
  const map = new Map<string, { id: string; title: string; method: string }[]>()
  for (const entry of apiEntries) {
    const { apiSlug } = entry.data
    if (!map.has(apiSlug)) map.set(apiSlug, [])
    map.get(apiSlug)!.push({ id: entry.id, title: entry.data.title, method: entry.data.method })
  }
  return map
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
    titleMap.set(entry.id, entry.data.title)
    methodMap.set(entry.id, entry.data.method)
  }

  return { titleMap, methodMap, articles }
}
