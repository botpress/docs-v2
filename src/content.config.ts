import { defineCollection } from 'astro:content'
import { apiLoader, docsLoader, integrationsLoader } from '@/bach/loaders'
import { docsSchema, apiCollectionSchema, integrationSchema } from '@/bach/schemas'
import { adminApiConfig, chatApiConfig, filesApiConfig, runtimeApiConfig, tablesApiConfig } from './api-collections'
import { Client } from '@botpress/client'

const token = import.meta.env.BOTPRESS_API_TOKEN
if (!token) {
  console.warn('BOTPRESS_API_TOKEN is not set - integration metadata will be empty')
}

const client = new Client({ token })

const docs = defineCollection({
  loader: docsLoader({
    pattern: ['**/*.{md,mdx}', '!changelog/changelog-entries/**'],
    base: './src/content/docs',
  }),
  schema: docsSchema,
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

const integrations = defineCollection({
  loader: integrationsLoader({
    client,
    integrations: {
      'plus-apify': 'plus/apify',
      'plus-email-notifier': 'plus/email-notifier',
      'plus-google-analytics': 'plus/google-analytics',
      'plus-persat': 'plus/persat',
      'plus-chatwoot': 'plus/chatwoot',
      'sunshine-conversations': 'sunco',
      hitl: 'hitl',
      'knowledge-base-optimization': 'agi/kbo',
      apollo: 'apollo',
      asana: 'asana',
      attio: 'attio',
      bamboohr: 'bamboohr',
      canny: 'canny',
      chat: 'chat',
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
    },
  }),
  schema: integrationSchema,
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
