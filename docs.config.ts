import { defineConfig } from '@/bach'
import { adminApi, runtimeApi, filesApi, tablesApi } from '@botpress/api'

export default defineConfig({
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
            pages: [
              {
                group: 'Endpoints',
                pages: [],
                openapi: { api: adminApi, key: 'admin', slug: 'api-reference/admin-api', label: 'Admin API' },
              },
            ],
          },
          {
            group: 'Chat API',
            pages: [
              {
                group: 'Endpoints',
                pages: [],
                openapi: { file: 'chat-openapi.json', slug: 'api-reference/chat-api', label: 'Chat API' },
              },
            ],
          },
          {
            group: 'Files API',
            pages: [
              {
                group: 'Endpoints',
                pages: [],
                openapi: { api: filesApi, key: 'files', slug: 'api-reference/files-api', label: 'Files API' },
              },
            ],
          },
          {
            group: 'Runtime API',
            pages: [
              {
                group: 'Runtime API',
                pages: [],
                openapi: { api: runtimeApi, key: 'runtime', slug: 'api-reference/runtime-api', label: 'Runtime API' },
              },
            ],
          },
          {
            group: 'Tables API',
            pages: [
              {
                group: 'Endpoints',
                pages: [],
                openapi: { api: tablesApi, key: 'tables', slug: 'api-reference/tables-api', label: 'Tables API' },
              },
            ],
          },
        ],
      },
      { tab: 'Changelog', pages: ['changelog/index'] },
    ],
  },
})
