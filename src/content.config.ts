import { defineCollection } from 'astro:content'
import { apiLoader, docsLoader } from '@/bach/loaders'
import { docsSchema, apiCollectionSchema } from '@/bach/schemas'
import { adminApi, runtimeApi, filesApi, tablesApi } from '@botpress/api'

const docs = defineCollection({
  loader: docsLoader({ pattern: '**/*.{md,mdx}', base: './src/content/docs' }),
  schema: docsSchema,
})

const adminApiCollection = defineCollection({
  loader: apiLoader({ api: adminApi, key: 'admin', slug: 'api-reference/admin-api', label: 'Admin API' }),
  schema: apiCollectionSchema,
})

const chatApiCollection = defineCollection({
  loader: apiLoader({ file: 'chat-openapi.json', slug: 'api-reference/chat-api', label: 'Chat API' }),
  schema: apiCollectionSchema,
})

const filesApiCollection = defineCollection({
  loader: apiLoader({ api: filesApi, key: 'files', slug: 'api-reference/files-api', label: 'Files API' }),
  schema: apiCollectionSchema,
})

const runtimeApiCollection = defineCollection({
  loader: apiLoader({ api: runtimeApi, key: 'runtime', slug: 'api-reference/runtime-api', label: 'Runtime API' }),
  schema: apiCollectionSchema,
})

const tablesApiCollection = defineCollection({
  loader: apiLoader({ api: tablesApi, key: 'tables', slug: 'api-reference/tables-api', label: 'Tables API' }),
  schema: apiCollectionSchema,
})

export const collections = {
  docs,
  adminApi: adminApiCollection,
  chatApi: chatApiCollection,
  filesApi: filesApiCollection,
  runtimeApi: runtimeApiCollection,
  tablesApi: tablesApiCollection,
}
