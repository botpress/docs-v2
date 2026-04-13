import { defineCollection } from 'astro:content'
import { z } from 'astro/zod'
import { glob } from 'astro/loaders'
import { runtimeApi, adminApi, tablesApi, filesApi } from '@botpress/api'
import { apiLoader, type PackageApiSource, type StaticApiSource } from './lib/api-loader'

const packageApis: PackageApiSource[] = [
  { api: adminApi, slug: 'admin-api', label: 'Admin API', key: 'admin' },
  { api: filesApi, slug: 'files-api', label: 'Files API', key: 'files' },
  { api: runtimeApi, slug: 'runtime-api', label: 'Runtime API', key: 'runtime' },
  { api: tablesApi, slug: 'tables-api', label: 'Tables API', key: 'tables' },
]

const staticApis: StaticApiSource[] = [{ file: 'chat-openapi.json', slug: 'chat-api', label: 'Chat API' }]

const docs = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/docs' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    prose: z.boolean().default(true),
  }),
})

const api = defineCollection({
  loader: apiLoader({ packageApis, staticApis }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    method: z.string(),
    apiSlug: z.string(),
    apiLabel: z.string(),
    sortOrder: z.number(),
    endpoint: z.any(),
  }),
})

export const collections = { docs, api }
