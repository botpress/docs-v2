export type {
  SidebarNode,
  SidebarCategoryNode,
  SidebarArticleNode,
  SidebarTreeResult,
  TabInfo,
} from '../lib/sidebar-types'
export { isPathActive, hasActiveChild } from '../lib/sidebar-types'

export interface GroupItem {
  group: string
  root?: string
  pages: PageItem[]
  openapi?: PackageApiConfig | StaticApiConfig
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

export interface ApiConfig {
  slug: string
  label: string
}

export interface PackageApiConfig extends ApiConfig {
  api: { exportOpenapi: (dir: string) => void }
  key: string
}

export interface StaticApiConfig extends ApiConfig {
  file: string
}

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
