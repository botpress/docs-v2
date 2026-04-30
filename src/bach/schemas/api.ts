import { z } from 'zod'

export const SchemaSchema = z
  .object({
    type: z.string(),
    properties: z.record(z.string(), z.any()),
    items: z.any(),
    required: z.array(z.string()),
    description: z.string(),
    enum: z.array(z.string()),
    default: z.unknown(),
    format: z.string(),
    example: z.unknown(),
    oneOf: z.array(z.any()),
    anyOf: z.array(z.any()),
    nullable: z.boolean(),
    minLength: z.number(),
    maxLength: z.number(),
    minimum: z.number(),
    maximum: z.number(),
    pattern: z.string(),
    title: z.string(),
    deprecated: z.boolean(),
    additionalProperties: z.union([z.boolean(), z.any()]),
  })
  .partial()

export type Schema = z.infer<typeof SchemaSchema>

export const ParameterSchema = z.object({
  name: z.string(),
  in: z.string(),
  required: z.boolean().optional(),
  description: z.string().optional(),
  schema: SchemaSchema.optional(),
})

export type Parameter = z.infer<typeof ParameterSchema>

export const SecuritySchemeSchema = z.object({
  type: z.string(),
  scheme: z.string().optional(),
  bearerFormat: z.string().optional(),
  description: z.string().optional(),
  name: z.string().optional(),
  in: z.string().optional(),
})

export type SecurityScheme = z.infer<typeof SecuritySchemeSchema>

export const ServerVariableSchema = z.object({
  name: z.string(),
  default: z.string(),
  description: z.string().optional(),
})

export type ServerVariable = z.infer<typeof ServerVariableSchema>

export const EndpointSchema = z.object({
  method: z.string(),
  path: z.string(),
  operationId: z.string().optional(),
  summary: z.string().optional(),
  description: z.string().optional(),
  deprecated: z.boolean().optional(),
  experimental: z.boolean().optional(),
  baseUrl: z.string().optional(),
  serverUrlSuffix: z.string().optional(),
  serverVariables: z.array(ServerVariableSchema).optional(),
  parameters: z.array(ParameterSchema).optional(),
  requestBody: z
    .object({
      required: z.boolean().optional(),
      description: z.string().optional(),
      content: z.record(z.string(), z.object({ schema: SchemaSchema.optional() })).optional(),
    })
    .optional(),
  responses: z
    .record(
      z.string(),
      z.object({
        description: z.string().optional(),
        content: z.record(z.string(), z.object({ schema: SchemaSchema.optional() })).optional(),
      })
    )
    .optional(),
  security: z.array(z.record(z.string(), z.array(z.string()))).optional(),
  securitySchemes: z.record(z.string(), SecuritySchemeSchema).optional(),
})

export type Endpoint = z.infer<typeof EndpointSchema>

export const DEFAULT_API_DESCRIPTION =
  'Explore the Botpress API reference for endpoints, parameters, and response schemas.'

export const apiCollectionSchema = z.object({
  title: z.string(),
  description: z.string().default(DEFAULT_API_DESCRIPTION),
  method: z.string(),
  apiSlug: z.string(),
  apiLabel: z.string(),
  sortOrder: z.number(),
  endpoint: EndpointSchema,
})

export type ApiCollectionSchema = z.infer<typeof apiCollectionSchema>
