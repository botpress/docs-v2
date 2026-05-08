export const BOT_CONFIG = {
  name: 'Assistant',
  avatar: 'https://files.bpcontent.cloud/2025/11/19/21/20251119210301-2SLGBPIY.png',
  description: 'Ask AI a question about the documentation. Powered by Botpress.',
} as const

export const CLIENT_ID = '2c5b1299-4dd1-4d89-8f58-bd1045b1829b'

export interface ModelConfig {
  id: string
  displayName: string
  isDefault?: boolean
}

export const MODELS: ModelConfig[] = [
  { id: 'cerebras:gpt-oss-120b', displayName: 'GPT-OSS-120b', isDefault: true },
  { id: 'openai:gpt-4.1', displayName: 'GPT-4.1' },
  { id: 'anthropic:claude-sonnet-4-5', displayName: 'Claude Sonnet 4.5' },
  { id: 'google-ai:gemini-2.5-flash', displayName: 'Gemini 2.5 Flash' },
]

export const DEFAULT_MODEL = MODELS.find((m) => m.isDefault) ?? MODELS[0]

export const SUGGESTED_QUESTIONS: string[] = [
  'How do I add an AI agent to WhatsApp?',
  'What are Knowledge Bases?',
  'How to add a webhook to my agent?',
]
