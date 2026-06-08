import type { SidebarNode, AdjacentPage, AdjacentPages, SidebarTreeResult } from './types'
import { stripBase } from './utils'

export function isPathActive(href: string, currentPath: string): boolean {
  if (href === currentPath) return true
  const normalized = currentPath.endsWith('/') ? currentPath.slice(0, -1) : currentPath
  const normalizedHref = href.endsWith('/') ? href.slice(0, -1) : href
  return normalized === normalizedHref
}

export function hasActiveChild(node: SidebarNode, currentPath: string): boolean {
  if (node.type === 'article') {
    return isPathActive(node.href, currentPath)
  }
  return node.children.some((child) => hasActiveChild(child, currentPath))
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

/**
 * Find the previous and next pages relative to `currentPath` inside a flattened
 * sidebar tree. Returns `null` when there is no prev/next item.
 */
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
 * Determine which tab a given URL path belongs to.
 * Falls back to prefix matching when there is no exact slug match.
 */
export function getActiveTab(pathname: string, slugToTab: Record<string, string>): string | null {
  const normalized = stripBase(pathname).replace(/^\/|\/$/g, '') || 'index'
  if (slugToTab[normalized]) return slugToTab[normalized]

  for (const [slug, tab] of Object.entries(slugToTab)) {
    if (normalized.startsWith(slug + '/') || normalized === slug) return tab
  }

  return null
}

/**
 * Given a full sidebar tree result and the current URL path, return the
 * active tab slug and the sidebar nodes that belong to that tab.
 */
export function resolveActiveSidebarTree(
  treeResult: SidebarTreeResult,
  currentPath: string
): { activeTab: string | null; sidebarTree: SidebarNode[] } {
  const hasTabs = treeResult.tabs.length > 0
  const activeTab = hasTabs ? getActiveTab(currentPath, treeResult.slugToTab) : null
  const sidebarTree =
    hasTabs && activeTab ? (treeResult.trees[activeTab] ?? treeResult.defaultTree) : treeResult.defaultTree
  return { activeTab, sidebarTree }
}
