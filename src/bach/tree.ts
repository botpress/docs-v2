import type {
  SidebarNode,
  SidebarCategoryNode,
  SidebarArticleNode,
  SidebarTreeResult,
  TabInfo,
  PageItem,
} from './types'
import { slugify, normalizePagePath, lastSegment, titleFromSlug } from './utils'

// --- Config reader ---

let _docsConfigCache: import('./types').DocsConfig | null = null

export async function readDocsConfig(): Promise<import('./types').DocsConfig> {
  if (_docsConfigCache) return _docsConfigCache
  const { default: config } = await import('../../docs.config')
  _docsConfigCache = config
  return config
}

// --- Tree builder ---

export function buildPages(
  pages: PageItem[],
  depth: number,
  parentPath: string,
  titleMap: Map<string, string>,
  methodMap: Map<string, string>,
  apiEntries?: Map<string, { id: string; title: string; method: string }[]>
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
      let childrenPages = item.pages

      if (item.root && depth > 0) {
        const rootNormalized = normalizePagePath(item.root)
        href = rootNormalized === 'index' ? '/' : `/${rootNormalized}`

        childrenPages = item.pages.filter((p) => {
          if (typeof p === 'string') {
            return normalizePagePath(p) !== rootNormalized
          }
          return true
        })
      }

      const children = buildPages(childrenPages, depth + 1, groupPath, titleMap, methodMap, apiEntries)

      if (item.openapi && apiEntries) {
        const slug = 'api' in item.openapi ? item.openapi.slug : item.openapi.slug
        const entries = apiEntries.get(slug)
        if (entries) {
          for (const entry of entries) {
            const articleNode: SidebarArticleNode = {
              type: 'article',
              title: entry.title,
              href: `/${entry.id}`,
              path: entry.id,
              method: entry.method,
            }
            children.push(articleNode)
          }
        }
      }

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

export async function buildSidebarTree(
  titleMap: Map<string, string>,
  _contentDir: string,
  methodMap?: Map<string, string>,
  apiEntries?: Map<string, { id: string; title: string; method: string }[]>
): Promise<SidebarTreeResult> {
  const docsConfig = await readDocsConfig()
  const _methodMap = methodMap ?? new Map()

  const tabs: TabInfo[] = []
  const trees: Record<string, SidebarNode[]> = {}
  const slugToTab: Record<string, string> = {}

  for (const tabItem of docsConfig.navigation.tabs) {
    const tabSlug = slugify(tabItem.tab)
    const tabTree = buildPages(tabItem.pages, 0, '', titleMap, _methodMap, apiEntries)

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
