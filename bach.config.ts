import { defineConfig } from '@/bach'
import { collections } from './src/content.config'

export default defineConfig(collections, {
  defaultCollection: 'docs',
  navigation: {
    tabs: [
      {
        tab: 'Docs',
        pages: [
          {
            group: 'Get started',
            pages: [
              'index',
              'get-started/quick-start',
              {
                group: 'Manage your agent',
                pages: [
                  'get-started/manage-your-agent/preview',
                  'get-started/manage-your-agent/monitor',
                  'get-started/manage-your-agent/knowledge',
                  'get-started/manage-your-agent/inspect',
                  'get-started/manage-your-agent/human-handoff',
                  'get-started/manage-your-agent/edit-appearance',
                  'get-started/manage-your-agent/control-access',
                ],
              },
              'get-started/configure-your-workspace',
            ],
          },
          {
            group: 'Studio',
            pages: [
              'studio/introduction',
              {
                group: 'Concepts',
                pages: [
                  'studio/concepts/home',
                  {
                    group: 'Nodes',
                    icon: 'SquareMousePointer',
                    pages: ['studio/concepts/nodes/introduction', 'studio/concepts/nodes/autonomous-node'],
                  },
                  {
                    group: 'Cards',
                    icon: 'Rows3',
                    pages: [
                      'studio/concepts/cards/introduction',
                      'studio/concepts/cards/send-messages',
                      'studio/concepts/cards/execute-code',
                      'studio/concepts/cards/tables',
                      'studio/concepts/cards/set-inactivity-timeout',
                      'studio/concepts/cards/webchat',
                      'studio/concepts/cards/flow-logic',
                      {
                        group: 'AI',
                        pages: [
                          'studio/concepts/cards/ai/introduction',
                          'studio/concepts/cards/ai/ai-task',
                          'studio/concepts/cards/ai/ai-transition',
                          'studio/concepts/cards/ai/ai-generate-text',
                        ],
                      },
                      'studio/concepts/cards/capture-information',
                      'studio/concepts/cards/fixed-schedule',
                      'studio/concepts/cards/agents',
                      'studio/concepts/cards/utilities',
                    ],
                  },
                  'studio/concepts/workflows',
                  {
                    group: 'Knowledge Bases',
                    icon: 'BookOpen',
                    pages: [
                      'studio/concepts/knowledge-base/introduction',
                      'studio/concepts/knowledge-base/add-sources',
                      'studio/concepts/knowledge-base/knowledge-base-best-practices',
                    ],
                  },
                  'studio/concepts/tables',
                  'studio/concepts/actions',
                  {
                    group: 'Agents',
                    icon: 'Bot',
                    pages: [
                      'studio/concepts/agents/introduction',
                      'studio/concepts/agents/summary-agent',
                      'studio/concepts/agents/personality-agent',
                      'studio/concepts/agents/policy-agent',
                      'studio/concepts/agents/translator-agent',
                      'studio/concepts/agents/knowledge-agent',
                      'studio/concepts/agents/hitl-agent',
                      'studio/concepts/agents/vision-agent',
                      'studio/concepts/agents/analytics-agent',
                    ],
                  },
                  'studio/concepts/hooks',
                  'studio/concepts/card-hub',
                  'studio/concepts/integrations',
                  'studio/concepts/schemas',
                  'studio/concepts/versions',
                  'studio/concepts/bot-settings',
                  'studio/concepts/find',
                  {
                    group: 'Variables',
                    icon: 'Variable',
                    pages: [
                      'studio/concepts/variables/overview',
                      {
                        group: 'Scopes',
                        pages: [
                          'studio/concepts/variables/scopes/workflow',
                          'studio/concepts/variables/scopes/user',
                          'studio/concepts/variables/scopes/conversation',
                          'studio/concepts/variables/scopes/bot',
                          'studio/concepts/variables/scopes/configuration',
                        ],
                      },
                      'studio/concepts/variables/built-in',
                      'studio/concepts/variables/pass-between-workflows',
                      'studio/concepts/variables/in-code',
                    ],
                  },
                  'studio/concepts/triggers',
                  'studio/concepts/debugger-logs-json',
                  'studio/concepts/emulator',
                  'studio/concepts/import-export-bots',
                  'studio/concepts/copy-to-bot',
                  {
                    group: 'Controls and Settings',
                    icon: 'Wrench',
                    pages: [
                      'studio/concepts/controls-and-settings/keyboard-shortcuts',
                      'studio/concepts/controls-and-settings/studio-commands',
                      'studio/concepts/controls-and-settings/studio-preferences',
                    ],
                  },
                ],
              },
              {
                group: 'Guides',
                pages: [
                  'studio/guides/introduction',
                  {
                    group: 'How-to',
                    pages: [
                      'studio/guides/how-to/translate',
                      'studio/guides/how-to/send-reminders',
                      'studio/guides/how-to/different-an-models',
                      'studio/guides/how-to/track-ai-spend-in-table',
                      'studio/guides/how-to/dropdown-menus',
                    ],
                  },
                  {
                    group: 'Advanced',
                    pages: [
                      'studio/guides/advanced/use-code',
                      'studio/guides/advanced/event-properties',
                      'studio/guides/advanced/best-practices-for-state-management',
                      {
                        group: 'Safety',
                        pages: [
                          'studio/guides/advanced/safety/introduction',
                          'studio/guides/advanced/safety/preventing-abuse',
                          'studio/guides/advanced/safety/brand-safety-framework',
                        ],
                      },
                      {
                        group: 'Exporting Data',
                        pages: [
                          'studio/guides/advanced/exporting-data/introduction',
                          'studio/guides/advanced/exporting-data/exporting-raw-conversations-with-the-botpress-api',
                          'studio/guides/advanced/exporting-data/getting-the-conversation-history-from-within-your-bot',
                          'studio/guides/advanced/exporting-data/streaming-analytics-from-within-your-bot-with-hooks',
                          'studio/guides/advanced/exporting-data/exporting-compiled-bot-analytics-with-the-botpress-api',
                          'studio/guides/advanced/exporting-data/analyze-llmz-responses',
                        ],
                      },
                      'studio/guides/advanced/kitchen-sink-advanced-starter-template',
                      'studio/guides/advanced/tips-to-optimize-ai-cost',
                      'studio/guides/advanced/retention-period',
                      'studio/guides/advanced/v12',
                    ],
                  },
                ],
              },
            ],
          },
          {
            group: 'Integrations',
            pages: [
              'integrations/get-started/introduction',
              'integrations/get-started/botpress-hub',
              {
                group: 'Guides',
                pages: [
                  'integrations/integration-guides/plus-apify',
                  'integrations/integration-guides/apollo',
                  'integrations/integration-guides/attio',
                  'integrations/integration-guides/asana',
                  'integrations/integration-guides/bamboohr',
                  'integrations/integration-guides/canny',
                  'integrations/integration-guides/chat',
                  'integrations/integration-guides/plus-chatwoot',
                  'integrations/integration-guides/discord',
                  'integrations/integration-guides/plus-email-notifier',
                  'integrations/integration-guides/github',
                  'integrations/integration-guides/gmail',
                  'integrations/integration-guides/plus-google-analytics',
                  'integrations/integration-guides/googlecalendar',
                  'integrations/integration-guides/gsheets',
                  {
                    group: 'HITL',
                    icon: 'headphones',
                    pages: [
                      'integrations/integration-guides/hitl/introduction',
                      'integrations/integration-guides/hitl/time-to-first-agent-response',
                    ],
                  },
                  'integrations/integration-guides/hubspot',
                  'integrations/integration-guides/hunter',
                  'integrations/integration-guides/improvement',
                  'integrations/integration-guides/instagram',
                  'integrations/integration-guides/intercom',
                  'integrations/integration-guides/klaviyo',
                  'integrations/integration-guides/knowledge-base-optimization',
                  'integrations/integration-guides/kommo',
                  'integrations/integration-guides/line',
                  'integrations/integration-guides/linear',
                  'integrations/integration-guides/linkedin',
                  'integrations/integration-guides/loops',
                  'integrations/integration-guides/mailerlite',
                  'integrations/integration-guides/messenger',
                  'integrations/integration-guides/mintlify',
                  'integrations/integration-guides/plus-persat',
                  'integrations/integration-guides/teams',
                  'integrations/integration-guides/notion',
                  'integrations/integration-guides/pipedrive',
                  'integrations/integration-guides/slack',
                  {
                    group: 'Sunshine Conversation',
                    icon: 'message-square',
                    pages: [
                      'integrations/integration-guides/sunshine-conversations/introduction',
                      'integrations/integration-guides/sunshine-conversations/zendesk-messaging',
                    ],
                  },
                  'integrations/integration-guides/telegram',
                  'integrations/integration-guides/trello',
                  'integrations/integration-guides/twilio',
                  'integrations/integration-guides/viber',
                  'integrations/integration-guides/vonage',
                  'integrations/integration-guides/webhook',
                  'integrations/integration-guides/workable',
                  {
                    group: 'WhatsApp',
                    icon: 'message-circle',
                    pages: [
                      'integrations/integration-guides/whatsapp/introduction',
                      {
                        group: 'Mapping',
                        pages: [
                          'integrations/integration-guides/whatsapp/mapping/botpress-to-whatsapp',
                          'integrations/integration-guides/whatsapp/mapping/whatsapp-to-botpress',
                        ],
                      },
                      'integrations/integration-guides/whatsapp/whatsapp-start-proactively',
                      'integrations/integration-guides/whatsapp/start-conversation-through-webhook',
                    ],
                  },
                  'integrations/integration-guides/zapier',
                  'integrations/integration-guides/zendesk',
                ],
              },
              {
                group: 'SDK',
                pages: [
                  'integrations/sdk/overview',
                  'integrations/sdk/installation',
                  {
                    group: 'Integrations',
                    pages: [
                      'integrations/sdk/integration/getting-started',
                      'integrations/sdk/integration/messaging',
                      'integrations/sdk/integration/concepts',
                      'integrations/sdk/integration/publish-your-integration-on-botpress-hub',
                      'integrations/sdk/integration/enable-oauth',
                      'integrations/sdk/integration/use-your-own-llm',
                    ],
                  },
                  {
                    group: 'Interfaces',
                    pages: [
                      'integrations/sdk/interface/introduction',
                      'integrations/sdk/interface/how-tos/add-and-implement',
                      'integrations/sdk/interface/how-tos/implementing-hitl',
                      'integrations/sdk/interface/how-tos/implementing-file-sync',
                    ],
                  },
                  'integrations/sdk/bots-as-code',
                  'integrations/sdk/cli-reference',
                ],
              },
            ],
          },
          {
            group: 'ADK',
            pages: ['adk/quickstart'],
          },
          {
            group: 'Botpress Desk',
            pages: ['desk/introduction'],
          },
        ],
      },
      { tab: 'Botpress Desk', href: 'https://desk.support.channel', external: true },
      { tab: 'Tutorial', pages: ['tutorial/index'] },
      {
        tab: 'API Reference',
        pages: [
          {
            group: 'Get Started',
            pages: [
              'api-reference/index',
              'api-reference/authentication',
              'api-reference/pagination',
              'api-reference/ratelimiting',
              'api-reference/errors',
            ],
          },
          {
            group: 'Chat API',
            pages: ['api-reference/chat-api/introduction', { group: 'Endpoints', collection: 'chatApi' }],
          },
          {
            group: 'Admin API',
            pages: [
              'api-reference/admin-api/getting-started',
              'api-reference/admin-api/concepts',
              { group: 'Endpoints', collection: 'adminApi' },
            ],
          },
          {
            group: 'Files API',
            pages: [
              'api-reference/files-api/getting-started',
              'api-reference/files-api/how-tos/creating-files',
              'api-reference/files-api/how-tos/index-and-search-files',
              'api-reference/files-api/how-tos/manage-files',
              { group: 'Endpoints', collection: 'filesApi' },
            ],
          },
          {
            group: 'Tables API',
            pages: ['api-reference/tables-api/getting-started', { group: 'Endpoints', collection: 'tablesApi' }],
          },
          {
            group: 'Runtime API',
            pages: [
              'api-reference/runtime-api/getting-started',
              'api-reference/runtime-api/concepts',
              { group: 'Endpoints', collection: 'runtimeApi' },
            ],
          },
        ],
      },
      { tab: 'Changelog', pages: ['changelog/index'] },
    ],
  },
})
