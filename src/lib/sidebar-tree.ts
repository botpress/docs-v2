import type { CollectionEntry } from 'astro:content'
import fs from 'node:fs'
import path from 'node:path'
import type { SidebarNode, SidebarCategoryNode, SidebarArticleNode, SidebarTreeResult, TabInfo } from './sidebar-types'
import type { ApiEntryData } from './api-loader'

export type { SidebarNode, SidebarCategoryNode, SidebarArticleNode, SidebarTreeResult, TabInfo } from './sidebar-types'
export { isPathActive, hasActiveChild } from './sidebar-types'

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

interface CategoryMeta {
  label: string
  sidebarPages?: string[]
  strip?: boolean
  root?: boolean
}

function readCategoryMeta(dirPath: string): CategoryMeta | null {
  const metaPath = path.join(dirPath, '_category.json')
  try {
    const raw = fs.readFileSync(metaPath, 'utf-8')
    return JSON.parse(raw) as CategoryMeta
  } catch {
    return null
  }
}

/**
 * Build breadcrumb labels from the original entry file path (before stripping).
 * Walks each directory segment and reads _category.json for labels,
 * skipping root categories so they don't appear in breadcrumbs.
 */
export function buildBreadcrumbs(
  entryId: string,
  contentDir: string,
  _pageTitle: string
): { label: string; href: string }[] {
  const rawPath = entryId.replace(/\.(md|mdx)$/, '')
  const segments = rawPath.split('/')
  const crumbs: { label: string; href: string }[] = []

  let currentDir = contentDir
  const slugParts: string[] = []

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]!
    const isLast = i === segments.length - 1

    if (isLast) break

    currentDir = path.join(currentDir, segment)
    const meta = readCategoryMeta(currentDir)
    if (meta?.root) continue

    if (!meta?.strip) {
      slugParts.push(segment)
    }

    const indexHref = findContentFile(currentDir, 'index')
      ? '/' + slugParts.join('/')
      : findFirstPageHref(currentDir, [...slugParts])

    crumbs.push({
      label: meta?.label || titleFromSlug(segment),
      href: indexHref ?? '/' + slugParts.join('/'),
    })
  }

  return crumbs
}

function findFirstPageHref(dirPath: string, slugPrefix: string[]): string | null {
  const meta = readCategoryMeta(dirPath)
  const items = getOrderedItems(dirPath, meta)

  for (const item of items) {
    if (item === 'index') continue
    if (findContentFile(dirPath, item)) {
      return '/' + [...slugPrefix, item].join('/')
    }
    if (isDirectory(dirPath, item)) {
      const subMeta = readCategoryMeta(path.join(dirPath, item))
      const childSlug = subMeta?.strip ? slugPrefix : [...slugPrefix, item]
      const href = findFirstPageHref(path.join(dirPath, item), childSlug)
      if (href) return href
    }
  }
  return null
}

function titleFromSlug(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

/**
 * Compute a URL slug for a file, stripping segments whose _category.json has strip: true.
 * `filePath` is the path relative to contentDir (e.g., "getting-started/quick-start").
 *
 * Handles Astro's glob loader behavior where index files get their `/index` suffix
 * removed from the entry ID (e.g., "getting-started/index.mdx" → id "getting-started").
 */
export function computeStrippedSlug(filePath: string, contentDir: string): string {
  const segments = filePath.split('/')
  const result: string[] = []

  let currentDir = contentDir
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]!
    const isLast = i === segments.length - 1

    if (isLast) {
      const possibleDir = path.join(currentDir, segment)
      try {
        if (fs.statSync(possibleDir).isDirectory()) {
          const meta = readCategoryMeta(possibleDir)
          if (meta?.strip) {
            result.push('index')
            continue
          }
        }
      } catch {}
      result.push(segment)
    } else {
      currentDir = path.join(currentDir, segment)
      const meta = readCategoryMeta(currentDir)
      if (meta?.strip) continue
      result.push(segment)
    }
  }

  return result.join('/')
}

/**
 * Normalize content collection entries into ArticleEntry[].
 */
export function normalizeCollectionEntries(entries: CollectionEntry<'docs'>[], contentDir: string): ArticleEntry[] {
  return entries.map((entry) => {
    const rawSlug = entry.id.replace(/\.(md|mdx)$/, '')
    return {
      slug: computeStrippedSlug(rawSlug, contentDir),
      title: entry.data.title,
    }
  })
}

/**
 * List ordered items for a directory: uses the sidebarPages array from _category.json if present,
 * otherwise lists directory contents alphabetically (excluding _ prefixed files).
 */
