export interface TabInfo {
  slug: string
  label: string
  href: string
}

export interface SidebarTreeResult {
  tabs: TabInfo[]
  trees: Record<string, SidebarNode[]>
  defaultTree: SidebarNode[]
  slugToTab: Record<string, string>
}

export interface SidebarCategoryNode {
  type: 'category'
  label: string
  slug: string
  path: string
  href?: string
  icon?: string
  children: SidebarNode[]
}

export interface SidebarArticleNode {
  type: 'article'
  title: string
  sidebarTitle?: string
  href: string
  path: string
  method?: string
  icon?: string
}

export type SidebarNode = SidebarCategoryNode | SidebarArticleNode

export interface GroupItem<TCollection extends string = string> {
  group: string
  root?: string
  icon?: string
  pages: PageItem<TCollection>[]
}

export interface CollectionGroupItem<TCollection extends string = string> {
  group: string
  root?: string
  icon?: string
  collection: TCollection
}

export type PageItem<TCollection extends string = string> =
  | string
  | GroupItem<TCollection>
  | CollectionGroupItem<TCollection>

export interface TabItem<TCollection extends string = string> {
  tab: string
  pages: PageItem<TCollection>[]
}

export interface DocsConfig<TCollection extends string = string> {
  defaultCollection: TCollection
  navigation: {
    tabs: TabItem<TCollection>[]
  }
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
