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
  PackageApiConfig,
  StaticApiConfig,
} from './types'

export { isPathActive, hasActiveChild } from './types'

export { titleFromSlug, slugify, normalizePagePath, normalizeSlug, lastSegment } from './utils'

export { readDocsConfig, buildPages, findFirstHref, collectAllSlugs, buildSidebarTree } from './tree'

export { searchPagesForBreadcrumbs, buildBreadcrumbs } from './breadcrumbs'

export { normalizeCollectionEntries, buildApiEntriesMap, buildApiSidebarData } from './api'

export { getAdjacentPages, getActiveTab } from './nav'

export { apiLoader, docsLoader, DEFAULT_DESCRIPTION, collectApiConfigs } from './loaders'

export type { ApiEntryData, ApiSource, PackageApiSource, StaticApiSource, ApiLoaderConfig } from './loaders'

export {
  SchemaSchema,
  ParameterSchema,
  SecuritySchemeSchema,
  ServerVariableSchema,
  EndpointSchema,
  DEFAULT_API_DESCRIPTION,
  apiCollectionSchema,
  docsSchema,
} from './schemas'

export type {
  Schema,
  Parameter,
  SecurityScheme,
  ServerVariable,
  Endpoint,
  DocsSchema,
  ApiCollectionSchema,
} from './schemas'
