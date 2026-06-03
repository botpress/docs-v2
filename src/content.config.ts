import { defineCollection } from 'astro:content'
import { apiLoader, docsLoader } from '@/bach/loaders'
import { docsSchema, apiCollectionSchema, integrationSchema } from '@/bach/schemas'
import { adminApiConfig, chatApiConfig, filesApiConfig, runtimeApiConfig, tablesApiConfig } from './api-collections'

const docs = defineCollection({
  loader: docsLoader({ pattern: '**/*.{md,mdx}', base: './src/content/docs' }),
  schema: docsSchema,
})

const integrations = defineCollection({
  loader: docsLoader({ pattern: '**/*.{md,mdx}', base: './src/content/docs' }),
  schema: integrationSchema,
})

const adminApiCollection = defineCollection({
  loader: apiLoader(adminApiConfig),
  schema: apiCollectionSchema,
})

const chatApiCollection = defineCollection({
  loader: apiLoader(chatApiConfig),
  schema: apiCollectionSchema,
})

const filesApiCollection = defineCollection({
  loader: apiLoader(filesApiConfig),
  schema: apiCollectionSchema,
})

const runtimeApiCollection = defineCollection({
  loader: apiLoader(runtimeApiConfig),
  schema: apiCollectionSchema,
})

const tablesApiCollection = defineCollection({
  loader: apiLoader(tablesApiConfig),
  schema: apiCollectionSchema,
})

export const collections = {
  docs,
  integrations,
  adminApi: adminApiCollection,
  chatApi: chatApiCollection,
  filesApi: filesApiCollection,
  runtimeApi: runtimeApiCollection,
  tablesApi: tablesApiCollection,
}
