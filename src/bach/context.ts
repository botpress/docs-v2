import type { DocsConfig, SidebarTreeResult, SidebarNode, AdjacentPage, ArticleEntry } from './types'
import type { DynamicCollectionEntry, ApiCollectionData } from './content'
import { isApiEntry } from './content'
import { buildSidebarTree, getDefaultCollection } from './tree'
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

/**
 * Build the global site context from the docs config.
 */
export async function getSiteContext(config: DocsConfig): Promise<SiteContext> {
  const defaultCollection = getDefaultCollection(config)
  const allEntries = await loadCollections(config)
  const { titleMap, methodMap, articles } = buildCollectionsSidebarData(allEntries)
  const collectionsMap = buildSidebarEntryMap(allEntries)
  const sidebar = await buildSidebarTree(config, titleMap, methodMap, collectionsMap)

  const defaultEntriesBySlug = new Map<string, DynamicCollectionEntry>()
  for (const entry of allEntries.get(defaultCollection) ?? []) {
    defaultEntriesBySlug.set(normalizeEntryId(entry.id), entry)
  }

  return { config, defaultCollection, sidebar, titleMap, methodMap, articles, defaultEntriesBySlug }
}

/**
 * Derive the full page context for a given URL path and content entry.
 */
export async function getPageContext(
  pathname: string,
  entry: DynamicCollectionEntry,
  siteContext: SiteContext
): Promise<PageContext> {
  const isApi = isApiEntry(entry)
  const title = entry.data.title
  const description = entry.data.description
  const apiData = isApi ? entry.data : undefined

  const { activeTab, sidebarTree } = resolveActiveSidebarTree(siteContext.sidebar, pathname)

  let breadcrumbs: { label: string; href?: string }[]
  if (isApi) {
    breadcrumbs = [{ label: apiData!.apiLabel }]
  } else {
    breadcrumbs = await buildBreadcrumbs(siteContext.config, entry.id, title, siteContext.titleMap)
  }

  const { prev, next } = getAdjacentPages(sidebarTree, pathname)

  return {
    ...siteContext,
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
