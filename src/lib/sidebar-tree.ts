import type { CollectionEntry } from 'astro:content'
import fs from 'node:fs'
import path from 'node:path'
import type { SidebarNode, SidebarCategoryNode, SidebarArticleNode, SidebarTreeResult, TabInfo } from './sidebar-types'
import type { ApiEntryData } from '@/astro/loaders/api-loader'

export type { SidebarNode, SidebarCategoryNode, SidebarArticleNode, SidebarTreeResult, TabInfo } from './sidebar-types'
export { isPathActive, hasActiveChild } from './sidebar-types'

// --- Interfaces ---

export interface AdjacentPage {
  title: string
  href: string
}

export interface AdjacentPages {
  prev: AdjacentPage | null
  next: AdjacentPage | null
}

export interface ArticleEntry {
  slug: string
  title: string
  method?: string
}

// --- docs.json types ---

interface GroupItem {
  group: string
  root?: string
  pages: PageItem[]
}

type PageItem = string | GroupItem

interface TabItem {
  tab: string
  pages: PageItem[]
}

interface DocsJson {
  navigation: {
    tabs: TabItem[]
  }
}

// --- Utilities ---

function titleFromSlug(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-')
}

function normalizePagePath(pagePath: string): string {
  if (pagePath === 'index') return 'index'
  return pagePath.replace(/\/index$/, '')
}

function normalizeSlug(rawSlug: string): string {
  if (rawSlug === 'index') return 'index'
  return rawSlug.replace(/\/index$/, '')
}

function lastSegment(pagePath: string): string {
  const parts = pagePath.split('/')
  return parts[parts.length - 1]!
}

// --- docs.json reader ---

let _docsJsonCache: DocsJson | null = null

function readDocsJson(): DocsJson {
  if (_docsJsonCache) return _docsJsonCache
  const docsJsonPath = path.resolve('./docs.json')
  try {
    const raw = fs.readFileSync(docsJsonPath, 'utf-8')
    _docsJsonCache = JSON.parse(raw) as DocsJson
    return _docsJsonCache
  } catch (err) {
    throw new Error(`Failed to read docs.json: ${err}`)
  }
}

// --- Tree builder ---

