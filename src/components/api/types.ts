import { z } from 'zod'

export const RequestStateSchema = z.object({
  baseUrl: z.string(),
  serverUrlSuffix: z.string().optional(),
  serverVars: z.record(z.string(), z.string()),
  pathParams: z.record(z.string(), z.string()),
  queryParams: z.record(z.string(), z.string()),
  headers: z.record(z.string(), z.string()),
  body: z.string(),
  token: z.string(),
})

export type RequestState = z.infer<typeof RequestStateSchema>

// Re-export content types from bach for component use
export type { Schema, Parameter, SecurityScheme, ServerVariable, Endpoint } from '@/bach/schemas'
