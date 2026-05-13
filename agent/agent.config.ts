import { z, defineConfig } from '@botpress/runtime'

export default defineConfig({
  name: 'adk-docsv2-bot',
  description: 'An AI agent built with Botpress ADK',

  defaultModels: {
    autonomous: 'openai:gpt-4.1-2025-04-14',
    zai: 'openai:gpt-4.1-2025-04-14',
  },

  bot: {
    state: z.object({}),
  },

  user: {
    state: z.object({}),
  },

  conversation: {
    tags: {
      chatSummaryTitle: {
        title: 'Chat Summary Title',
        description: 'A short summary of the conversation topic',
      },
      hasMessages: {
        title: 'Has Messages',
        description: 'Whether the conversation has messages in it',
      },
    },
  },

  dependencies: {
    integrations: {
      chat: 'chat@0.7.3',
      webchat: 'webchat@0.3.0',
    },
  },
})
