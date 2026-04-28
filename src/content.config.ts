import { defineCollection } from 'astro:content'
import { z } from 'astro/zod'
import { glob } from 'astro/loaders'
import { runtimeApi, adminApi, tablesApi, filesApi } from '@botpress/api'
import { apiLoader, type PackageApiSource, type StaticApiSource } from './astro/loaders/api-loader'
import { EndpointSchema } from './components/api/types'

const packageApis: PackageApiSource[] = [
  { api: adminApi, slug: 'admin-api', label: 'Admin API', key: 'admin' },
  { api: filesApi, slug: 'files-api', label: 'Files API', key: 'files' },
  { api: runtimeApi, slug: 'runtime-api', label: 'Runtime API', key: 'runtime' },
  { api: tablesApi, slug: 'tables-api', label: 'Tables API', key: 'tables' },
]

const staticApis: StaticApiSource[] = [{ file: 'chat-openapi.json', slug: 'chat-api', label: 'Chat API' }]

export const DEFAULT_DESCRIPTION = 'Botpress documentation for building, deploying, and managing AI agents.'
export const DEFAULT_API_DESCRIPTION =
  'Explore the Botpress API reference for endpoints, parameters, and response schemas.'

const docs = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/docs' }),
  schema: z.object({
    title: z.string(),
    description: z.string().default(DEFAULT_DESCRIPTION),
    prose: z.boolean().default(true),
  }),
})

const api = defineCollection({
  loader: apiLoader({ packageApis, staticApis }),
  schema: z.object({
    title: z.string(),
    description: z.string().default(DEFAULT_API_DESCRIPTION),
    method: z.string(),
    apiSlug: z.string(),
    apiLabel: z.string(),
    sortOrder: z.number(),
    endpoint: EndpointSchema,
  }),
})

export const collections = { docs, api }
