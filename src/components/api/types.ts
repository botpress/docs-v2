export interface Schema {
  type?: string
  properties?: Record<string, Schema>
  items?: Schema
  required?: string[]
  description?: string
  enum?: string[]
  default?: any
  format?: string
  example?: any
  oneOf?: Schema[]
  anyOf?: Schema[]
  nullable?: boolean
  minLength?: number
  maxLength?: number
  minimum?: number
  maximum?: number
  pattern?: string
  title?: string
  deprecated?: boolean
  additionalProperties?: boolean | Schema
}

export interface Parameter {
  name: string
  in: string
  required?: boolean
  description?: string
  schema?: Schema
}

export interface SecurityScheme {
  type: string
  scheme?: string
  bearerFormat?: string
  description?: string
  name?: string
  in?: string
}

export interface Endpoint {
  method: string
  path: string
  operationId?: string
  summary?: string
  description?: string
  deprecated?: boolean
  experimental?: boolean
  parameters?: Parameter[]
  requestBody?: {
    required?: boolean
    description?: string
    content?: Record<string, { schema?: Schema }>
  }
  responses?: Record<
    string,
    {
      description?: string
      content?: Record<string, { schema?: Schema }>
    }
  >
  security?: Record<string, string[]>[]
  securitySchemes?: Record<string, SecurityScheme>
}

export interface RequestState {
  baseUrl: string
  pathParams: Record<string, string>
  queryParams: Record<string, string>
  headers: Record<string, string>
  body: string
  token: string
}
