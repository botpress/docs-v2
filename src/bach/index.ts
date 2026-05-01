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
  CollectionGroupItem,
  PageItem,
  TabItem,
  DocsConfig,
} from './types'

export { isPathActive, hasActiveChild } from './types'

export { titleFromSlug, slugify, normalizePagePath, normalizeSlug, lastSegment } from './utils'

export {
  readDocsConfig,
  buildPages,
  findFirstHref,
  collectAllSlugs,
  buildSidebarTree,
  getReferencedCollections,
  getDefaultCollection,
} from './tree'

export type { CollectionEntryData } from './tree'

export { searchPagesForBreadcrumbs, buildBreadcrumbs } from './breadcrumbs'

export {
  normalizeCollectionEntries,
  buildSidebarEntryMap,
  buildCollectionsSidebarData,
  isApiEntry,
  fetchCollection,
  fetchCollectionEntries,
  renderEntry,
} from './api'
export type { ContentEntry, ApiEntry, DynamicCollectionEntry } from './api'

export { getAdjacentPages, getActiveTab } from './nav'

export { apiLoader, docsLoader, DEFAULT_DESCRIPTION } from './loaders'

export type { ApiEntryData, ApiSource, PackageApiSource, StaticApiSource } from './loaders'

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
