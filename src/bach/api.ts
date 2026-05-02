import type { CollectionEntry } from 'astro:content'
import type { ArticleEntry } from './types'
import type { CollectionEntryData } from './tree'
import type { DocsConfig } from './types'
import type { Endpoint } from './schemas'
import { normalizeEntryId } from './utils'
import { getReferencedCollections, getDefaultCollection, readDocsConfig } from './tree'

/** Generic content collection entry with a title and optional method/sortOrder. */
export interface ContentEntry {
  id: string
  data: {
    title: string
    method?: string
    sortOrder?: number
  } & Record<string, unknown>
}

/** Shape of an API collection entry (has an `endpoint` field). */
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

/** Astro-compatible dynamic collection entry returned by `getCollection()`. */
export interface DynamicCollectionEntry {
  id: string
  collection: string
  body?: string
  data: Record<string, unknown>
  render(): Promise<unknown>
}

/** Type guard: returns true when an entry contains an `endpoint` field. */
export function isApiEntry(entry: { data: Record<string, unknown> }): entry is { data: ApiEntry['data'] } {
  return 'endpoint' in entry.data
}

/**
 * Fetch all entries for a named content collection via Astro's `getCollection`.
 * Logs a `[bach]` warning and re-throws on failure so callers can decide to
 * bail (getStaticPaths) or skip (sidebar generation).
 */
export async function fetchCollection(name: string): Promise<ContentEntry[]> {
  try {
    const { getCollection } = await import('astro:content')
    return await (getCollection as unknown as (name: string) => Promise<ContentEntry[]>)(name)
  } catch (err) {
    console.warn(`[bach] Collection "${name}" could not be loaded:`, err)
    throw err
  }
}

/**
 * Fetch dynamic collection entries (with `render()`) for a named collection.
 * Same error behaviour as {@link fetchCollection}.
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

/** Static path returned by {@link generateStaticPaths}. */
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
 *   return generateStaticPaths()
 * }
 * ```
 */
export async function generateStaticPaths(options?: {
  /** Collection names to include. Defaults to all referenced collections. */
  collections?: string[]
  /** Whether to include the `index` entry. Defaults to `false`. */
  includeIndex?: boolean
}): Promise<StaticPath[]> {
  const config = await readDocsConfig()
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

/** Render a dynamic collection entry to HTML (and headings) via Astro. */
export async function renderEntry(entry: DynamicCollectionEntry) {
  const { render } = await import('astro:content')
  return render(entry as never)
}

/**
 * Normalize Astro `CollectionEntry<'docs'>` items into lightweight
 * `{ slug, title }` objects used by the search index.
 */
export function normalizeCollectionEntries(entries: CollectionEntry<'docs'>[]): ArticleEntry[] {
  return entries.map((entry) => ({
    slug: normalizeEntryId(entry.id),
    title: entry.data.title,
  }))
}

/**
 * Group normalized collection entries by their collection name.
 * Produces the map consumed by {@link buildPages} for `collection`-type groups.
 */
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

/**
 * Build flat lookup maps from all loaded collection entries.
 *
 * - `titleMap`: slug → title (and raw id → title)
 * - `methodMap`: slug → HTTP method (and raw id → method)
 * - `articles`: list of all articles for search indexing
 */
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

/**
 * Load every collection referenced by the docs config.
 * Missing collections are skipped (with a warning) so the sidebar can still
 * render even when a collection is temporarily unavailable.
 */
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
