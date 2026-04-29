export type {
  SidebarNode,
  SidebarCategoryNode,
  SidebarArticleNode,
  SidebarTreeResult,
  TabInfo,
} from '../lib/sidebar-types'
export { isPathActive, hasActiveChild } from '../lib/sidebar-types'

// --- Config types ---

export interface GroupItem {
  group: string
  root?: string
  pages: PageItem[]
}

export type PageItem = string | GroupItem

export interface TabItem {
  tab: string
  pages: PageItem[]
}

export interface DocsConfig {
  navigation: {
    tabs: TabItem[]
  }
}

// --- Runtime types ---

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
