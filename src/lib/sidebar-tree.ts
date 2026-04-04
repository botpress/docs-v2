import type { CollectionEntry } from 'astro:content'
import fs from 'node:fs'
import path from 'node:path'
import type { SidebarNode, SidebarCategoryNode, SidebarArticleNode, SidebarTreeResult, TabInfo } from './sidebar-types'

export type { SidebarNode, SidebarCategoryNode, SidebarArticleNode, SidebarTreeResult, TabInfo } from './sidebar-types'
export { isPathActive, hasActiveChild } from './sidebar-types'

export interface ArticleEntry {
  slug: string
  title: string
}

interface CategoryMeta {
  label: string
  pages?: string[]
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
  pageTitle: string
): { label: string; href?: string }[] {
  const rawPath = entryId.replace(/\.(md|mdx)$/, '')
  const segments = rawPath.split('/')
  const crumbs: { label: string; href?: string }[] = []

  let currentDir = contentDir
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]!
    const isLast = i === segments.length - 1

    if (isLast) {
      if (segment !== 'index') {
        crumbs.push({ label: pageTitle })
      } else {
        crumbs.push({ label: pageTitle })
      }
    } else {
      currentDir = path.join(currentDir, segment)
      const meta = readCategoryMeta(currentDir)
      if (meta?.root) continue
      crumbs.push({ label: meta?.label || titleFromSlug(segment) })
    }
  }

  return crumbs
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
 * List ordered items for a directory: uses the pages array from _category.json if present,
 * otherwise lists directory contents alphabetically (excluding _ prefixed files).
 */
function getOrderedItems(dirPath: string, meta: CategoryMeta | null): string[] {
  if (meta?.pages) return meta.pages

  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true })
    return entries
      .filter((e) => !e.name.startsWith('_') && !e.name.startsWith('.'))
      .map((e) => {
        if (e.isDirectory()) return e.name
        return e.name.replace(/\.(md|mdx)$/, '')
      })
      .filter((name, i, arr) => arr.indexOf(name) === i)
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
  titleMap: Map<string, string>
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
      }
      nodes.push(articleNode)
      continue
    }

    if (isDirectory(dirPath, item)) {
      const subDirPath = path.join(dirPath, item)
      const subMeta = readCategoryMeta(subDirPath)
      const subStrip = subMeta?.strip ?? false

      const childSlugPrefix = subStrip ? slugPrefix : [...slugPrefix, item]

      const children = buildLevel(subDirPath, childSlugPrefix, subStrip, titleMap)

      const categoryNode: SidebarCategoryNode = {
        type: 'category',
        label: subMeta?.label || titleFromSlug(item),
        slug: item,
        path: [...slugPrefix, item].join('/') || item,
        children,
      }
      nodes.push(categoryNode)
      continue
    }

    const file = findContentFile(dirPath, item)
    if (!file) continue

    const articleSlug = isStripped ? item : [...slugPrefix, item].join('/')
    const title = titleMap.get(articleSlug) ?? titleFromSlug(item)

    const articleNode: SidebarArticleNode = {
      type: 'article',
      title,
      href: `/${articleSlug}`,
      path: articleSlug,
    }
    nodes.push(articleNode)
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

function collectSlugs(nodes: SidebarNode[]): string[] {
  const slugs: string[] = []
  for (const node of nodes) {
    if (node.type === 'article') {
      slugs.push(node.path)
    } else {
      slugs.push(...collectSlugs(node.children))
    }
  }
  return slugs
}

/**
 * Builds a sidebar tree by scanning the filesystem for _category.json files.
 * Detects `root: true` categories and promotes them to header tabs.
 * Returns a SidebarTreeResult with per-tab trees and slug-to-tab mapping.
 */
export function buildSidebarTree(titleMap: Map<string, string>, contentDir: string): SidebarTreeResult {
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

  const defaultTree = buildLevel(contentDir, [], rootStrip, titleMap)

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

    const tabTree = buildLevel(subDirPath, childSlugPrefix, subStrip, titleMap)
    const firstHref = findFirstHref(tabTree) ?? '/'

    tabs.push({
      slug: item,
      label: subMeta.label || titleFromSlug(item),
      href: firstHref,
    })

    trees[item] = tabTree

    for (const slug of collectSlugs(tabTree)) {
      slugToTab[slug] = item
    }
  }

  return { tabs, trees, defaultTree, slugToTab }
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
