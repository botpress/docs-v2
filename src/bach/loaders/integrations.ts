import type { Loader } from 'astro/loaders'
import { Client } from '@botpress/client'
import type { IntegrationSchema } from '../schemas'

// We use the "opaque display" Typescript trick so intellisense in other areas
// preserves the names of the types, so e.g. Record<MdxFileName, ApiName> will
// remain as such rather than being normalized to Record<string, string>.
type MdxFileName = string & {}
type ApiName = string & {}

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

/**
 * Performs a simple API call to verify that the client is properly
 * authenticated.
 *
 * Throws an error if the API returns a 401 or if the client throws an
 * unexpected error.
 */
const ensureClientAuthenticated = async (client: Client): Promise<void> => {
  try {
    // We perform a useless API call to test auth
    await client.listWorkspaces({
      handle: ' ',
    })
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
