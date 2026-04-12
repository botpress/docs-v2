import { useState, useCallback, useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import CodeExamples from './api/code-examples'
import ResponseExamples from './api/response-examples'
import ApiPlayground, { generateDefaultBody, DEFAULT_BASE_URL } from './api/playground'
import SchemaExplorer from './api/schema-explorer'
import AuthRequirements from './api/auth-requirements'
import ContentTypeSwitcher from './api/content-type-switcher'
import type { Endpoint, RequestState, Parameter } from './api/types'

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

function ParameterSection({ parameters, location }: { parameters: Parameter[]; location: string }) {
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
      <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-100">{labels[location] || location}</h2>
      <Separator className="my-3" />
      <div className="rounded-lg border border-stone-200 px-4 dark:border-stone-700">
        {filtered.map((param) => {
          const schema = param.schema || { type: 'string' }
          return (
            <SchemaExplorer
              key={param.name}
              schema={{
                type: 'object',
                properties: { [param.name]: { ...schema, description: param.description } },
                required: param.required ? [param.name] : [],
              }}
            />
          )
        })}
      </div>
    </div>
  )
}

function RequestBodySection({ body }: { body: NonNullable<Endpoint['requestBody']> }) {
  const contentTypes = Object.keys(body.content || {})
  const [activeType, setActiveType] = useState(
    contentTypes.includes('application/json') ? 'application/json' : contentTypes[0] || ''
  )
  const schema = body.content?.[activeType]?.schema
  if (!schema) return null

  return (
    <div>
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-100">Request body</h2>
        <ContentTypeSwitcher types={contentTypes} value={activeType} onChange={setActiveType} />
        {body.required && <Badge variant="required">required</Badge>}
      </div>
      <Separator className="my-3" />
      {body.description && <p className="mb-3 text-sm text-stone-600 dark:text-stone-400">{body.description}</p>}
      <div className="rounded-lg border border-stone-200 px-4 dark:border-stone-700">
        <SchemaExplorer schema={schema} required={schema.required} />
      </div>
    </div>
  )
}

function ResponseSection({ responses }: { responses: NonNullable<Endpoint['responses']> }) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-100">Responses</h2>
      <Separator className="my-3" />
      <div className="space-y-3">
        {Object.entries(responses).map(([status, resp]) => (
          <ResponseStatusSection key={status} status={status} resp={resp} />
        ))}
      </div>
    </div>
  )
}

function ResponseStatusSection({
  status,
  resp,
}: {
  status: string
  resp: { description?: string; content?: Record<string, { schema?: import('./api/types').Schema }> }
}) {
  const contentTypes = Object.keys(resp.content || {})
  const [activeType, setActiveType] = useState(
    contentTypes.includes('application/json') ? 'application/json' : contentTypes[0] || ''
  )
  const schema = resp.content?.[activeType]?.schema
  const isSuccess = status.startsWith('2')

  return (
    <details className="group rounded-lg border border-stone-200 dark:border-stone-700" open={isSuccess}>
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
        {contentTypes.length > 1 && (
          <span className="ml-auto" onClick={(e) => e.stopPropagation()}>
            <ContentTypeSwitcher types={contentTypes} value={activeType} onChange={setActiveType} />
          </span>
        )}
      </summary>
      {schema && (
        <div className="border-t border-stone-200 px-4 dark:border-stone-700">
          <SchemaExplorer schema={schema} required={schema.required} />
        </div>
      )}
    </details>
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
    <div className="not-prose @container mt-6">
      <div className="flex flex-col gap-x-8 gap-y-6 xl:flex-row xl:items-start">
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

          <AuthRequirements security={endpoint.security} securitySchemes={endpoint.securitySchemes} />

          <ApiPlayground endpoint={endpoint} state={requestState} onStateChange={handleStateChange} />

          {endpoint.parameters &&
            paramLocations.map((loc) => (
              <ParameterSection key={loc} parameters={endpoint.parameters!} location={loc} />
            ))}

          {endpoint.requestBody && <RequestBodySection body={endpoint.requestBody} />}

          {endpoint.responses && <ResponseSection responses={endpoint.responses} />}
        </div>

        <div className="group/examples space-y-4 xl:sticky xl:top-6 xl:max-h-[calc(100vh-6rem)] xl:w-[400px] xl:shrink-0 xl:self-start xl:overflow-y-auto">
          <CodeExamples method={endpoint.method} path={endpoint.path} state={requestState} />
          {endpoint.responses && <ResponseExamples responses={endpoint.responses} />}
        </div>
      </div>
    </div>
  )
}
