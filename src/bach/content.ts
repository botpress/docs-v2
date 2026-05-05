import type { CollectionEntry, DataEntryMap } from 'astro:content'
import type { ArticleEntry } from './types'
import type { CollectionEntryData } from './tree'
import type { DocsConfig } from './types'
import { normalizeEntryId } from './utils'
import { getReferencedCollections, getDefaultCollection } from './tree'

export type DynamicCollectionEntry = CollectionEntry<keyof DataEntryMap>

/** Data shape of API collection entries (narrowed from the union). */
export type ApiCollectionData = Extract<DynamicCollectionEntry['data'], { endpoint: unknown }>

/** Type guard: returns true when an entry contains an `endpoint` field. */
export function isApiEntry(
  entry: DynamicCollectionEntry
): entry is DynamicCollectionEntry & { data: ApiCollectionData } {
  return 'endpoint' in entry.data
}

/**
 * Fetch dynamic collection entries (with `render()`) for a named collection.
 * Logs a `[bach]` warning and re-throws on failure so callers can decide to
 * bail (getStaticPaths) or skip (sidebar generation).
 */
export async function fetchCollectionEntries(name: string): Promise<DynamicCollectionEntry[]> {
  try {
    const { getCollection } = await import('astro:content')
    return await (getCollection as unknown as (name: string) => Promise<DynamicCollectionEntry[]>)(name)
  } catch (err) {
    console.warn(`[bach] Collection "${name}" could not be loaded:`, err)
    throw err
  }
}

/** Static path returned by {@link getStaticPaths}. */
export interface StaticPath {
  params: { slug: string }
  props: {
    entry: DynamicCollectionEntry
    collectionName: string
  }
}

/**
 * Generate Astro `getStaticPaths` entries for all docs collections.
 *
 * By default walks every collection referenced in the docs config, skips the
 * `index` entry, and resolves slugs the same way `[...slug].astro` does:
 * default-collection entries use `normalizeEntryId`, others keep their raw id.
 *
 * @example
 * ```ts
 * export async function getStaticPaths() {
 *   return getStaticPaths()
 * }
 * ```
 */
export async function getStaticPaths(
  config: DocsConfig,
  options?: {
    /** Collection names to include. Defaults to all referenced collections. */
    collections?: string[]
    /** Whether to include the `index` entry. Defaults to `false`. */
    includeIndex?: boolean
  }
): Promise<StaticPath[]> {
  const names = options?.collections ?? Array.from(getReferencedCollections(config))
  const defaultCollection = getDefaultCollection(config)

  const allPaths: StaticPath[] = []

  for (const name of names) {
    try {
      const entries = await fetchCollectionEntries(name)
      for (const entry of entries) {
        const slug = name === defaultCollection ? normalizeEntryId(entry.id) : entry.id
        if (!options?.includeIndex && slug === 'index') continue
        allPaths.push({
          params: { slug },
          props: { entry, collectionName: name },
        })
      }
    } catch {
      // Skip missing collections
    }
  }

  return allPaths
}

/**
 * Group normalized collection entries by their collection name.
 * Produces the map consumed by {@link buildPages} for `collection`-type groups.
 */
export function buildSidebarEntryMap(
  allEntries: Map<string, DynamicCollectionEntry[]>
): Map<string, CollectionEntryData[]> {
  const map = new Map<string, CollectionEntryData[]>()
  for (const [collectionName, entries] of allEntries) {
    map.set(
      collectionName,
      entries.map((entry) => ({
        id: entry.id,
        title: entry.data.title,
        method: 'method' in entry.data && typeof entry.data.method === 'string' ? entry.data.method : undefined,
        sortOrder:
          'sortOrder' in entry.data && typeof entry.data.sortOrder === 'number' ? entry.data.sortOrder : undefined,
      }))
    )
  }
  return map
}

/**
 * Build flat lookup maps from all loaded collection entries.
 *
 * - `titleMap`: slug → title (and raw id → title)
 * - `methodMap`: slug → HTTP method (and raw id → method)
 * - `articles`: list of all articles for search indexing
 */
export function buildCollectionsSidebarData(allEntries: Map<string, DynamicCollectionEntry[]>) {
  const titleMap = new Map<string, string>()
  const methodMap = new Map<string, string>()
  const articles: ArticleEntry[] = []

  for (const [, entries] of allEntries) {
    for (const entry of entries) {
      const slug = normalizeEntryId(entry.id)
      titleMap.set(slug, entry.data.title)
      titleMap.set(entry.id, entry.data.title)
      const method = 'method' in entry.data && typeof entry.data.method === 'string' ? entry.data.method : undefined
      if (method) {
        methodMap.set(entry.id, method)
        methodMap.set(slug, method)
      }
      articles.push({
        slug,
        title: entry.data.title,
        method,
      })
    }
  }

  return { titleMap, methodMap, articles }
}

/**
 * Load every collection referenced by the docs config.
 * Missing collections are skipped (with a warning) so the sidebar can still
 * render even when a collection is unavailable.
 */
export async function loadCollections(config: DocsConfig<string>): Promise<Map<string, DynamicCollectionEntry[]>> {
  const names = Array.from(getReferencedCollections(config))
  const allEntries = new Map<string, DynamicCollectionEntry[]>()
  for (const name of names) {
    try {
      const entries = await fetchCollectionEntries(name)
      allEntries.set(name, entries)
    } catch {
      // Warning already logged by fetchCollectionEntries; skip from sidebar
    }
  }
  return allEntries
}
