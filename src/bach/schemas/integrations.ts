import { z } from 'astro/zod'

const _jsonSchemaProp = z.record(z.string(), z.unknown())

const _schemaShape = z.object({
  properties: z.record(z.string(), _jsonSchemaProp).optional(),
  required: z.array(z.string()).optional(),
})

const _actionSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  input: z.object({ schema: _schemaShape }).optional(),
  output: z.object({ schema: _schemaShape }).optional(),
})

const _eventSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  schema: _schemaShape.optional(),
})

export const integrationSchema = z.object({
  title: z.string(),
  description: z.string(),
  iconUrl: z.string(),
  actions: z.record(z.string(), _actionSchema).default({}),
  events: z.record(z.string(), _eventSchema).default({}),
})

export type JsonSchema = z.infer<typeof _jsonSchemaProp>
export type ActionSchema = z.infer<typeof _actionSchema>
export type EventSchema = z.infer<typeof _eventSchema>
export type IntegrationSchema = z.infer<typeof integrationSchema>
