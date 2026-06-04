import type { Loader } from 'astro/loaders'
import { Client } from '@botpress/client'

type MdxFileName = string
type ApiName = string

const INTEGRATIONS: Record<MdxFileName, ApiName> = {
  'plus-apify': 'plus/apify',
  'plus-email-notifier': 'plus/email-notifier',
  'plus-google-analytics': 'plus/google-analytics',
  'plus-persat': 'plus/persat',
  'sunshine-conversations': 'sunco',
  hitl: 'hitl',
  'knowledge-base-optimization': 'agi/kbo',
  apollo: 'apollo',
  asana: 'asana',
  attio: 'attio',
  bamboohr: 'bamboohr',
  canny: 'canny',
  chat: 'chat',
  chatwoot: 'chatwoot',
  discord: 'discord',
  github: 'github',
  gmail: 'gmail',
  googlecalendar: 'googlecalendar',
  gsheets: 'gsheets',
  hubspot: 'hubspot',
  hunter: 'hunter',
  improvement: 'improvement',
  instagram: 'instagram',
  intercom: 'intercom',
  klaviyo: 'klaviyo',
  kommo: 'kommo',
  line: 'line',
  linear: 'linear',
  linkedin: 'linkedin',
  loops: 'loops',
  mailerlite: 'mailerlite',
  messenger: 'messenger',
  mintlify: 'mintlify',
  notion: 'notion',
  pipedrive: 'pipedrive',
  slack: 'slack',
  teams: 'teams',
  telegram: 'telegram',
  trello: 'trello',
  twilio: 'twilio',
  viber: 'viber',
  vonage: 'vonage',
  webhook: 'webhook',
  workable: 'workable',
  zapier: 'zapier',
  zendesk: 'zendesk',
} as const

export const integrationsLoader = (): Loader => ({
  name: 'integration-loader',
  load: async ({ store, logger }) => {
    const token = import.meta.env.BOTPRESS_API_TOKEN
    if (!token) {
      logger.warn('BOTPRESS_API_TOKEN is not set - integration metadata will be empty')
      return
    }

    const client = new Client({ token })

    await Promise.all(
      Object.entries(INTEGRATIONS).map(async ([slug, apiName]) => {
        try {
          const { integration } = await client.getPublicIntegration({ name: apiName, version: 'latest' })
          store.set({
            id: slug,
            data: {
              title: integration.title,
              description: integration.description,
              iconUrl: integration.iconUrl,
              actions: integration.actions ?? {},
              events: integration.events ?? {},
            },
          })
        } catch (err) {
          logger.warn(`Failed to fetch integration "${apiName}" (slug: "${slug}"): ${err}`)
        }
      })
    )
  },
})
