import type { DocsConfig, SidebarTreeResult, SidebarNode, AdjacentPage, ArticleEntry } from './types'
import type { DynamicCollectionEntry, StaticPath, ApiCollectionData } from './content'
import {
  isApiEntry,
  loadCollections,
  buildCollectionsSidebarData,
  buildSidebarEntryMap,
  fetchCollectionEntries,
} from './content'
import { buildSidebarTree, getDefaultCollection, getReferencedCollections } from './tree'
import { buildBreadcrumbs } from './breadcrumbs'
import { resolveActiveSidebarTree, getAdjacentPages } from './nav'
import { normalizeEntryId } from './utils'

const INTEGRATION_GUIDES_PREFIX = 'integrations/integration-guides/'

async function buildIntegrationIconUrlMap(
  allEntries: Map<string, DynamicCollectionEntry[]>,
  defaultCollection: string
): Promise<Map<string, string>> {
  const iconUrlMap = new Map<string, string>()

  let integrationEntries: DynamicCollectionEntry[] = []
  try {
    integrationEntries = await fetchCollectionEntries('integrations')
  } catch {
    return iconUrlMap
  }

  const integrationIconUrls = new Map<string, string>()
  for (const entry of integrationEntries) {
    const iconUrl = 'iconUrl' in entry.data && typeof entry.data.iconUrl === 'string' ? entry.data.iconUrl : undefined
    if (iconUrl) integrationIconUrls.set(entry.id, iconUrl)
  }

  for (const entry of allEntries.get(defaultCollection) ?? []) {
    if (!entry.id.startsWith(INTEGRATION_GUIDES_PREFIX)) continue
    const integrationSlug = entry.id.slice(INTEGRATION_GUIDES_PREFIX.length).split('/')[0]
    const iconUrl = integrationIconUrls.get(integrationSlug)
    if (!iconUrl) continue
    const normalized = normalizeEntryId(entry.id)
    iconUrlMap.set(normalized, iconUrl)
    iconUrlMap.set(entry.id, iconUrl)
  }

  return iconUrlMap
}

export interface SiteContext {
  config: DocsConfig
  defaultCollection: string
  sidebar: SidebarTreeResult
  titleMap: Map<string, string>
  methodMap: Map<string, string>
  sidebarTitleMap: Map<string, string>
  iconMap: Map<string, string>
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

export class BachSite<TCollection extends string = string> {
  private _config: DocsConfig<TCollection>
  private _siteContextCache: SiteContext | null = null

  constructor(config: DocsConfig<TCollection>) {
    this._config = config
  }

  /** Build (and cache) the global site context. */
  async getContext(): Promise<SiteContext> {
    if (this._siteContextCache) return this._siteContextCache

    const defaultCollection = getDefaultCollection(this._config)
    const allEntries = await loadCollections(this._config)
    const { titleMap, methodMap, sidebarTitleMap, iconMap, articles } = buildCollectionsSidebarData(allEntries)
    const collectionsMap = buildSidebarEntryMap(allEntries)
    const iconUrlMap = await buildIntegrationIconUrlMap(allEntries, defaultCollection)
    const sidebar = await buildSidebarTree(
      this._config,
      titleMap,
      methodMap,
      sidebarTitleMap,
      iconMap,
      collectionsMap,
      iconUrlMap
    )

    const defaultEntriesBySlug = new Map<string, DynamicCollectionEntry>()
    for (const entry of allEntries.get(defaultCollection) ?? []) {
      defaultEntriesBySlug.set(normalizeEntryId(entry.id), entry)
    }

    this._siteContextCache = {
      config: this._config,
      defaultCollection,
      sidebar,
      titleMap,
      methodMap,
      sidebarTitleMap,
      iconMap,
      articles,
      defaultEntriesBySlug,
    }
    return this._siteContextCache
  }

  /**
   * Derive the full page context for a URL path and content entry.
   * @param pathname - The URL pathname for the current page.
   * @param entry - The content collection entry for the page.
   */
  async getPageContext(pathname: string, entry: DynamicCollectionEntry): Promise<PageContext> {
    const siteContext = await this.getContext()

    const isApi = isApiEntry(entry)
    const title = entry.data.title
    const description = entry.data.description
    const apiData = isApi ? entry.data : undefined

    const { activeTab, sidebarTree } = resolveActiveSidebarTree(siteContext.sidebar, pathname)

    let breadcrumbs: { label: string; href?: string }[]
    if (isApi) {
      breadcrumbs = [{ label: apiData!.apiLabel }]
    } else {
      breadcrumbs = await buildBreadcrumbs(
        siteContext.config,
        entry.id,
        title,
        siteContext.titleMap,
        siteContext.sidebarTitleMap,
        siteContext.iconMap
      )
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

  /** Generate Astro `getStaticPaths` entries for all docs collections. */
  async getStaticPaths(options?: {
    /** Collection names to include. Defaults to all referenced collections. */
    collections?: string[]
    /** Whether to include the `index` entry. Defaults to `false`. */
    includeIndex?: boolean
  }): Promise<StaticPath[]> {
    const names = options?.collections ?? Array.from(getReferencedCollections(this._config))
    const defaultCollection = getDefaultCollection(this._config)

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
}
