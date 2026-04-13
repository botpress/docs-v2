import { defineCollection } from 'astro:content'
import { z } from 'astro/zod'
import { glob } from 'astro/loaders'
import { apiLoader } from './lib/api-loader'

const docs = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/docs' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    prose: z.boolean().default(true),
  }),
})

const api = defineCollection({
  loader: apiLoader(),
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
