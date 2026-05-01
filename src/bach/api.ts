import type { CollectionEntry } from 'astro:content'
import type { ArticleEntry, SidebarTreeResult } from './types'
import type { CollectionEntryData } from './tree'
import type { DocsConfig } from './types'
import type { Endpoint } from './schemas'
import { normalizeEntryId } from './utils'
import { getReferencedCollections, buildSidebarTree } from './tree'

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
  try {
    const { getCollection } = await import('astro:content')
    return await (getCollection as unknown as (name: string) => Promise<ContentEntry[]>)(name)
  } catch (err) {
    console.warn(`[bach] Collection "${name}" could not be loaded:`, err)
    throw err
  }
}

export async function fetchCollectionEntries(name: string): Promise<DynamicCollectionEntry[]> {
  try {
    const { getCollection } = await import('astro:content')
    return await (getCollection as unknown as (name: string) => Promise<DynamicCollectionEntry[]>)(name)
  } catch (err) {
    console.warn(`[bach] Collection "${name}" could not be loaded:`, err)
    throw err
  }
}

export async function renderEntry(entry: DynamicCollectionEntry) {
  const { render } = await import('astro:content')
  return render(entry as never)
}

export function normalizeCollectionEntries(entries: CollectionEntry<'docs'>[]): ArticleEntry[] {
  return entries.map((entry) => ({
    slug: normalizeEntryId(entry.id),
    title: entry.data.title,
  }))
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
      const slug = normalizeEntryId(entry.id)
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

export async function loadCollections<TCollection extends string>(
  config: DocsConfig<TCollection>
): Promise<Map<TCollection, ContentEntry[]>> {
  const names = Array.from(getReferencedCollections(config))
  const allEntries = new Map<TCollection, ContentEntry[]>()
  for (const name of names) {
    try {
      const entries = await fetchCollection(name)
      allEntries.set(name, entries)
    } catch {
      // Warning already logged by fetchCollection; skip from sidebar
    }
  }
  return allEntries
}

export async function getSidebarTree<TCollection extends string>(
  config: DocsConfig<TCollection>
): Promise<{
  treeResult: SidebarTreeResult
  titleMap: Map<string, string>
  methodMap: Map<string, string>
  collectionsMap: Map<TCollection, CollectionEntryData[]>
}> {
  const allEntries = await loadCollections(config)
  const { titleMap, methodMap } = buildCollectionsSidebarData(allEntries)
  const collectionsMap = buildSidebarEntryMap(allEntries)
  const treeResult = await buildSidebarTree(titleMap, methodMap, collectionsMap)
  return { treeResult, titleMap, methodMap, collectionsMap }
}
