import type { CollectionEntry } from 'astro:content'
import type { ArticleEntry } from './types'
import type { CollectionEntryData } from './tree'
import type { Endpoint } from './schemas'
import { normalizeSlug } from './utils'

export interface ContentEntry {
  id: string
  data: {
    title: string
    method?: string
    sortOrder?: number
  } & Record<string, unknown>
}

export interface ApiEntry {
  id: string
  data: {
    title: string
    description?: string
    method: string
    apiSlug: string
    apiLabel: string
    sortOrder: number
    endpoint: Endpoint
  }
}

export interface DynamicCollectionEntry {
  id: string
  collection: string
  body?: string
  data: Record<string, unknown>
  render(): Promise<unknown>
}

export function isApiEntry(entry: { data: Record<string, unknown> }): entry is { data: ApiEntry['data'] } {
  return 'endpoint' in entry.data
}

export async function fetchCollection(name: string): Promise<ContentEntry[]> {
  const { getCollection } = await import('astro:content')
  const entries = await (getCollection as unknown as (name: string) => Promise<ContentEntry[]>)(name)
  return entries
}

export async function fetchCollectionEntries(name: string): Promise<DynamicCollectionEntry[]> {
  const { getCollection } = await import('astro:content')
  const entries = await (getCollection as unknown as (name: string) => Promise<DynamicCollectionEntry[]>)(name)
  return entries
}

export async function renderEntry(entry: DynamicCollectionEntry) {
  const { render } = await import('astro:content')
  return render(entry as never)
}

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

export function buildSidebarEntryMap<TCollection extends string>(
  allEntries: Map<TCollection, ContentEntry[]>
): Map<TCollection, CollectionEntryData[]> {
  const map = new Map<TCollection, CollectionEntryData[]>()
  for (const [collectionName, entries] of allEntries) {
    map.set(
      collectionName,
      entries.map((entry) => ({
        id: entry.id,
        title: entry.data.title,
        method: entry.data.method,
        sortOrder: entry.data.sortOrder,
      }))
    )
  }
  return map
}

export function buildCollectionsSidebarData<TCollection extends string>(allEntries: Map<TCollection, ContentEntry[]>) {
  const titleMap = new Map<string, string>()
  const methodMap = new Map<string, string>()
  const articles: ArticleEntry[] = []

  for (const [, entries] of allEntries) {
    for (const entry of entries) {
      const rawSlug = entry.id.replace(/\.(md|mdx)$/, '')
      const slug = normalizeSlug(rawSlug)
      titleMap.set(slug, entry.data.title)
      titleMap.set(entry.id, entry.data.title)
      if (entry.data.method) {
        methodMap.set(entry.id, entry.data.method)
        methodMap.set(slug, entry.data.method)
      }
      articles.push({
        slug,
        title: entry.data.title,
        method: entry.data.method,
      })
    }
  }

  return { titleMap, methodMap, articles }
}
