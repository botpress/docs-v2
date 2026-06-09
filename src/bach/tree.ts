import type {
  SidebarNode,
  SidebarCategoryNode,
  SidebarArticleNode,
  SidebarTreeResult,
  TabInfo,
  PageItem,
  DocsConfig,
} from './types'
import { slugify, normalizePagePath, lastSegment, titleFromSlug, withBase, stripBase } from './utils'

// --- Collection reference collector ---

/**
 * Walk the navigation config and collect every collection name referenced by a
 * `collection` group. Always includes `config.defaultCollection`.
 */
export function getReferencedCollections<TCollection extends string>(
  config: DocsConfig<TCollection>
): Set<TCollection> {
  const refs = new Set<TCollection>()
  refs.add(config.defaultCollection)
  for (const tab of config.navigation.tabs) {
    if (tab.pages) _collectFromPages(tab.pages, refs)
  }
  return refs
}

/** Return the default collection name from the docs config. */
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

/** Lightweight metadata extracted from a content collection entry. */
export interface CollectionEntryData {
  id: string
  title: string
  sidebarTitle?: string
  method?: string
  icon?: string
  iconUrl?: string
  sortOrder?: number
}

/**
 * Recursively build sidebar nodes from the navigation config.
 *
 * - Plain strings become article nodes (title resolved from `titleMap`).
 * - Groups with a `collection` become category nodes whose children are pulled
 *   from `collectionsMap` and sorted by `sortOrder` then `id`.
 * - Groups with explicit `pages` become nested category nodes.
 */
export function buildPages<TCollection extends string>(
  pages: PageItem<TCollection>[],
  depth: number,
  parentPath: string,
  titleMap: Map<string, string>,
  methodMap: Map<string, string>,
  sidebarTitleMap: Map<string, string>,
  iconMap: Map<string, string>,
  collectionsMap?: Map<TCollection, CollectionEntryData[]>,
  iconUrlMap?: Map<string, string>
): SidebarNode[] {
  const nodes: SidebarNode[] = []

  for (const item of pages) {
    if (typeof item === 'string') {
      const pagePath = item
      const normalizedPath = normalizePagePath(pagePath)
      const href = normalizedPath === 'index' ? withBase('/') : withBase(`/${normalizedPath}`)
      const title = titleMap.get(normalizedPath) ?? titleFromSlug(lastSegment(pagePath))

      const articleNode: SidebarArticleNode = {
        type: 'article',
        title,
        sidebarTitle: sidebarTitleMap.get(normalizedPath),
        href,
        path: normalizedPath,
        method: methodMap.get(normalizedPath),
        icon: iconMap.get(normalizedPath),
        iconUrl: iconUrlMap?.get(normalizedPath),
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
          icon: item.icon,
          children: sortedEntries.map((entry) => ({
            type: 'article',
            title: entry.title,
            sidebarTitle: entry.sidebarTitle,
            href: withBase(`/${entry.id}`),
            path: entry.id,
            method: entry.method,
            icon: entry.icon,
            iconUrl: entry.iconUrl,
          })),
        }
        nodes.push(categoryNode)
        continue
      }

      if (item.root && depth > 0) {
        const rootNormalized = normalizePagePath(item.root)
        href = rootNormalized === 'index' ? withBase('/') : withBase(`/${rootNormalized}`)

        childrenPages = item.pages.filter((p) => {
          if (typeof p === 'string') {
            return normalizePagePath(p) !== rootNormalized
          }
          return true
        })
      } else {
        childrenPages = item.pages
      }

      const children = buildPages(
        childrenPages,
        depth + 1,
        groupPath,
        titleMap,
        methodMap,
        sidebarTitleMap,
        iconMap,
        collectionsMap,
        iconUrlMap
      )

      const categoryNode: SidebarCategoryNode = {
        type: 'category',
        label: item.group,
        slug: groupSlug,
        path: groupPath,
        href: depth > 0 ? href : undefined,
        icon: item.icon,
        children,
      }
      nodes.push(categoryNode)
    }
  }

  return nodes
}

/** Return the href of the first article node encountered in a depth-first walk. */
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

/**
 * Collect every URL slug represented by a tree of sidebar nodes.
 * Includes article paths, category root hrefs, and all nested children.
 */
export function collectAllSlugs(nodes: SidebarNode[]): string[] {
  const slugs: string[] = []
  for (const node of nodes) {
    if (node.type === 'article') {
      slugs.push(node.path)
    } else {
      if (node.href) {
        const hrefPath = stripBase(node.href).replace(/^\//, '') || 'index'
        slugs.push(hrefPath)
      }
      slugs.push(...collectAllSlugs(node.children))
    }
  }
  return slugs
}

/**
 * Build the complete sidebar tree for every tab defined in `bach.config.ts`.
 *
 * Returns tab metadata, per-tab trees, and a slug→tab lookup map used by
 * {@link resolveActiveSidebarTree}.
 */
export async function buildSidebarTree<TCollection extends string>(
  config: DocsConfig<TCollection>,
  titleMap: Map<string, string>,
  methodMap?: Map<string, string>,
  sidebarTitleMap?: Map<string, string>,
  iconMap?: Map<string, string>,
  collectionsMap?: Map<TCollection, CollectionEntryData[]>,
  iconUrlMap?: Map<string, string>
): Promise<SidebarTreeResult> {
  const _methodMap = methodMap ?? new Map()
  const _sidebarTitleMap = sidebarTitleMap ?? new Map()
  const _iconMap = iconMap ?? new Map()

  const tabs: TabInfo[] = []
  const trees: Record<string, SidebarNode[]> = {}
  const slugToTab: Record<string, string> = {}

  for (const tabItem of config.navigation.tabs) {
    const tabSlug = slugify(tabItem.tab)

    if (tabItem.href !== undefined && !tabItem.pages) {
      tabs.push({
        slug: tabSlug,
        label: tabItem.tab,
        href: tabItem.href,
        external: tabItem.external ?? tabItem.href.startsWith('http'),
      })
      continue
    }

    const tabTree = buildPages(
      tabItem.pages ?? [],
      0,
      '',
      titleMap,
      _methodMap,
      _sidebarTitleMap,
      _iconMap,
      collectionsMap,
      iconUrlMap
    )

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
