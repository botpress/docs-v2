import { useState, useCallback, useMemo } from 'react'
import CodeExamples, { type RequestState } from './api-examples'
import ApiPlayground, { generateDefaultBody, DEFAULT_BASE_URL } from './api-playground'

interface Schema {
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
}

interface Parameter {
  name: string
  in: string
  required?: boolean
  description?: string
  schema?: Schema
}

interface Endpoint {
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
}

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  POST: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  PUT: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  PATCH: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
  DELETE: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
}

function MethodBadge({ method }: { method: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold uppercase tracking-wide ${METHOD_COLORS[method] || 'bg-stone-100 text-stone-700'}`}
    >
      {method}
    </span>
  )
}

function schemaTypeLabel(schema: Schema): string {
  if (schema.enum) return 'enum'
  if (schema.oneOf) return schema.oneOf.map(schemaTypeLabel).join(' | ')
  if (schema.anyOf) return schema.anyOf.map(schemaTypeLabel).join(' | ')
  if (schema.type === 'array' && schema.items) return `${schemaTypeLabel(schema.items)}[]`
  return schema.format || schema.type || 'any'
}

function SchemaProperties({
  schema,
  required = [],
  depth = 0,
}: {
  schema: Schema
  required?: string[]
  depth?: number
}) {
  if (!schema.properties || depth > 4) return null

  return (
    <div className={depth > 0 ? 'border-l-2 border-stone-200 pl-4 dark:border-stone-700' : ''}>
      {Object.entries(schema.properties).map(([name, prop]) => {
        const isRequired = required.includes(name)
        const hasNested = prop.type === 'object' && prop.properties
        const hasArrayNested = prop.type === 'array' && prop.items?.type === 'object' && prop.items?.properties

        return (
          <div key={name} className="border-b border-stone-100 py-3 last:border-b-0 dark:border-stone-800">
            <div className="flex items-baseline gap-2">
              <code className="text-sm font-medium text-stone-900 dark:text-stone-100">{name}</code>
              <span className="text-xs text-stone-500 dark:text-stone-400">{schemaTypeLabel(prop)}</span>
              {isRequired && <span className="text-xs font-medium text-red-600 dark:text-red-400">required</span>}
              {prop.deprecated && (
                <span className="text-xs font-medium text-amber-600 dark:text-amber-400">deprecated</span>
              )}
            </div>
            {prop.description && <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">{prop.description}</p>}
            {prop.enum && (
              <div className="mt-1 flex flex-wrap gap-1">
                {prop.enum.map((v) => (
                  <code
                    key={v}
                    className="rounded bg-stone-100 px-1.5 py-0.5 text-xs text-stone-600 dark:bg-stone-800 dark:text-stone-400"
                  >
                    {v}
                  </code>
                ))}
              </div>
            )}
            {prop.default !== undefined && (
              <p className="mt-1 text-xs text-stone-500 dark:text-stone-500">
                Default:{' '}
                <code className="rounded bg-stone-100 px-1 dark:bg-stone-800">{JSON.stringify(prop.default)}</code>
              </p>
            )}
            {hasNested && <SchemaProperties schema={prop} required={prop.required} depth={depth + 1} />}
            {hasArrayNested && (
              <SchemaProperties schema={prop.items!} required={prop.items!.required} depth={depth + 1} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function ParameterTable({ parameters, location }: { parameters: Parameter[]; location: string }) {
  const filtered = parameters.filter((p) => p.in === location)
  if (filtered.length === 0) return null

  const labels: Record<string, string> = {
    path: 'Path parameters',
    query: 'Query parameters',
    header: 'Header parameters',
    cookie: 'Cookie parameters',
  }

  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-stone-900 dark:text-stone-100">{labels[location] || location}</h3>
      <div className="rounded-lg border border-stone-200 dark:border-stone-700">
        {filtered.map((param, i) => (
          <div
            key={param.name}
            className={`px-4 py-3 ${i < filtered.length - 1 ? 'border-b border-stone-200 dark:border-stone-700' : ''}`}
          >
            <div className="flex items-baseline gap-2">
              <code className="text-sm font-medium text-stone-900 dark:text-stone-100">{param.name}</code>
              <span className="text-xs text-stone-500 dark:text-stone-400">
                {param.schema ? schemaTypeLabel(param.schema) : 'string'}
              </span>
              {param.required && <span className="text-xs font-medium text-red-600 dark:text-red-400">required</span>}
            </div>
            {param.description && (
              <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">{param.description}</p>
            )}
            {param.schema?.enum && (
              <div className="mt-1 flex flex-wrap gap-1">
                {param.schema.enum.map((v) => (
                  <code
                    key={v}
                    className="rounded bg-stone-100 px-1.5 py-0.5 text-xs text-stone-600 dark:bg-stone-800 dark:text-stone-400"
                  >
                    {v}
                  </code>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function RequestBody({ body }: { body: NonNullable<Endpoint['requestBody']> }) {
  const contentType = Object.keys(body.content || {})[0]
  const schema = body.content?.[contentType!]?.schema
  if (!schema) return null

  return (
    <div>
      <h3 className="mb-1 text-sm font-semibold text-stone-900 dark:text-stone-100">Request body</h3>
      {body.description && <p className="mb-3 text-sm text-stone-600 dark:text-stone-400">{body.description}</p>}
      {contentType && (
        <p className="mb-3 text-xs text-stone-500 dark:text-stone-500">
          Content type: <code className="rounded bg-stone-100 px-1 dark:bg-stone-800">{contentType}</code>
          {body.required && <span className="ml-2 font-medium text-red-600 dark:text-red-400">required</span>}
        </p>
      )}
      <div className="rounded-lg border border-stone-200 px-4 dark:border-stone-700">
        <SchemaProperties schema={schema} required={schema.required} />
      </div>
    </div>
  )
}

function ResponseSection({ responses }: { responses: NonNullable<Endpoint['responses']> }) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-stone-900 dark:text-stone-100">Responses</h3>
      <div className="space-y-3">
        {Object.entries(responses).map(([status, resp]) => {
          const contentType = Object.keys(resp.content || {})[0]
          const schema = resp.content?.[contentType!]?.schema
          const isSuccess = status.startsWith('2')

          return (
            <details
              key={status}
              className="group rounded-lg border border-stone-200 dark:border-stone-700"
              open={isSuccess}
            >
              <summary className="flex cursor-pointer items-center gap-2 px-4 py-3 text-sm font-medium text-stone-900 dark:text-stone-100">
                <span
                  className={`inline-flex h-5 min-w-[2.5rem] items-center justify-center rounded text-xs font-bold ${
                    isSuccess
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                      : status === 'default' || status.startsWith('4') || status.startsWith('5')
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                        : 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300'
                  }`}
                >
                  {status}
                </span>
                {resp.description && <span className="text-stone-600 dark:text-stone-400">{resp.description}</span>}
              </summary>
              {schema?.properties && (
                <div className="border-t border-stone-200 px-4 dark:border-stone-700">
                  <SchemaProperties schema={schema} required={schema.required} />
                </div>
              )}
            </details>
          )
        })}
      </div>
    </div>
  )
}

export default function APIEndpoint({ endpoint }: { endpoint: Endpoint }) {
  const paramLocations = ['path', 'query', 'header', 'cookie']

  const bodySchema = useMemo(() => {
    if (!['POST', 'PUT', 'PATCH'].includes(endpoint.method) || !endpoint.requestBody?.content) return undefined
    const ct = Object.keys(endpoint.requestBody.content)[0]
    return endpoint.requestBody.content[ct!]?.schema
  }, [endpoint])

  const [requestState, setRequestState] = useState<RequestState>(() => {
    const pathParams: Record<string, string> = {}
    const queryParams: Record<string, string> = {}
    const headers: Record<string, string> = {}

    for (const p of endpoint.parameters || []) {
      if (p.in === 'path') pathParams[p.name] = p.schema?.example?.toString() || ''
      if (p.in === 'query') queryParams[p.name] = ''
      if (p.in === 'header') headers[p.name] = p.schema?.example?.toString() || ''
    }

    return {
      baseUrl: DEFAULT_BASE_URL,
      pathParams,
      queryParams,
      headers,
      body: bodySchema ? generateDefaultBody(bodySchema) : '',
      token: '',
    }
  })

  const handleStateChange = useCallback((next: RequestState) => {
    setRequestState(next)
  }, [])

  return (
    <div className="not-prose @container">
      <div className="flex flex-col gap-x-8 gap-y-6 px-8 pt-12 pb-8 sm:px-8 sm:pt-14 sm:pb-10 lg:px-12 @4xl:flex-row @4xl:items-start">
        {/* Left column: docs content */}
        <div className="min-w-0 flex-1 space-y-8">
          <div>
            <div className="flex items-center gap-3">
              <MethodBadge method={endpoint.method} />
              <code className="text-base font-medium text-stone-900 dark:text-stone-100">{endpoint.path}</code>
            </div>
            {endpoint.deprecated && (
              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
                This endpoint is deprecated.
              </div>
            )}
            {endpoint.experimental && (
              <div className="mt-3 rounded-lg border border-violet-200 bg-violet-50 px-4 py-2 text-sm text-violet-800 dark:border-violet-800 dark:bg-violet-900/20 dark:text-violet-200">
                This is an experimental endpoint and may change in future versions.
              </div>
            )}
            {endpoint.description && <p className="mt-4 text-stone-600 dark:text-stone-400">{endpoint.description}</p>}
          </div>

          <ApiPlayground endpoint={endpoint} state={requestState} onStateChange={handleStateChange} />

          {endpoint.parameters &&
            paramLocations.map((loc) => <ParameterTable key={loc} parameters={endpoint.parameters!} location={loc} />)}

          {endpoint.requestBody && <RequestBody body={endpoint.requestBody} />}

          {endpoint.responses && <ResponseSection responses={endpoint.responses} />}
        </div>

        {/* Right column: sticky code examples */}
        <div className="group/examples @4xl:sticky @4xl:top-4 @4xl:w-[400px] @4xl:shrink-0">
          <CodeExamples method={endpoint.method} path={endpoint.path} state={requestState} />
        </div>
      </div>
    </div>
  )
}
