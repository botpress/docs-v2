import React, { useCallback, useMemo, useState } from 'react'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Check, Copy, Play } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import PageOptions from '@/components/page-options'
import CodeExamples, { resolveServerUrl } from '@/components/api/code-examples'
import ResponseExamples from '@/components/api/response-examples'
import ApiPlayground, { generateDefaultBody, DEFAULT_BASE_URL } from '@/components/api/playground'
import SchemaExplorer, { schemaTypeLabel } from '@/components/api/schema-explorer'
import AuthRequirements from '@/components/api/auth-requirements'
import ContentTypeSwitcher from '@/components/api/content-type-switcher'
import type { Endpoint, Parameter } from '@/bach/schemas'
import type { RequestState } from '@/components/api/types'
import { badgeVariantForMethod } from '@/lib/utils'

function EndpointBar({
  method,
  path,
  baseUrl,
  serverUrlSuffix,
  serverVars,
  onTryIt,
}: {
  method: string
  path: string
  baseUrl?: string
  serverUrlSuffix?: string
  serverVars?: Record<string, string>
  onTryIt: () => void
}) {
  const { copied, copy } = useCopyToClipboard()
  const fullUrl = `${resolveServerUrl(baseUrl || DEFAULT_BASE_URL, serverVars || {}, serverUrlSuffix)}${path}`

  return (
    <div className="flex items-center gap-2 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 dark:border-stone-700 dark:bg-stone-800/50">
      <Badge variant={badgeVariantForMethod(method)}>{method}</Badge>
      <code className="min-w-0 flex-1 truncate text-sm font-medium text-stone-600 dark:text-stone-400">{path}</code>
      <Button variant="ghost" size="icon-sm" onClick={() => copy(fullUrl)} className="shrink-0" title="Copy URL">
        {copied ? <Check /> : <Copy />}
      </Button>
      <Button size="lg" onClick={onTryIt}>
        Try it
        <Play className="size-3.5" data-icon="inline-end" />
      </Button>
    </div>
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
      {filtered.map((param) => {
        const schema = param.schema || { type: 'string' }
        return (
          <SchemaExplorer
            key={param.name}
            schema={{
              type: 'object',
              properties: {
                [param.name]: { ...schema, description: param.description },
              },
              required: param.required ? [param.name] : [],
            }}
          />
        )
      })}
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
      <SchemaExplorer schema={schema} required={schema.required} />
    </div>
  )
}

