import { defineCollection } from 'astro:content'
import { runtimeApi, adminApi, tablesApi, filesApi } from '@botpress/api'

import { apiLoader, docsLoader, type PackageApiSource, type StaticApiSource } from '@/bach'
import { docsSchema, apiCollectionSchema } from '@/bach/schemas'

const packageApis: PackageApiSource[] = [
  { api: adminApi, slug: 'admin-api', label: 'Admin API', key: 'admin' },
  { api: filesApi, slug: 'files-api', label: 'Files API', key: 'files' },
  { api: runtimeApi, slug: 'runtime-api', label: 'Runtime API', key: 'runtime' },
  { api: tablesApi, slug: 'tables-api', label: 'Tables API', key: 'tables' },
]

const staticApis: StaticApiSource[] = [{ file: 'chat-openapi.json', slug: 'chat-api', label: 'Chat API' }]

const docs = defineCollection({
  loader: docsLoader({ pattern: '**/*.{md,mdx}', base: './src/content/docs' }),
  schema: docsSchema,
})

const api = defineCollection({
  loader: apiLoader({ packageApis, staticApis }),
  schema: apiCollectionSchema,
})

export const collections = { docs, api }
