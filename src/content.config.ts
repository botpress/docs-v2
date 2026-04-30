import { defineCollection } from 'astro:content'

import { apiLoader, docsLoader, collectApiConfigs } from '@/bach'
import { docsSchema, apiCollectionSchema } from '@/bach/schemas'
import docsConfig from '../docs.config'

const apiConfigs = collectApiConfigs(docsConfig)

const docs = defineCollection({
  loader: docsLoader({ pattern: '**/*.{md,mdx}', base: './src/content/docs' }),
  schema: docsSchema,
})

const api = defineCollection({
  loader: apiLoader(apiConfigs),
  schema: apiCollectionSchema,
})

export const collections = { docs, api }
