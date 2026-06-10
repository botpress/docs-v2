import type { Loader } from 'astro/loaders'
import { Client } from '@botpress/client'
import type { IntegrationSchema } from '../schemas'

type MdxFileName = string
type ApiName = string

const getLatestIntegrationData = async (client: Client, name: string): Promise<IntegrationSchema> => {
  const { integration } = await client.getPublicIntegration({
    name,
    version: 'latest',
  })
  return {
    title: integration.title,
    description: integration.description,
    iconUrl: integration.iconUrl,
    actions: integration.actions ?? {},
    events: integration.events ?? {},
  }
}

export type IntegrationLoaderOptions = {
  client: Client
  integrations: Record<MdxFileName, ApiName>
}

export const integrationsLoader = (options: IntegrationLoaderOptions): Loader => ({
  name: 'integration-loader',
  load: async ({ store, logger }) => {
    const { client, integrations } = options
    for (const slug in integrations) {
      const name = integrations[slug]
      try {
        const data = await getLatestIntegrationData(client, name)
        store.set({ id: slug, data })
      } catch (err) {
        logger.warn(`Failed to fetch integration "${name}" (slug: "${slug}"): ${err}`)
      }
    }
  },
})
