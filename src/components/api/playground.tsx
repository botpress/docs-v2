import { useCallback, useEffect, useMemo, useState } from 'react'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Dialog, DialogBackdrop, DialogPopup, DialogClose, DialogPortal, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Check, ChevronRight, Copy, Play, X } from 'lucide-react'
import { buildUrl, resolveServerUrl } from '@/components/api/code-examples'
import CodeExamples from '@/components/api/code-examples'
import HighlightedCode from '@/components/api/highlighted-code'
import CopyButton from '@/components/api/copy-button'
import type { Schema, Parameter, Endpoint } from '@/bach/schemas'
import type { RequestState } from '@/components/api/types'
import { badgeVariantForMethod } from '@/lib/utils'

const STORAGE_KEY_TOKEN = 'bp-api-token'
const DEFAULT_BASE_URL = 'https://api.botpress.cloud'

function generateDefaultBody(schema: Schema | undefined): string {
  if (!schema?.properties) return '{}'

  const obj: Record<string, unknown> = {}
  for (const [key, prop] of Object.entries(schema.properties)) {
    if (prop.example !== undefined) {
      obj[key] = prop.example
    } else if (prop.default !== undefined) {
      obj[key] = prop.default
    } else if (prop.enum?.[0]) {
      obj[key] = prop.enum[0]
    } else if (prop.type === 'string') {
      obj[key] = ''
    } else if (prop.type === 'number' || prop.type === 'integer') {
      obj[key] = 0
    } else if (prop.type === 'boolean') {
      obj[key] = false
    } else if (prop.type === 'array') {
      obj[key] = []
    } else if (prop.type === 'object') {
      obj[key] = {}
    }
  }

  return JSON.stringify(obj, null, 2)
}

interface PlaygroundResponse {
  status: number
  statusText: string
  body: string
  time: number
}

function StatusBadge({ status }: { status: number }) {
  const variant = status < 300 ? ('info' as const) : status < 400 ? ('deprecated' as const) : ('required' as const)
  return (
    <Badge variant={variant} className="font-bold">
      {status}
    </Badge>
  )
}

function CopyableUrl({ method, path, state }: { method: string; path: string; state: RequestState }) {
  const { copied, copy } = useCopyToClipboard()
  const fullUrl = buildUrl(
    resolveServerUrl(state.baseUrl, state.serverVars, state.serverUrlSuffix),
    path,
    state.pathParams,
    state.queryParams
  )

  return (
    <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-stone-200 bg-stone-50 px-3 py-1.5 dark:border-stone-700 dark:bg-stone-800/50">
      <Badge variant={badgeVariantForMethod(method)} className="text-[10px]">
        {method}
      </Badge>
      <code className="min-w-0 truncate text-sm font-medium text-stone-600 dark:text-stone-400">{path}</code>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => copy(fullUrl)}
        className="ml-auto shrink-0"
        title="Copy full URL"
      >
        {copied ? <Check /> : <Copy />}
      </Button>
    </div>
  )
}

