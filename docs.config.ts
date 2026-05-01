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