function getOrderedItems(dirPath: string, meta: CategoryMeta | null): string[] {
  if (meta?.sidebarPages) return meta.sidebarPages

  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true })
    return entries
      .filter((e) => !e.name.startsWith('_') && !e.name.startsWith('.'))
      .map((e) => {
        if (e.isDirectory()) return e.name
        return e.name.replace(/\.(md|mdx)$/, '')
      })
      .filter((name: string, i: number, arr: string[]) => arr.indexOf(name) === i)
      .sort()
  } catch {
    return []
  }
}

/**
 * Check if a name corresponds to a directory on disk.
 */
function isDirectory(dirPath: string, name: string): boolean {
  try {
    return fs.statSync(path.join(dirPath, name)).isDirectory()
  } catch {
    return false
  }
}

/**
 * Check if a name corresponds to a content file on disk (mdx, md, or tsx).
 */
function findContentFile(dirPath: string, name: string): string | null {
  for (const ext of ['.mdx', '.md']) {
    if (fs.existsSync(path.join(dirPath, name + ext))) return name + ext
  }
  return null
}

function buildLevel(
  dirPath: string,
  slugPrefix: string[],
  isStripped: boolean,
  titleMap: Map<string, string>,
  methodMap: Map<string, string>,
  injectableNodes?: Map<string, SidebarNode>
): SidebarNode[] {
  const meta = readCategoryMeta(dirPath)
  const items = getOrderedItems(dirPath, meta)
  const nodes: SidebarNode[] = []

  for (const item of items) {
    if (item === 'index') {
      const file = findContentFile(dirPath, item)
      if (!file) continue

      const articleSlug = isStripped ? 'index' : slugPrefix.join('/') || 'index'
      const title = titleMap.get(articleSlug) ?? titleFromSlug(item)
      const articleNode: SidebarArticleNode = {
        type: 'article',
        title,
        href: articleSlug === 'index' ? '/' : `/${articleSlug}`,
        path: articleSlug,
        method: methodMap.get(articleSlug),
      }
      nodes.push(articleNode)
      continue
    }

    if (isDirectory(dirPath, item)) {
      const subDirPath = path.join(dirPath, item)
      const subMeta = readCategoryMeta(subDirPath)
      const subStrip = subMeta?.strip ?? false

      const childSlugPrefix = subStrip ? slugPrefix : [...slugPrefix, item]

      const children = buildLevel(subDirPath, childSlugPrefix, subStrip, titleMap, methodMap)

      const indexExplicitlyListed = subMeta?.sidebarPages?.includes('index')

      let categoryHref: string | undefined
      const indexFile = findContentFile(subDirPath, 'index')
      if (indexFile && !indexExplicitlyListed) {
        const indexSlug = subStrip ? 'index' : childSlugPrefix.join('/') || 'index'
        categoryHref = indexSlug === 'index' ? '/' : `/${indexSlug}`
      }

      const filteredChildren = indexExplicitlyListed
        ? children
        : children.filter((c) => !(c.type === 'article' && (c.href === categoryHref || c.path === 'index')))

      const mergedChildren = [...filteredChildren]
      const injectable = injectableNodes?.get(item)
      if (injectable && injectable.type === 'category') {
        mergedChildren.push(...injectable.children)
      }

      const categoryNode: SidebarCategoryNode = {
        type: 'category',
        label: subMeta?.label || titleFromSlug(item),
        slug: item,
        path: [...slugPrefix, item].join('/') || item,
        href: categoryHref,
        children: mergedChildren,
      }
      nodes.push(categoryNode)
      continue
    }

    const file = findContentFile(dirPath, item)
    if (file) {
      const articleSlug = isStripped ? item : [...slugPrefix, item].join('/')
      const title = titleMap.get(articleSlug) ?? titleFromSlug(item)

      const articleNode: SidebarArticleNode = {
        type: 'article',
        title,
        href: `/${articleSlug}`,
        path: articleSlug,
        method: methodMap.get(articleSlug),
      }
      nodes.push(articleNode)
      continue
    }

    if (injectableNodes?.has(item)) {
      nodes.push(injectableNodes.get(item)!)
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

function collectAllContentSlugs(dirPath: string, slugPrefix: string[], isStripped: boolean): string[] {
  const slugs: string[] = []
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.name.startsWith('_') || entry.name.startsWith('.')) continue

      if (entry.isDirectory()) {
        const subDirPath = path.join(dirPath, entry.name)
        const subMeta = readCategoryMeta(subDirPath)
        const subStrip = subMeta?.strip ?? false
        const childSlugPrefix = subStrip ? slugPrefix : [...slugPrefix, entry.name]
        slugs.push(...collectAllContentSlugs(subDirPath, childSlugPrefix, subStrip))
        continue
      }

      if (!entry.name.match(/\.(md|mdx)$/)) continue
      const name = entry.name.replace(/\.(md|mdx)$/, '')

      if (name === 'index') {
        const slug = isStripped ? 'index' : slugPrefix.join('/') || 'index'
        slugs.push(slug)
      } else {
        slugs.push(isStripped ? name : [...slugPrefix, name].join('/'))
      }
    }
  } catch {}
  return slugs
}

