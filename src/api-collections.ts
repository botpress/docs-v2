import { adminApi, filesApi, runtimeApi, tablesApi } from '@botpress/api'
import type { ApiLoaderOptions } from '@/bach/loaders/api'

export const adminApiConfig: ApiLoaderOptions = {
  api: adminApi,
  key: 'admin',
  slug: 'api-reference/admin-api',
  label: 'Admin API',
}

export const chatApiConfig: ApiLoaderOptions = {
  file: 'chat-openapi.json',
  slug: 'api-reference/chat-api',
  label: 'Chat API',
}

export const filesApiConfig: ApiLoaderOptions = {
  api: filesApi,
  key: 'files',
  slug: 'api-reference/files-api',
  label: 'Files API',
}

export const runtimeApiConfig: ApiLoaderOptions = {
  api: runtimeApi,
  key: 'runtime',
  slug: 'api-reference/runtime-api',
  label: 'Runtime API',
}

export const tablesApiConfig: ApiLoaderOptions = {
  api: tablesApi,
  key: 'tables',
  slug: 'api-reference/tables-api',
  label: 'Tables API',
}

export const apiCollectionConfigs: ApiLoaderOptions[] = [
  adminApiConfig,
  chatApiConfig,
  filesApiConfig,
  runtimeApiConfig,
  tablesApiConfig,
]
