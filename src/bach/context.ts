import type { DocsConfig, SidebarTreeResult, SidebarNode, AdjacentPage, ArticleEntry } from './types'
import type { DynamicCollectionEntry, ApiCollectionData } from './content'
import { isApiEntry } from './content'
import { readDocsConfig, buildSidebarTree, getDefaultCollection } from './tree'
import { buildBreadcrumbs } from './breadcrumbs'
import { resolveActiveSidebarTree, getAdjacentPages } from './nav'
import { loadCollections, buildCollectionsSidebarData, buildSidebarEntryMap } from './content'
import { normalizeEntryId } from './utils'

export interface SiteContext {
  config: DocsConfig
  defaultCollection: string
  sidebar: SidebarTreeResult
  titleMap: Map<string, string>
  methodMap: Map<string, string>
  articles: ArticleEntry[]
  defaultEntriesBySlug: Map<string, DynamicCollectionEntry>
}

export interface PageContext extends SiteContext {
  entry: DynamicCollectionEntry
  isApi: boolean
  apiData: ApiCollectionData | undefined
  title: string
  description: string | undefined
  activeTab: string | null
  sidebarTree: SidebarNode[]
  breadcrumbs: { label: string; href?: string }[]
  prev: AdjacentPage | null
  next: AdjacentPage | null
}

let _siteContextCache: SiteContext | null = null

/**
 * Build the global site context from the docs config.
 * The result is memoized for the lifetime of the process.
 */
export async function getSiteContext(): Promise<SiteContext> {
  if (_siteContextCache) return _siteContextCache

  const config = await readDocsConfig()
  const defaultCollection = getDefaultCollection(config)
  const allEntries = await loadCollections(config)
  const { titleMap, methodMap, articles } = buildCollectionsSidebarData(allEntries)
  const collectionsMap = buildSidebarEntryMap(allEntries)
  const sidebar = await buildSidebarTree(titleMap, methodMap, collectionsMap)

  const defaultEntriesBySlug = new Map<string, DynamicCollectionEntry>()
  for (const entry of allEntries.get(defaultCollection) ?? []) {
    defaultEntriesBySlug.set(normalizeEntryId(entry.id), entry)
  }

  _siteContextCache = { config, defaultCollection, sidebar, titleMap, methodMap, articles, defaultEntriesBySlug }
  return _siteContextCache
}

/**
 * Derive the full page context for a given URL path and content entry.
 * Internally calls {@link getSiteContext} so the site-wide data is only built once.
 */
export async function getPageContext(pathname: string, entry: DynamicCollectionEntry): Promise<PageContext> {
  const site = await getSiteContext()

  const isApi = isApiEntry(entry)
  const title = entry.data.title
  const description = entry.data.description
  const apiData = isApi ? entry.data : undefined

  const { activeTab, sidebarTree } = resolveActiveSidebarTree(site.sidebar, pathname)

  let breadcrumbs: { label: string; href?: string }[]
  if (isApi) {
    breadcrumbs = [{ label: apiData!.apiLabel }]
  } else {
    breadcrumbs = await buildBreadcrumbs(entry.id, title, site.titleMap)
  }

  const { prev, next } = getAdjacentPages(sidebarTree, pathname)

  return {
    ...site,
    entry,
    isApi,
    apiData,
    title,
    description,
    activeTab,
    sidebarTree,
    breadcrumbs,
    prev,
    next,
  }
}
