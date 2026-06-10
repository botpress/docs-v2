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

const ensureClientAuthenticated = async (client: Client): Promise<void> => {
  try {
    const w = await client.listPublicWorkspaces({
      pageSize: 0,
    })
    console.log(JSON.stringify(w, null, 2))
  } catch (err) {
    if ((err as { code?: unknown } | undefined)?.code === 401) {
      throw new Error(
        'Botpress Client is not authenticated, so cannot fetch integrations - did you forget to set BOTPRESS_API_TOKEN?'
      )
    } else {
      throw err
    }
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
    await ensureClientAuthenticated(client)

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
