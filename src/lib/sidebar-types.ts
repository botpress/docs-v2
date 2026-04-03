export interface SidebarCategoryNode {
  type: 'category'
  label: string
  slug: string
  path: string
  order: number
  children: SidebarNode[]
}

export interface SidebarArticleNode {
  type: 'article'
  title: string
  href: string
  path: string
  order: number
}

export type SidebarNode = SidebarCategoryNode | SidebarArticleNode

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
