import { useState, useCallback, useEffect, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronRight } from 'lucide-react'
import { buildUrl } from '@/components/api/code-examples'
import HighlightedCode from '@/components/api/highlighted-code'
import type { Schema, Parameter, Endpoint, RequestState } from '@/components/api/types'

const STORAGE_KEY_TOKEN = 'bp-api-token'
const STORAGE_KEY_BASE_URL = 'bp-api-base-url'
const DEFAULT_BASE_URL = 'https://api.botpress.cloud'

function generateDefaultBody(schema: Schema | undefined): string {
  if (!schema?.properties) return '{}'

  const obj: Record<string, any> = {}
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

interface PlaygroundProps {
  endpoint: Endpoint
  state: RequestState
  onStateChange: (state: RequestState) => void
}

export default function ApiPlayground({ endpoint, state, onStateChange }: PlaygroundProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<PlaygroundResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      const savedToken = localStorage.getItem(STORAGE_KEY_TOKEN)
      const savedUrl = localStorage.getItem(STORAGE_KEY_BASE_URL)
      if (savedToken || savedUrl) {
        onStateChange({
          ...state,
          token: savedToken || state.token,
          baseUrl: savedUrl || state.baseUrl,
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
        if (patch.baseUrl !== undefined) localStorage.setItem(STORAGE_KEY_BASE_URL, patch.baseUrl)
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

    const url = buildUrl(state.baseUrl, endpoint.path, state.pathParams, state.queryParams)
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

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="rounded-lg border border-stone-200 dark:border-stone-700">
        <CollapsibleTrigger className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-sm font-medium text-stone-900 transition-colors hover:bg-stone-50 dark:text-stone-100 dark:hover:bg-stone-800/50">
          <span className="flex items-center gap-2">
            <ChevronRight
              className={`h-4 w-4 text-stone-500 transition-transform duration-150 ${isOpen ? 'rotate-90' : ''}`}
            />
            Try it
          </span>
          {!isOpen && <span className="text-xs text-stone-400">Expand to test this endpoint</span>}
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="space-y-4 border-t border-stone-200 p-4 dark:border-stone-700">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs text-stone-600 dark:text-stone-400">Base URL</Label>
                <Input
                  value={state.baseUrl}
                  onChange={(e) => updateState({ baseUrl: (e.target as HTMLInputElement).value })}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-stone-600 dark:text-stone-400">Bearer token</Label>
                <Input
                  type="password"
                  value={state.token}
                  onChange={(e) => updateState({ token: (e.target as HTMLInputElement).value })}
                  placeholder="pat_..."
                  className="h-8 text-sm"
                />
              </div>
            </div>

            {pathParams.length > 0 && (
              <ParamGroup
                label="Path parameters"
                params={pathParams}
                values={state.pathParams}
                onChange={(v) => updateState({ pathParams: v })}
              />
            )}

            {queryParams.length > 0 && (
              <ParamGroup
                label="Query parameters"
                params={queryParams}
                values={state.queryParams}
                onChange={(v) => updateState({ queryParams: v })}
              />
            )}

            {headerParams.length > 0 && (
              <ParamGroup
                label="Headers"
                params={headerParams}
                values={state.headers}
                onChange={(v) => updateState({ headers: v })}
              />
            )}

            {hasBody && (
              <div className="space-y-1.5">
                <Label className="text-xs text-stone-600 dark:text-stone-400">Request body</Label>
                <textarea
                  value={state.body}
                  onChange={(e) => updateState({ body: e.target.value })}
                  placeholder={bodySchema ? generateDefaultBody(bodySchema) : '{}'}
                  rows={8}
                  spellCheck={false}
                  className="w-full rounded-lg border border-input bg-transparent px-3 py-2 font-mono text-xs leading-relaxed text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                />
              </div>
            )}

            <div className="flex items-center gap-3">
              <Button onClick={sendRequest} disabled={loading} size="sm">
                {loading ? 'Sending...' : 'Send request'}
              </Button>
              {response && (
                <span className="flex items-center gap-2 text-xs text-stone-500">
                  <StatusBadge status={response.status} />
                  <span>{response.statusText}</span>
                  <span className="text-stone-400">{response.time}ms</span>
                </span>
              )}
            </div>

            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
                {error}
              </div>
            )}

            {response && (
              <div className="rounded-lg border border-stone-200 dark:border-stone-700">
                <div className="flex items-center gap-2 border-b border-stone-200 px-4 py-2 dark:border-stone-700">
                  <span className="text-xs font-medium text-stone-500 dark:text-stone-400">Response</span>
                </div>
                <div className="max-h-80 overflow-auto p-4">
                  <HighlightedCode code={response.body} language="json" />
                </div>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}

function ParamGroup({
  label,
  params,
  values,
  onChange,
}: {
  label: string
  params: Parameter[]
  values: Record<string, string>
  onChange: (values: Record<string, string>) => void
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-stone-600 dark:text-stone-400">{label}</Label>
      <div className="space-y-2">
        {params.map((p) => (
          <ParamInput
            key={p.name}
            param={p}
            value={values[p.name] || ''}
            onChange={(v) => onChange({ ...values, [p.name]: v })}
          />
        ))}
      </div>
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
    <div className="flex items-start gap-2">
      <div className="flex w-32 shrink-0 items-center gap-1.5 pt-1.5">
        <code className="text-xs font-medium text-stone-700 dark:text-stone-300">{param.name}</code>
        {param.required && (
          <Badge variant="required" className="h-4 px-1 text-[10px]">
            *
          </Badge>
        )}
      </div>
      <div className="min-w-0 flex-1">
        {param.schema?.enum ? (
          <Select
            value={value}
            onValueChange={(v) => {
              if (v) onChange(v)
            }}
          >
            <SelectTrigger size="sm" className="h-8 w-full text-sm">
              <SelectValue placeholder="Select..." />
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
            placeholder={param.schema?.example?.toString() || param.description || ''}
            className="h-8 text-sm"
          />
        )}
        {param.description && <p className="mt-0.5 text-[11px] text-stone-400">{param.description}</p>}
      </div>
    </div>
  )
}

export { generateDefaultBody, DEFAULT_BASE_URL }