function ResponseSection({ responses }: { responses: NonNullable<Endpoint['responses']> }) {
  const statuses = Object.keys(responses)
  const defaultStatus = statuses.find((s) => s.startsWith('2')) || statuses[0] || ''
  const [activeStatus, setActiveStatus] = useState(defaultStatus)
  const resp = responses[activeStatus]

  const contentTypes = Object.keys(resp?.content || {})
  const [activeType, setActiveType] = useState(
    contentTypes.includes('application/json') ? 'application/json' : contentTypes[0] || ''
  )
  const schema = resp?.content?.[activeType]?.schema

  const handleStatusChange = (status: string) => {
    setActiveStatus(status)
    const newResp = responses[status]
    const newContentTypes = Object.keys(newResp?.content || {})
    setActiveType(newContentTypes.includes('application/json') ? 'application/json' : newContentTypes[0] || '')
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-100">Response</h2>
        {statuses.length > 1 ? (
          <Select
            value={activeStatus}
            onValueChange={(v) => {
              if (v) handleStatusChange(v)
            }}
          >
            <SelectTrigger size="sm" className="h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start" alignItemWithTrigger={false} className="p-1">
              {statuses.map((s) => (
                <SelectItem key={s} value={s} className="px-1.5 py-1 pr-1.5">
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <code className="text-sm font-medium text-stone-600 dark:text-stone-400">{activeStatus}</code>
        )}
        {contentTypes.length > 1 && (
          <ContentTypeSwitcher types={contentTypes} value={activeType} onChange={setActiveType} />
        )}
      </div>
      <Separator className="my-3" />
      {resp?.description && <p className="mb-3 text-sm text-stone-600 dark:text-stone-400">{resp.description}</p>}
      {schema && (schema.title || schema.type) && (
        <p className="mb-3 text-sm text-stone-600 dark:text-stone-400">
          The response is of type{' '}
          {schema.title && (
            <>
              <code className="rounded bg-stone-100 px-1 py-0.5 text-xs text-stone-900 dark:bg-stone-800 dark:text-stone-100">
                {schema.title}
              </code>
              {' · '}
            </>
          )}
          {schemaTypeLabel(schema)}.
        </p>
      )}
      {schema && <SchemaExplorer schema={schema} required={schema.required} />}
    </div>
  )
}

interface APIPageProps {
  endpoint: Endpoint
  title: string
  breadcrumbs: { label: string; href?: string }[]
  markdownUrl: string
}

export default function APIPage({ endpoint, title, breadcrumbs, markdownUrl }: APIPageProps) {
  const paramLocations = ['header', 'path', 'query', 'cookie']
  const [playgroundOpen, setPlaygroundOpen] = useState(false)

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
      if (p.in === 'header' && p.required) headers[p.name] = p.schema?.example?.toString() || ''
    }

    const serverVars: Record<string, string> = {}
    for (const v of endpoint.serverVariables || []) {
      serverVars[v.name] = v.default
    }

    return {
      baseUrl: endpoint.baseUrl || DEFAULT_BASE_URL,
      serverUrlSuffix: endpoint.serverUrlSuffix,
      serverVars,
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
    <div className="not-prose">
      <div className="flex flex-col gap-x-10 gap-y-6 xl:flex-row">
        {/* Left column: docs + endpoint bar */}
        <div className="min-w-0 w-full xl:flex-1 xl:max-w-[40rem] space-y-8">
          {/* Page header */}
          <div>
            <div className="hidden items-start justify-between gap-4 lg:flex">
              {breadcrumbs.length > 0 ? (
                <Breadcrumb className="min-w-0 flex-1">
                  <BreadcrumbList>
                    {breadcrumbs.map((crumb, i) => (
                      <React.Fragment key={crumb.label}>
                        {i > 0 && <BreadcrumbSeparator />}
                        <BreadcrumbItem className="truncate">
                          <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
                        </BreadcrumbItem>
                      </React.Fragment>
                    ))}
                  </BreadcrumbList>
                </Breadcrumb>
              ) : (
                <div />
              )}
              <PageOptions markdownUrl={markdownUrl} />
            </div>

            <h1 className="font-heading text-2xl font-semibold text-stone-900 lg:text-3xl dark:text-stone-100">
              {title}
            </h1>
            {endpoint.description && <p className="mt-3 text-stone-600 dark:text-stone-400">{endpoint.description}</p>}

            <div className="mt-3 lg:hidden">
              <PageOptions markdownUrl={markdownUrl} />
            </div>
          </div>

          {/* Endpoint bar with Try it button */}
          <div>
            <EndpointBar
              method={endpoint.method}
              path={endpoint.path}
              baseUrl={endpoint.baseUrl}
              serverUrlSuffix={endpoint.serverUrlSuffix}
              serverVars={requestState.serverVars}
              onTryIt={() => setPlaygroundOpen(true)}
            />
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
          </div>

          <AuthRequirements security={endpoint.security} securitySchemes={endpoint.securitySchemes} />

          {endpoint.parameters &&
            paramLocations.map((loc) => (
              <ParameterSection key={loc} parameters={endpoint.parameters!} location={loc} />
            ))}

          {endpoint.requestBody && <RequestBodySection body={endpoint.requestBody} />}

          {endpoint.responses && <ResponseSection responses={endpoint.responses} />}
        </div>

        {/* Right column: static examples */}
        <aside className="api-examples-panel hidden w-112 shrink-0 xl:block">
          <div className="group/examples sticky top-10 flex max-h-[calc(100vh-8rem)] flex-col gap-4">
            <CodeExamples method={endpoint.method} path={endpoint.path} state={requestState} />
            {endpoint.responses && <ResponseExamples responses={endpoint.responses} />}
          </div>
        </aside>
      </div>

      {/* Playground dialog */}
      <ApiPlayground
        endpoint={endpoint}
        state={requestState}
        onStateChange={handleStateChange}
        open={playgroundOpen}
        onOpenChange={setPlaygroundOpen}
      />
    </div>
  )
}
