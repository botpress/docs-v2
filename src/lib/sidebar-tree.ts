import type { CollectionEntry } from 'astro:content'
import fs from 'node:fs'
import path from 'node:path'
import type { SidebarNode, SidebarCategoryNode, SidebarArticleNode } from './sidebar-types'

export type { SidebarNode, SidebarCategoryNode, SidebarArticleNode } from './sidebar-types'
export { isPathActive, hasActiveChild } from './sidebar-types'

interface CategoryMeta {
  label: string
  order?: number
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

function titleFromSlug(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

/**
 * Builds a sidebar tree from Astro content collection entries.
 * Reads _category.json files for category labels and ordering.
 * This function uses Node.js APIs and must only be called at build time in .astro files.
 */
export function buildSidebarTree(entries: CollectionEntry<'docs'>[], contentDir: string): SidebarNode[] {
  const categoryMap = new Map<string, SidebarCategoryNode>()

  function ensureCategory(categoryPath: string): SidebarCategoryNode {
    if (categoryMap.has(categoryPath)) return categoryMap.get(categoryPath)!

    const segments = categoryPath.split('/')
    const slug = segments[segments.length - 1]!
    const dirPath = path.join(contentDir, categoryPath)
    const meta = readCategoryMeta(dirPath)

    const node: SidebarCategoryNode = {
      type: 'category',
      label: meta?.label || titleFromSlug(slug),
      slug,
      path: categoryPath,
      order: meta?.order ?? 999,
      children: [],
    }

    categoryMap.set(categoryPath, node)

    if (segments.length > 1) {
      const parentPath = segments.slice(0, -1).join('/')
      const parent = ensureCategory(parentPath)
      if (!parent.children.some((c) => c.type === 'category' && c.path === categoryPath)) {
        parent.children.push(node)
      }
    }

    return node
  }

  const topLevelPaths = new Set<string>()

  for (const entry of entries) {
    const id = entry.id
    const segments = id.split('/')

    if (segments.length === 1) {
      const slug = segments[0]!.replace(/\.(md|mdx)$/, '')
      const articleNode: SidebarArticleNode = {
        type: 'article',
        title: entry.data.title,
        href: `/docs/${slug}`,
        path: slug,
        order: entry.data.order ?? 0,
      }
      topLevelPaths.add(slug)
      categoryMap.set(`__article__${slug}`, articleNode as any)
    } else {
      const fileName = segments[segments.length - 1]!
      const articleSlug = fileName.replace(/\.(md|mdx)$/, '')
      const categoryPath = segments.slice(0, -1).join('/')
      const articlePath = `${categoryPath}/${articleSlug}`

      const category = ensureCategory(categoryPath)
      topLevelPaths.add(segments[0]!)

      const articleNode: SidebarArticleNode = {
        type: 'article',
        title: entry.data.title,
        href: `/docs/${articlePath}`,
        path: articlePath,
        order: entry.data.order ?? 0,
      }

      category.children.push(articleNode)
    }
  }

  const sortNodes = (nodes: SidebarNode[]): SidebarNode[] => {
    return nodes.sort((a, b) => {
      const orderA = a.order
      const orderB = b.order
      if (orderA !== orderB) return orderA - orderB
      const labelA = a.type === 'category' ? a.label : a.title
      const labelB = b.type === 'category' ? b.label : b.title
      return labelA.localeCompare(labelB)
    })
  }

  const sortRecursive = (nodes: SidebarNode[]): SidebarNode[] => {
    for (const node of nodes) {
      if (node.type === 'category') {
        node.children = sortRecursive(node.children)
      }
    }
    return sortNodes(nodes)
  }

  const topLevel: SidebarNode[] = []
  for (const topPath of topLevelPaths) {
    if (categoryMap.has(topPath)) {
      topLevel.push(categoryMap.get(topPath)!)
    } else if (categoryMap.has(`__article__${topPath}`)) {
      topLevel.push(categoryMap.get(`__article__${topPath}`)!)
    }
  }

  return sortRecursive(topLevel)
}