interface PlaygroundProps {
  endpoint: Endpoint
  state: RequestState
  onStateChange: (state: RequestState) => void
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function ApiPlayground({ endpoint, state, onStateChange, open, onOpenChange }: PlaygroundProps) {
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<PlaygroundResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      const savedToken = localStorage.getItem(STORAGE_KEY_TOKEN)
      if (savedToken) {
        onStateChange({
          ...state,
          token: savedToken,
        })
      }
    } catch {}
  }, [])

  const updateState = useCallback(
    (patch: Partial<RequestState>) => {
      const next = { ...state, ...patch }
      onStateChange(next)

      try {
        if (patch.token !== undefined) localStorage.setItem(STORAGE_KEY_TOKEN, patch.token)
      } catch {}
    },
    [state, onStateChange]
  )

  const pathParams = useMemo(() => (endpoint.parameters || []).filter((p) => p.in === 'path'), [endpoint.parameters])
  const queryParams = useMemo(() => (endpoint.parameters || []).filter((p) => p.in === 'query'), [endpoint.parameters])
  const headerParams = useMemo(
    () => (endpoint.parameters || []).filter((p) => p.in === 'header'),
    [endpoint.parameters]
  )

  const hasServerVars = (endpoint.serverVariables?.length ?? 0) > 0
  const hasBody = ['POST', 'PUT', 'PATCH'].includes(endpoint.method)
  const bodySchema = useMemo(() => {
    if (!hasBody || !endpoint.requestBody?.content) return undefined
    const contentType = Object.keys(endpoint.requestBody.content)[0]
    return endpoint.requestBody.content[contentType!]?.schema
  }, [endpoint.requestBody, hasBody])

  const sendRequest = useCallback(async () => {
    setLoading(true)
    setError(null)
    setResponse(null)

    const url = buildUrl(
      resolveServerUrl(state.baseUrl, state.serverVars, state.serverUrlSuffix),
      endpoint.path,
      state.pathParams,
      state.queryParams
    )
    const headers: Record<string, string> = {}

    if (state.token) headers['Authorization'] = `Bearer ${state.token}`
    for (const [key, value] of Object.entries(state.headers)) {
      if (value) headers[key] = value
    }

    if (hasBody && state.body) {
      headers['Content-Type'] = 'application/json'
    }

    const start = performance.now()

    try {
      const res = await fetch(url, {
        method: endpoint.method,
        headers,
        body: hasBody && state.body ? state.body : undefined,
      })

      const time = Math.round(performance.now() - start)
      const text = await res.text()

      let formatted: string
      try {
        formatted = JSON.stringify(JSON.parse(text), null, 2)
      } catch {
        formatted = text
      }

      setResponse({ status: res.status, statusText: res.statusText, body: formatted, time })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed')
    } finally {
      setLoading(false)
    }
  }, [endpoint.method, endpoint.path, state, hasBody])

  const sectionCount = [
    true,
    hasServerVars,
    pathParams.length > 0,
    queryParams.length > 0,
    headerParams.length > 0,
    hasBody,
  ].filter(Boolean).length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup className="flex flex-col">
          {/* Header bar */}
          <div className="flex shrink-0 items-center gap-3 border-b border-stone-200 px-4 py-3 dark:border-stone-700">
            <DialogTitle className="sr-only">
              {endpoint.method} {endpoint.path}
            </DialogTitle>

            {/* Method badge + endpoint name */}
            <div className="flex shrink-0 items-center gap-2">
              <Badge variant={badgeVariantForMethod(endpoint.method)}>{endpoint.method}</Badge>
              <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
                {endpoint.operationId || endpoint.summary || endpoint.path}
              </span>
            </div>

            {/* Copyable endpoint path */}
            <CopyableUrl method={endpoint.method} path={endpoint.path} state={state} />

            {/* Send button */}
            <Button size="lg" onClick={sendRequest} disabled={loading}>
              {loading ? (
                <>
                  <Spinner className="size-3.5" data-icon="inline-start" />
                  Sending...
                </>
              ) : (
                <>
                  Send
                  <Play className="size-3.5" data-icon="inline-end" />
                </>
              )}
            </Button>

            {/* Close */}
            <DialogClose
              render={
                <Button variant="ghost" size="icon-sm" title="Close playground">
                  <X className="size-4" />
                </Button>
              }
            />
          </div>

          {/* Two-column layout */}
          <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
            {/* Left: param sections (2/3 width) */}
            <div className="min-h-0 min-w-0 flex-[2] overflow-y-auto lg:border-r lg:border-stone-200 lg:dark:border-stone-700">
              {endpoint.description && (
                <p className="border-b border-stone-100 px-5 py-3.5 text-sm text-stone-600 dark:border-stone-800 dark:text-stone-400">
                  {endpoint.description}
                </p>
              )}
              <div className={sectionCount > 1 ? 'divide-y divide-stone-100 dark:divide-stone-800' : ''}>
                {/* Authorization */}
                <ParamSection title="Authorization" defaultOpen badge={state.token ? 'set' : undefined}>
                  <div className="space-y-3">
                    <div className="grid grid-cols-[1fr_1fr] items-center gap-x-4">
                      <Label className="text-sm font-medium text-stone-700 dark:text-stone-300">Bearer token</Label>
                      <Input
                        value={state.token}
                        onChange={(e) => updateState({ token: (e.target as HTMLInputElement).value })}
                        placeholder="enter bearer token"
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-[1fr_1fr] items-center gap-x-4">
                      <Label className="text-sm font-medium text-stone-700 dark:text-stone-300">Base URL</Label>
                      <Input
                        value={state.baseUrl}
                        onChange={(e) => updateState({ baseUrl: (e.target as HTMLInputElement).value })}
                        placeholder="enter base URL"
                        className="h-9 text-sm"
                      />
                    </div>
                  </div>
                </ParamSection>

                {/* Server variables */}
                {hasServerVars && (
                  <ParamSection title="Server" defaultOpen count={endpoint.serverVariables!.length}>
                    <div className="space-y-3">
                      {endpoint.serverVariables!.map((v) => (
                        <div key={v.name} className="grid grid-cols-[1fr_1fr] items-start gap-x-4">
                          <div className="flex flex-col gap-1 pt-1">
                            <code className="text-sm font-semibold text-primary">{v.name}</code>
                            {v.description && (
                              <p className="text-sm text-stone-600 dark:text-stone-400">{v.description}</p>
                            )}
                          </div>
                          <Input
                            value={state.serverVars[v.name] || ''}
                            onChange={(e) =>
                              updateState({
                                serverVars: { ...state.serverVars, [v.name]: (e.target as HTMLInputElement).value },
                              })
                            }
                            placeholder={`enter ${v.name}`}
                            className="h-9 text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  </ParamSection>
                )}

                {/* Path parameters */}
                {pathParams.length > 0 && (
                  <ParamSection title="Path" defaultOpen count={pathParams.length}>
                    <ParamGroup
                      params={pathParams}
                      values={state.pathParams}
                      onChange={(v) => updateState({ pathParams: v })}
                    />
                  </ParamSection>
                )}

                {/* Query parameters */}
                {queryParams.length > 0 && (
                  <ParamSection title="Query" defaultOpen count={queryParams.length}>
                    <ParamGroup
                      params={queryParams}
                      values={state.queryParams}
                      onChange={(v) => updateState({ queryParams: v })}
                    />
                  </ParamSection>
                )}

                {/* Header parameters */}
                {headerParams.length > 0 && (
                  <ParamSection title="Headers" defaultOpen count={headerParams.length}>
                    <ParamGroup
                      params={headerParams}
                      values={state.headers}
                      onChange={(v) => updateState({ headers: v })}
                    />
                  </ParamSection>
                )}

                {/* Body */}
                {hasBody && (
                  <ParamSection title="Body" defaultOpen>
                    <div className="space-y-1.5">
                      <textarea
                        value={state.body}
                        onChange={(e) => updateState({ body: e.target.value })}
                        placeholder={bodySchema ? generateDefaultBody(bodySchema) : '{}'}
                        rows={10}
                        spellCheck={false}
                        className="w-full rounded-lg border border-input bg-transparent px-3 py-2 font-mono text-sm leading-relaxed text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                      />
                    </div>
                  </ParamSection>
                )}
              </div>
            </div>

            {/* Right: code blocks */}
            <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-y-auto border-t border-stone-200 p-4 lg:border-t-0 dark:border-stone-700">
              <CodeExamples method={endpoint.method} path={endpoint.path} state={state} />

              {error && (
                <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
                  {error}
                </div>
              )}

              {response && (
                <div className="group/code-card flex min-h-0 flex-col rounded-xl border border-stone-200 bg-stone-50 dark:border-stone-700 dark:bg-stone-800/50">
                  <div className="flex shrink-0 items-center gap-2 border-b border-stone-200 px-3 py-2 dark:border-stone-700">
                    <span className="text-xs font-medium text-stone-500 dark:text-stone-400">Response</span>
                    <StatusBadge status={response.status} />
                    <span className="text-xs text-stone-500">{response.statusText}</span>
                    <span className="text-xs text-stone-400">{response.time}ms</span>
                  </div>
                  <div className="relative min-h-0 flex-1 overflow-y-auto">
                    <div className="max-h-80 p-4">
                      <HighlightedCode code={response.body} language="json" />
                    </div>
                    <CopyButton text={response.body} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogPopup>
      </DialogPortal>
    </Dialog>
  )
}

function ParamSection({
  title,
  defaultOpen = false,
  badge,
  count,
  children,
}: {
  title: string
  defaultOpen?: boolean
  badge?: string
  count?: number
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full cursor-pointer items-center gap-2 px-5 py-3.5 text-sm transition-colors hover:bg-stone-50 dark:hover:bg-stone-800/50">
        <ChevronRight
          className={`size-4 shrink-0 text-stone-400 transition-transform duration-150 ${open ? 'rotate-90' : ''}`}
        />
        <span className="text-[0.9rem] font-semibold text-stone-800 dark:text-stone-200">{title}</span>
        {count !== undefined && <span className="text-xs text-stone-400">{count}</span>}
        {badge && (
          <Badge variant="info" className="ml-auto text-[10px]">
            {badge}
          </Badge>
        )}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-5 pb-5">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  )
}

function ParamGroup({
  params,
  values,
  onChange,
}: {
  params: Parameter[]
  values: Record<string, string>
  onChange: (values: Record<string, string>) => void
}) {
  return (
    <div>
      {params.map((p) => (
        <ParamInput
          key={p.name}
          param={p}
          value={values[p.name] || ''}
          onChange={(v) => onChange({ ...values, [p.name]: v })}
        />
      ))}
    </div>
  )
}

function ParamInput({
  param,
  value,
  onChange,
}: {
  param: Parameter
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="grid grid-cols-[1fr_1fr] items-start gap-x-4 border-b border-stone-100 py-4 last:border-b-0 dark:border-stone-800/50">
      <div className="flex flex-col gap-1.5 pt-1">
        <div className="flex flex-wrap items-center gap-2">
          <code className="text-sm font-semibold">
            <span className="text-primary">{param.name}</span>
            {!param.required && <span className="text-stone-600 dark:text-stone-400">?</span>}
          </code>
          <Badge variant="info">
            <code className="font-semibold">{param.schema?.type || 'string'}</code>
          </Badge>
        </div>
        {param.description && <p className="text-sm text-stone-600 dark:text-stone-400">{param.description}</p>}
      </div>
      <div className="pt-1">
        {param.schema?.enum ? (
          <Select
            value={value}
            onValueChange={(v) => {
              if (v) onChange(v)
            }}
          >
            <SelectTrigger size="sm" className="h-9 w-full text-sm">
              <SelectValue placeholder={`enter ${param.name}`} />
            </SelectTrigger>
            <SelectContent>
              {param.schema.enum.map((v) => (
                <SelectItem key={v} value={v}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            value={value}
            onChange={(e) => onChange((e.target as HTMLInputElement).value)}
            placeholder={`enter ${param.name}`}
            className="h-9 text-sm"
          />
        )}
      </div>
    </div>
  )
}

export { generateDefaultBody, DEFAULT_BASE_URL }
