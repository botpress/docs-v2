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
              'get-started/configure-your-workspace',
              {
                group: 'Manage your agent',
                pages: [
                  'get-started/manage-your-agent/preview',
                  'get-started/manage-your-agent/edit-appearance',
                  'get-started/manage-your-agent/knowledge',
                  'get-started/manage-your-agent/inspect',
                  'get-started/manage-your-agent/monitor',
                  'get-started/manage-your-agent/human-handoff',
                  'get-started/manage-your-agent/control-access',
                ],
              },
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
        ],
      },
      {
        tab: 'ADK',
        pages: [
          {
            group: 'Get started',
            pages: ['adk/index', 'adk/introduction', 'adk/quickstart'],
          },
          {
            group: 'Setting up your agent',
            pages: ['adk/setup/configuration', 'adk/setup/environment', 'adk/setup/integrations'],
          },
          {
            group: 'Handling conversations',
            pages: [
              'adk/conversations/setup',
              'adk/conversations/ai-execution',
              'adk/conversations/tools',
              'adk/conversations/messages',
              'adk/conversations/custom-components',
              'adk/conversations/lifecycle',
              'adk/conversations/state',
            ],
          },
          {
            group: 'Handling longform logic',
            pages: ['adk/workflows/create', 'adk/workflows/steps', 'adk/workflows/request-notify'],
          },
          {
            group: 'Actions and triggers',
            pages: ['adk/external/actions', 'adk/external/triggers'],
          },
          {
            group: 'Working with data',
            pages: ['adk/data/tables', 'adk/data/knowledge'],
          },
          {
            group: 'Testing and debugging',
            pages: ['adk/testing/evals', 'adk/testing/agent-steps', 'adk/testing/debugging', 'adk/testing/scripts'],
          },
          {
            group: 'LLM Utilities',
            pages: ['adk/zai/overview', 'adk/zai/extract', 'adk/zai/generate', 'adk/zai/classify'],
          },
          {
            group: 'AI-native development',
            pages: ['adk/ai-native/skills'],
          },
          {
            group: 'Advanced',
            pages: ['adk/advanced/hitl', 'adk/advanced/desk-hitl'],
          },
          {
            group: 'CLI',
            pages: ['adk/cli-reference'],
          },
        ],
      },
      { tab: 'Tutorial', pages: ['tutorial/index'] },
      {
        tab: 'API Reference',
        pages: [
          'api-reference/index',
          {
            group: 'Admin API',
            pages: [{ group: 'Endpoints', collection: 'adminApi' }],
          },
          {
            group: 'Chat API',
            pages: [{ group: 'Endpoints', collection: 'chatApi' }],
          },
          {
            group: 'Files API',
            pages: [{ group: 'Endpoints', collection: 'filesApi' }],
          },
          {
            group: 'Runtime API',
            pages: [{ group: 'Endpoints', collection: 'runtimeApi' }],
          },
          {
            group: 'Tables API',
            pages: [{ group: 'Endpoints', collection: 'tablesApi' }],
          },
        ],
      },
      { tab: 'Changelog', pages: ['changelog/index'] },
    ],
  },
})
