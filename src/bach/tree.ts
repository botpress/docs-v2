import type {
  SidebarNode,
  SidebarCategoryNode,
  SidebarArticleNode,
  SidebarTreeResult,
  TabInfo,
  PageItem,
  DocsConfig,
} from './types'
import { slugify, normalizePagePath, lastSegment, titleFromSlug } from './utils'

// --- Config reader ---

let _docsConfigCache: DocsConfig | null = null

export async function readDocsConfig(): Promise<DocsConfig> {
  if (_docsConfigCache) return _docsConfigCache
  const { default: config } = await import('../../docs.config')
  _docsConfigCache = config
  return config
}

// --- Collection reference collector ---

export function getReferencedCollections<TCollection extends string>(
  config: DocsConfig<TCollection>
): Set<TCollection> {
  const refs = new Set<TCollection>()
  refs.add(config.defaultCollection)
  for (const tab of config.navigation.tabs) {
    _collectFromPages(tab.pages, refs)
  }
  return refs
}

export function getDefaultCollection<TCollection extends string>(config: DocsConfig<TCollection>): TCollection {
  return config.defaultCollection
}

function _collectFromPages<TCollection extends string>(pages: PageItem<TCollection>[], refs: Set<TCollection>): void {
  for (const item of pages) {
    if (typeof item === 'string') continue
    if ('collection' in item && item.collection) {
      refs.add(item.collection)
    }
    if ('pages' in item && item.pages) {
      _collectFromPages(item.pages, refs)
    }
  }
}

// --- Tree builder ---

export interface CollectionEntryData {
  id: string
  title: string
  method?: string
  sortOrder?: number
}

export function buildPages<TCollection extends string>(
  pages: PageItem<TCollection>[],
  depth: number,
  parentPath: string,
  titleMap: Map<string, string>,
  methodMap: Map<string, string>,
  collectionsMap?: Map<TCollection, CollectionEntryData[]>
): SidebarNode[] {
  const nodes: SidebarNode[] = []

  for (const item of pages) {
    if (typeof item === 'string') {
      const pagePath = item
      const normalizedPath = normalizePagePath(pagePath)
      const href = normalizedPath === 'index' ? '/' : `/${normalizedPath}`
      const title = titleMap.get(normalizedPath) ?? titleFromSlug(lastSegment(pagePath))

      const articleNode: SidebarArticleNode = {
        type: 'article',
        title,
        href,
        path: normalizedPath,
        method: methodMap.get(normalizedPath),
      }
      nodes.push(articleNode)
    } else {
      const groupSlug = slugify(item.group)
      const groupPath = parentPath ? `${parentPath}/${groupSlug}` : groupSlug

      let href: string | undefined
      let childrenPages: PageItem<TCollection>[] = []

      if ('collection' in item) {
        // Collection group: no explicit children
        const entries = collectionsMap?.get(item.collection) ?? []
        // Sort by sortOrder if present, then by id
        const sortedEntries = [...entries].sort((a, b) => {
          const aOrder = a.sortOrder ?? Number.MAX_SAFE_INTEGER
          const bOrder = b.sortOrder ?? Number.MAX_SAFE_INTEGER
          if (aOrder !== bOrder) return aOrder - bOrder
          return a.id.localeCompare(b.id)
        })

        const categoryNode: SidebarCategoryNode = {
          type: 'category',
          label: item.group,
          slug: groupSlug,
          path: groupPath,
          href: depth > 0 ? href : undefined,
          children: sortedEntries.map((entry) => ({
            type: 'article',
            title: entry.title,
            href: `/${entry.id}`,
            path: entry.id,
            method: entry.method,
          })),
        }
        nodes.push(categoryNode)
        continue
      }

      if (item.root && depth > 0) {
        const rootNormalized = normalizePagePath(item.root)
        href = rootNormalized === 'index' ? '/' : `/${rootNormalized}`

        childrenPages = item.pages.filter((p) => {
          if (typeof p === 'string') {
            return normalizePagePath(p) !== rootNormalized
          }
          return true
        })
      } else {
        childrenPages = item.pages
      }

      const children = buildPages(childrenPages, depth + 1, groupPath, titleMap, methodMap, collectionsMap)

      const categoryNode: SidebarCategoryNode = {
        type: 'category',
        label: item.group,
        slug: groupSlug,
        path: groupPath,
        href: depth > 0 ? href : undefined,
        children,
      }
      nodes.push(categoryNode)
    }
  }

  return nodes
}

export function findFirstHref(nodes: SidebarNode[]): string | null {
  for (const node of nodes) {
    if (node.type === 'article') return node.href
    if (node.type === 'category') {
      const href = findFirstHref(node.children)
      if (href) return href
    }
  }
  return null
}

export function collectAllSlugs(nodes: SidebarNode[]): string[] {
  const slugs: string[] = []
  for (const node of nodes) {
    if (node.type === 'article') {
      slugs.push(node.path)
    } else {
      if (node.href) {
        const hrefPath = node.href.replace(/^\//, '') || 'index'
        slugs.push(hrefPath)
      }
      slugs.push(...collectAllSlugs(node.children))
    }
  }
  return slugs
}

export async function buildSidebarTree<TCollection extends string>(
  titleMap: Map<string, string>,
  _contentDir: string,
  methodMap?: Map<string, string>,
  collectionsMap?: Map<TCollection, CollectionEntryData[]>
): Promise<SidebarTreeResult> {
  const docsConfig = await readDocsConfig()
  const _methodMap = methodMap ?? new Map()

  const tabs: TabInfo[] = []
  const trees: Record<string, SidebarNode[]> = {}
  const slugToTab: Record<string, string> = {}

  for (const tabItem of docsConfig.navigation.tabs) {
    const tabSlug = slugify(tabItem.tab)
    const tabTree = buildPages(tabItem.pages, 0, '', titleMap, _methodMap, collectionsMap)

    const firstHref = findFirstHref(tabTree) ?? '/'

    tabs.push({
      slug: tabSlug,
      label: tabItem.tab,
      href: firstHref,
    })

    trees[tabSlug] = tabTree

    for (const slug of collectAllSlugs(tabTree)) {
      slugToTab[slug] = tabSlug
    }
  }

  return { tabs, trees, defaultTree: [], slugToTab }
}