/**
 * Builds a sidebar tree by scanning the filesystem for _category.json files.
 * Detects `root: true` categories and promotes them to header tabs.
 * Returns a SidebarTreeResult with per-tab trees and slug-to-tab mapping.
 *
 * `apiNodes` are injected into the `api-reference` tab tree (if it exists)
 * after the filesystem-based tree is built.
 */
export function buildSidebarTree(
  titleMap: Map<string, string>,
  contentDir: string,
  methodMap?: Map<string, string>,
  apiNodes?: SidebarCategoryNode[]
): SidebarTreeResult {
  const _methodMap = methodMap ?? new Map()
  const rootMeta = readCategoryMeta(contentDir)
  const rootStrip = rootMeta?.strip ?? false
  const orderedItems = getOrderedItems(contentDir, rootMeta)

  const tabs: TabInfo[] = []
  const trees: Record<string, SidebarNode[]> = {}
  const slugToTab: Record<string, string> = {}

  const hasRootFolders = orderedItems.some((item) => {
    if (!isDirectory(contentDir, item)) return false
    const meta = readCategoryMeta(path.join(contentDir, item))
    return meta?.root === true
  })

  const defaultTree = buildLevel(contentDir, [], rootStrip, titleMap, _methodMap)

  if (!hasRootFolders) {
    return { tabs: [], trees: {}, defaultTree, slugToTab: {} }
  }

  for (const item of orderedItems) {
    if (!isDirectory(contentDir, item)) continue

    const subDirPath = path.join(contentDir, item)
    const subMeta = readCategoryMeta(subDirPath)
    if (!subMeta?.root) continue

    const subStrip = subMeta.strip ?? false
    const childSlugPrefix = subStrip ? [] : [item]

    let injectableMap: Map<string, SidebarNode> | undefined
    if (item === 'api-reference' && apiNodes?.length) {
      injectableMap = new Map()
      for (const node of apiNodes) {
        injectableMap.set(node.slug, node)
      }
    }

    const tabTree = buildLevel(subDirPath, childSlugPrefix, subStrip, titleMap, _methodMap, injectableMap)

    if (injectableMap) {
      for (const node of apiNodes!) {
        collectSlugsFromNodes([node], slugToTab, item)
      }
    }

    const firstHref = findFirstHref(tabTree) ?? '/'

    tabs.push({
      slug: item,
      label: subMeta.label || titleFromSlug(item),
      href: firstHref,
    })

    trees[item] = tabTree

    for (const slug of collectAllContentSlugs(subDirPath, childSlugPrefix, subStrip)) {
      slugToTab[slug] = item
    }
  }

  return { tabs, trees, defaultTree, slugToTab }
}

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

/**
 * Determines the active tab slug from the current URL path.
 */
export function getActiveTab(pathname: string, slugToTab: Record<string, string>): string | null {
  const normalized = pathname.replace(/^\/|\/$/g, '') || 'index'
  if (slugToTab[normalized]) return slugToTab[normalized]

  for (const [slug, tab] of Object.entries(slugToTab)) {
    if (normalized.startsWith(slug + '/') || normalized === slug) return tab
  }

  return null
}

/**
 * Build sidebar category nodes from API collection entries.
 * Groups entries by apiSlug, sorts by sortOrder, and creates the
 * API Name > Endpoints > [articles] structure.
 */
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

/**
 * Build unified titleMap, methodMap, and slugToTab data from both docs and API collections.
 * This is the single entry point for pages and layouts to get sidebar data.
 */
export function buildApiSidebarData(
  docsEntries: CollectionEntry<'docs'>[],
  apiEntries: { id: string; data: ApiEntryData }[],
  contentDir: string
) {
  const articles = normalizeCollectionEntries(docsEntries, contentDir)
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