function buildPages(
  pages: PageItem[],
  depth: number,
  parentPath: string,
  titleMap: Map<string, string>,
  methodMap: Map<string, string>
): SidebarNode[] {
  const nodes: SidebarNode[] = []

  for (const item of pages) {
    if (typeof item === 'string') {
      // Page path
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
      // Group
      const groupSlug = slugify(item.group)
      const groupPath = parentPath ? `${parentPath}/${groupSlug}` : groupSlug

      let href: string | undefined
      let childrenPages = item.pages

      if (item.root && depth > 0) {
        // Nested group with root: root page is the group href, excluded from children
        const rootNormalized = normalizePagePath(item.root)
        href = rootNormalized === 'index' ? '/' : `/${rootNormalized}`

        // Filter out the root page from children
        childrenPages = item.pages.filter((p) => {
          if (typeof p === 'string') {
            return normalizePagePath(p) !== rootNormalized
          }
          return true
        })
      }

      const children = buildPages(childrenPages, depth + 1, groupPath, titleMap, methodMap)

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

function findFirstHref(nodes: SidebarNode[]): string | null {
  for (const node of nodes) {
    if (node.type === 'article') return node.href
    if (node.type === 'category') {
      const href = findFirstHref(node.children)
      if (href) return href
    }
  }
  return null
}

function collectAllSlugs(nodes: SidebarNode[]): string[] {
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

export function buildSidebarTree(
  titleMap: Map<string, string>,
  _contentDir: string,
  methodMap?: Map<string, string>,
  apiNodes?: SidebarCategoryNode[]
): SidebarTreeResult {
  const docsJson = readDocsJson()
  const _methodMap = methodMap ?? new Map()

  const tabs: TabInfo[] = []
  const trees: Record<string, SidebarNode[]> = {}
  const slugToTab: Record<string, string> = {}

  for (const tabItem of docsJson.navigation.tabs) {
    const tabSlug = slugify(tabItem.tab)
    const tabTree = buildPages(tabItem.pages, 0, '', titleMap, _methodMap)

    // Inject API nodes into API Reference tab
    if (tabSlug === 'api-reference' && apiNodes?.length) {
      for (const apiNode of apiNodes) {
        tabTree.push(apiNode)
        collectSlugsFromNodes([apiNode], slugToTab, tabSlug)
      }
    }

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

// --- Breadcrumbs ---

function searchPagesForBreadcrumbs(
  pagePath: string,
  pages: PageItem[],
  prefix: { label: string; href: string }[],
  titleMap: Map<string, string>
): { label: string; href: string }[] | null {
  const normalizedTarget = normalizePagePath(pagePath)

  for (const item of pages) {
    if (typeof item === 'string') {
      if (normalizePagePath(item) === normalizedTarget) {
        const href = normalizedTarget === 'index' ? '/' : `/${normalizedTarget}`
        return [...prefix, { label: titleMap.get(normalizedTarget) ?? titleFromSlug(lastSegment(item)), href }]
      }
    } else {
      const groupPrefix = [...prefix]
      if (item.root) {
        const rootNormalized = normalizePagePath(item.root)
        groupPrefix.push({
          label: item.group,
          href: rootNormalized === 'index' ? '/' : `/${rootNormalized}`,
        })
        // If this group's root IS the target page, return breadcrumbs up to and including this group
        if (rootNormalized === normalizedTarget) {
          return groupPrefix
        }
      } else {
        // Find first page href for breadcrumb link
        const firstChildHref = findFirstHref(buildPages(item.pages, 0, '', titleMap, new Map()))
        groupPrefix.push({ label: item.group, href: firstChildHref ?? '/' })
      }

      const result = searchPagesForBreadcrumbs(pagePath, item.pages, groupPrefix, titleMap)
      if (result) return result
    }
  }

  return null
}

export function buildBreadcrumbs(
  entryId: string,
  _contentDir: string,
  pageTitle: string,
  titleMap: Map<string, string>
): { label: string; href: string }[] {
  const rawSlug = entryId.replace(/\.(md|mdx)$/, '')
  const pagePath = normalizeSlug(rawSlug)

  const docsJson = readDocsJson()

  for (const tab of docsJson.navigation.tabs) {
    const crumbs = searchPagesForBreadcrumbs(pagePath, tab.pages, [], titleMap)
    if (crumbs) {
      // Remove the active page itself — breadcrumbs show only the parent path
      return crumbs.slice(0, -1)
    }
  }

  // Fallback: just the page title
  return [{ label: pageTitle, href: '/' }]
}

// --- Collection normalization ---

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

// --- API sidebar nodes ---

export function buildApiSidebarNodes(apiEntries: { id: string; data: ApiEntryData }[]): SidebarCategoryNode[] {
  const grouped = new Map<string, { label: string; entries: { id: string; data: ApiEntryData }[] }>()

  for (const entry of apiEntries) {
    const { apiSlug, apiLabel } = entry.data
    if (!grouped.has(apiSlug)) {
      grouped.set(apiSlug, { label: apiLabel, entries: [] })
    }
    grouped.get(apiSlug)!.entries.push(entry)
  }

  for (const group of grouped.values()) {
    group.entries.sort((a, b) => a.data.sortOrder - b.data.sortOrder)
  }

  return [...grouped.keys()].map((apiSlug) => {
    const { label, entries } = grouped.get(apiSlug)!

    const articleNodes: SidebarArticleNode[] = entries.map((entry) => ({
      type: 'article',
      title: entry.data.title,
      href: `/api-reference/${entry.id}`,
      path: `api-reference/${entry.id}`,
      method: entry.data.method,
    }))

    const endpointsCategory: SidebarCategoryNode = {
      type: 'category',
      label: 'Endpoints',
      slug: 'endpoints',
      path: `api-reference/${apiSlug}/endpoints`,
      children: articleNodes,
    }

    return {
      type: 'category' as const,
      label,
      slug: apiSlug,
      path: `api-reference/${apiSlug}`,
      children: [endpointsCategory],
    }
  })
}

// --- API sidebar data ---

export function buildApiSidebarData(
  docsEntries: CollectionEntry<'docs'>[],
  apiEntries: { id: string; data: ApiEntryData }[],
  _contentDir: string
) {
  const articles = normalizeCollectionEntries(docsEntries)
  const titleMap = new Map<string, string>()
  const methodMap = new Map<string, string>()

  for (const a of articles) {
    titleMap.set(a.slug, a.title)
    if (a.method) methodMap.set(a.slug, a.method)
  }

  for (const entry of apiEntries) {
    const slug = `api-reference/${entry.id}`
    titleMap.set(slug, entry.data.title)
    methodMap.set(slug, entry.data.method)
  }

  return { titleMap, methodMap, articles }
}

// --- Tree utilities ---

function collectSlugsFromNodes(nodes: SidebarNode[], slugToTab: Record<string, string>, tab: string) {
  for (const node of nodes) {
    if (node.type === 'article') {
      slugToTab[node.path] = tab
    } else {
      collectSlugsFromNodes(node.children, slugToTab, tab)
    }
  }
}

function flattenTree(nodes: SidebarNode[]): AdjacentPage[] {
  const pages: AdjacentPage[] = []
  for (const node of nodes) {
    if (node.type === 'article') {
      pages.push({ title: node.title, href: node.href })
    } else if (node.type === 'category') {
      if (node.href) {
        pages.push({ title: node.label, href: node.href })
      }
      pages.push(...flattenTree(node.children))
    }
  }
  return pages
}

export function getAdjacentPages(nodes: SidebarNode[], currentPath: string): AdjacentPages {
  const flat = flattenTree(nodes)
  const normalized = currentPath.endsWith('/') ? currentPath.slice(0, -1) : currentPath
  const idx = flat.findIndex((p) => {
    const href = p.href.endsWith('/') ? p.href.slice(0, -1) : p.href
    return href === normalized
  })

  return {
    prev: idx > 0 ? flat[idx - 1]! : null,
    next: idx >= 0 && idx < flat.length - 1 ? flat[idx + 1]! : null,
  }
}

export function getActiveTab(pathname: string, slugToTab: Record<string, string>): string | null {
  const normalized = pathname.replace(/^\/|\/$/g, '') || 'index'
  if (slugToTab[normalized]) return slugToTab[normalized]

  for (const [slug, tab] of Object.entries(slugToTab)) {
    if (normalized.startsWith(slug + '/') || normalized === slug) return tab
  }

  return null
}
