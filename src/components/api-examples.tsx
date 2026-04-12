import { useState, useMemo } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs'

interface RequestState {
  baseUrl: string
  pathParams: Record<string, string>
  queryParams: Record<string, string>
  headers: Record<string, string>
  body: string
  token: string
}

interface CodeExamplesProps {
  method: string
  path: string
  state: RequestState
}

function buildUrl(
  baseUrl: string,
  path: string,
  pathParams: Record<string, string>,
  queryParams: Record<string, string>
): string {
  let url = path
  for (const [key, value] of Object.entries(pathParams)) {
    url = url.replace(`{${key}}`, value || `{${key}}`)
  }

  const queryEntries = Object.entries(queryParams).filter(([, v]) => v)
  const qs =
    queryEntries.length > 0
      ? '?' + queryEntries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&')
      : ''

  return `${baseUrl}${url}${qs}`
}

function generateCurl(
  method: string,
  url: string,
  headers: Record<string, string>,
  token: string,
  body: string
): string {
  const lines: string[] = [`curl -X ${method} \\`, `  '${url}'`]

  if (token) {
    lines.push(`  -H 'Authorization: Bearer ${token}'`)
  }

  for (const [key, value] of Object.entries(headers)) {
    if (!value) continue
    lines.push(`  -H '${key}: ${value}'`)
  }

  if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
    lines.push(`  -H 'Content-Type: application/json'`)
    lines.push(`  -d '${body}'`)
  }

  return lines.join(' \\\n')
}

function generateJavaScript(
  method: string,
  url: string,
  headers: Record<string, string>,
  token: string,
  body: string
): string {
  const opts: string[] = [`  method: '${method}'`]
  const hdrs: string[] = []

  if (token) hdrs.push(`    Authorization: 'Bearer ${token}'`)
  for (const [key, value] of Object.entries(headers)) {
    if (!value) continue
    hdrs.push(`    '${key}': '${value}'`)
  }
  if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
    hdrs.push(`    'Content-Type': 'application/json'`)
  }

  if (hdrs.length > 0) {
    opts.push(`  headers: {\n${hdrs.join(',\n')}\n  }`)
  }

  if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
    opts.push(`  body: JSON.stringify(${body})`)
  }

  return `const response = await fetch('${url}', {\n${opts.join(',\n')}\n})\n\nconst data = await response.json()\nconsole.log(data)`
}

function generatePython(
  method: string,
  url: string,
  headers: Record<string, string>,
  token: string,
  body: string
): string {
  const lines: string[] = ['import requests', '']

  const hdrs: string[] = []
  if (token) hdrs.push(`    "Authorization": "Bearer ${token}"`)
  for (const [key, value] of Object.entries(headers)) {
    if (!value) continue
    hdrs.push(`    "${key}": "${value}"`)
  }

  if (hdrs.length > 0) {
    lines.push(`headers = {\n${hdrs.join(',\n')}\n}`)
  }

  if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
    lines.push(`payload = ${body}`)
    lines.push('')
    lines.push(
      `response = requests.${method.toLowerCase()}(\n    "${url}",\n    headers=${hdrs.length > 0 ? 'headers' : '{}'},\n    json=payload\n)`
    )
  } else {
    lines.push('')
    lines.push(
      `response = requests.${method.toLowerCase()}(\n    "${url}"${hdrs.length > 0 ? ',\n    headers=headers' : ''}\n)`
    )
  }

  lines.push('')
  lines.push('print(response.json())')

  return lines.join('\n')
}

export default function CodeExamples({ method, path, state }: CodeExamplesProps) {
  const [activeTab, setActiveTab] = useState('curl')

  const url = useMemo(
    () => buildUrl(state.baseUrl, path, state.pathParams, state.queryParams),
    [state.baseUrl, path, state.pathParams, state.queryParams]
  )

  const examples = useMemo(
    () => ({
      curl: generateCurl(method, url, state.headers, state.token, state.body),
      javascript: generateJavaScript(method, url, state.headers, state.token, state.body),
      python: generatePython(method, url, state.headers, state.token, state.body),
    }),
    [method, url, state.headers, state.token, state.body]
  )

  return (
    <div className="rounded-lg border border-stone-200 bg-stone-50 dark:border-stone-700 dark:bg-stone-800/50">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="border-b border-stone-200 px-3 pt-2 dark:border-stone-700">
          <TabsList variant="line" className="h-8 gap-0">
            <TabsTrigger value="curl" className="px-2.5 text-xs">
              curl
            </TabsTrigger>
            <TabsTrigger value="javascript" className="px-2.5 text-xs">
              JavaScript
            </TabsTrigger>
            <TabsTrigger value="python" className="px-2.5 text-xs">
              Python
            </TabsTrigger>
          </TabsList>
        </div>

        {(['curl', 'javascript', 'python'] as const).map((lang) => (
          <TabsContent key={lang} value={lang} className="p-0">
            <div className="relative">
              <pre className="overflow-x-auto p-4 text-xs leading-relaxed text-stone-800 dark:text-stone-200">
                <code>{examples[lang]}</code>
              </pre>
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(examples[lang])}
                className="absolute top-2 right-2 rounded-md border border-stone-200 bg-white p-1.5 text-stone-500 opacity-0 transition-opacity hover:text-stone-900 group-hover/examples:opacity-100 focus:opacity-100 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-400 dark:hover:text-stone-200"
                title="Copy to clipboard"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              </button>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

export { buildUrl }
export type { RequestState }
