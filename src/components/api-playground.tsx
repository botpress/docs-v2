import { useState, useCallback, useEffect, useMemo } from 'react'
import type { RequestState } from './api-examples'
import { buildUrl } from './api-examples'
import { Button } from './ui/button'

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
  parameters?: Parameter[]
  requestBody?: {
    required?: boolean
    description?: string
    content?: Record<string, { schema?: Schema }>
  }
}

interface PlaygroundProps {
  endpoint: Endpoint
  state: RequestState
  onStateChange: (state: RequestState) => void
}

interface PlaygroundResponse {
  status: number
  statusText: string
  body: string
  time: number
}

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

function StatusBadge({ status }: { status: number }) {
  const color =
    status < 300
      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
      : status < 400
        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
        : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'

  return <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-bold ${color}`}>{status}</span>
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
    <div className="rounded-lg border border-stone-200 dark:border-stone-700">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-stone-900 transition-colors hover:bg-stone-50 dark:text-stone-100 dark:hover:bg-stone-800/50"
      >
        <span className="flex items-center gap-2">
          <svg
            className={`h-4 w-4 text-stone-500 transition-transform ${isOpen ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          Try it
        </span>
        {!isOpen && <span className="text-xs text-stone-400">Expand to test this endpoint</span>}
      </button>

      {isOpen && (
        <div className="space-y-4 border-t border-stone-200 p-4 dark:border-stone-700">
          <div className="grid gap-3 sm:grid-cols-2">
            <FieldGroup label="Base URL">
              <input
                type="text"
                value={state.baseUrl}
                onChange={(e) => updateState({ baseUrl: e.target.value })}
                className="w-full rounded-md border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-900 outline-none transition-colors focus:border-stone-400 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:focus:border-stone-500"
              />
            </FieldGroup>
            <FieldGroup label="Bearer token">
              <input
                type="password"
                value={state.token}
                onChange={(e) => updateState({ token: e.target.value })}
                placeholder="pat_..."
                className="w-full rounded-md border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-900 outline-none transition-colors focus:border-stone-400 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:focus:border-stone-500"
              />
            </FieldGroup>
          </div>

          {pathParams.length > 0 && (
            <FieldGroup label="Path parameters">
              <div className="space-y-2">
                {pathParams.map((p) => (
                  <ParamInput
                    key={p.name}
                    param={p}
                    value={state.pathParams[p.name] || ''}
                    onChange={(v) => updateState({ pathParams: { ...state.pathParams, [p.name]: v } })}
                  />
                ))}
              </div>
            </FieldGroup>
          )}

          {queryParams.length > 0 && (
            <FieldGroup label="Query parameters">
              <div className="space-y-2">
                {queryParams.map((p) => (
                  <ParamInput
                    key={p.name}
                    param={p}
                    value={state.queryParams[p.name] || ''}
                    onChange={(v) => updateState({ queryParams: { ...state.queryParams, [p.name]: v } })}
                  />
                ))}
              </div>
            </FieldGroup>
          )}

          {headerParams.length > 0 && (
            <FieldGroup label="Headers">
              <div className="space-y-2">
                {headerParams.map((p) => (
                  <ParamInput
                    key={p.name}
                    param={p}
                    value={state.headers[p.name] || ''}
                    onChange={(v) => updateState({ headers: { ...state.headers, [p.name]: v } })}
                  />
                ))}
              </div>
            </FieldGroup>
          )}

          {hasBody && (
            <FieldGroup label="Request body">
              <textarea
                value={state.body}
                onChange={(e) => updateState({ body: e.target.value })}
                placeholder={bodySchema ? generateDefaultBody(bodySchema) : '{}'}
                rows={8}
                spellCheck={false}
                className="w-full rounded-md border border-stone-200 bg-white px-3 py-2 font-mono text-xs leading-relaxed text-stone-900 outline-none transition-colors focus:border-stone-400 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:focus:border-stone-500"
              />
            </FieldGroup>
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
              <pre className="max-h-80 overflow-auto p-4 text-xs leading-relaxed text-stone-800 dark:text-stone-200">
                <code>{response.body}</code>
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-stone-600 dark:text-stone-400">{label}</label>
      {children}
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
      <div className="flex w-32 shrink-0 items-center gap-1 pt-1.5">
        <code className="text-xs font-medium text-stone-700 dark:text-stone-300">{param.name}</code>
        {param.required && <span className="text-[10px] text-red-500">*</span>}
      </div>
      <div className="min-w-0 flex-1">
        {param.schema?.enum ? (
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-md border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-900 outline-none dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
          >
            <option value="">Select...</option>
            {param.schema.enum.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={param.schema?.example?.toString() || param.description || ''}
            className="w-full rounded-md border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-900 outline-none transition-colors focus:border-stone-400 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:focus:border-stone-500"
          />
        )}
        {param.description && <p className="mt-0.5 text-[11px] text-stone-400">{param.description}</p>}
      </div>
    </div>
  )
}

export { generateDefaultBody, DEFAULT_BASE_URL }
