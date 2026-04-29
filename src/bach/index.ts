export { defineConfig } from './utils'

export type {
  SidebarNode,
  SidebarCategoryNode,
  SidebarArticleNode,
  SidebarTreeResult,
  TabInfo,
  AdjacentPage,
  AdjacentPages,
  ArticleEntry,
  GroupItem,
  PageItem,
  TabItem,
  DocsConfig,
} from './types'

export { isPathActive, hasActiveChild } from './types'

export { titleFromSlug, slugify, normalizePagePath, normalizeSlug, lastSegment } from './utils'

export { readDocsConfig, buildPages, findFirstHref, collectAllSlugs, buildSidebarTree } from './tree'

export { searchPagesForBreadcrumbs, buildBreadcrumbs } from './breadcrumbs'

export { normalizeCollectionEntries, buildApiSidebarNodes, buildApiSidebarData } from './api'

export { getAdjacentPages, getActiveTab } from './nav'
