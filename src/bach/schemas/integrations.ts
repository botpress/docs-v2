import { z } from 'astro/zod'

const _jsonSchema = z.record(z.string(), z.unknown())

const _actionSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  input: z.object({ schema: _jsonSchema }).optional(),
  output: z.object({ schema: _jsonSchema }).optional(),
})

const _eventSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  schema: _jsonSchema.optional(),
})

export const integrationSchema = z.object({
  title: z.string(),
  description: z.string(),
  iconUrl: z.string(),
  actions: z.record(z.string(), _actionSchema).default({}),
  events: z.record(z.string(), _eventSchema).default({}),
})

export type IntegrationSchema = z.infer<typeof integrationSchema>
