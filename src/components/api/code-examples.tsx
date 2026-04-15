import { useState, useMemo } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import HighlightedCode from '@/components/api/highlighted-code'
import CopyButton from '@/components/api/copy-button'
import type { RequestState } from '@/components/api/types'

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

function resolveServerUrl(baseUrl: string, serverVars: Record<string, string>, serverUrlSuffix?: string): string {
  if (!serverUrlSuffix) return baseUrl
  let suffix = serverUrlSuffix
  for (const [key, value] of Object.entries(serverVars)) {
    suffix = suffix.replace(`{${key}}`, value || `{${key}}`)
  }
  return baseUrl + suffix
}

function headerPairs(headers: Record<string, string>, token: string): [string, string][] {
  const result: [string, string][] = []
  for (const [key, value] of Object.entries(headers)) {
    result.push([key, value || `<${key}>`])
  }
  result.push(['Authorization', `Bearer ${token || '<token>'}`])
  return result
}

const hasBody = (method: string) => ['POST', 'PUT', 'PATCH'].includes(method)

function generateCurl(method: string, url: string, hdrs: [string, string][], body: string): string {
  const lines: string[] = [`curl --request ${method} \\`, `  --url ${url}`]

  for (const [k, v] of hdrs) {
    lines.push(`  --header '${k}: ${v}'`)
  }

  if (body && hasBody(method)) {
    lines.push(`  --header 'Content-Type: application/json'`)
    lines.push(`  --data '\n${body}\n'`)
  }

  return lines.join(' \\\n')
}

function generatePython(method: string, url: string, hdrs: [string, string][], body: string): string {
  const lines: string[] = ['import requests', '']
  lines.push(`url = "${url}"`)
  lines.push('')

  if (body && hasBody(method)) {
    const pyBody = body
      .replace(/: true/g, ': True')
      .replace(/: false/g, ': False')
      .replace(/: null/g, ': None')
    lines.push(`payload = ${pyBody}`)
  }

  const pairs = hdrs.map(([k, v]) => `    "${k}": "${v}"`)
  if (body && hasBody(method)) {
    pairs.push(`    "Content-Type": "application/json"`)
  }
  lines.push(`headers = {\n${pairs.join(',\n')}\n}`)
  lines.push('')

  if (body && hasBody(method)) {
    lines.push(`response = requests.${method.toLowerCase()}(url, json=payload, headers=headers)`)
  } else {
    lines.push(`response = requests.${method.toLowerCase()}(url, headers=headers)`)
  }

  lines.push('')
  lines.push('print(response.text)')
  return lines.join('\n')
}

function generateJavaScript(method: string, url: string, hdrs: [string, string][], body: string): string {
  const pairs = hdrs.map(([k, v]) => (k.match(/^[a-zA-Z]+$/) ? `    ${k}: '${v}'` : `    '${k}': '${v}'`))
  if (body && hasBody(method)) {
    pairs.push(`    'Content-Type': 'application/json'`)
  }

  const parts: string[] = [`  method: '${method}'`, `  headers: {\n${pairs.join(',\n')}\n  }`]
  if (body && hasBody(method)) {
    parts.push(`  body: JSON.stringify(${body})`)
  }

  const lines: string[] = []
  lines.push(`const options = {\n${parts.join(',\n')}\n};`)
  lines.push('')
  lines.push(`fetch('${url}', options)`)
  lines.push('  .then(res => res.json())')
  lines.push('  .then(res => console.log(res))')
  lines.push('  .catch(err => console.error(err));')
  return lines.join('\n')
}

function jsonToPhpArray(value: unknown, indent: number): string {
  const pad = ' '.repeat(indent)
  const innerPad = ' '.repeat(indent + 4)

  if (value === null || value === undefined) return 'null'
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (typeof value === 'number') return String(value)
  if (typeof value === 'string') return `'${value.replace(/'/g, "\\'")}'`

  if (Array.isArray(value)) {
    if (value.length === 0) return '[]'
    const items = value.map((item) => `${innerPad}${jsonToPhpArray(item, indent + 4)}`)
    return `[\n${items.join(',\n')}\n${pad}]`
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
    if (entries.length === 0) return '[]'
    const items = entries.map(([k, v]) => `${innerPad}'${k}' => ${jsonToPhpArray(v, indent + 4)}`)
    return `[\n${items.join(',\n')}\n${pad}]`
  }

  return String(value)
}

function generatePHP(method: string, url: string, hdrs: [string, string][], body: string): string {
  const lines: string[] = ['<?php', '', '$curl = curl_init();', '']

  const opts: string[] = []
  opts.push(`  CURLOPT_URL => "${url}"`)
  opts.push('  CURLOPT_RETURNTRANSFER => true')
  opts.push('  CURLOPT_ENCODING => ""')
  opts.push('  CURLOPT_MAXREDIRS => 10')
  opts.push('  CURLOPT_TIMEOUT => 30')
  opts.push('  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1')
  opts.push(`  CURLOPT_CUSTOMREQUEST => "${method}"`)

  if (body && hasBody(method)) {
    try {
      const parsed = JSON.parse(body)
      opts.push(`  CURLOPT_POSTFIELDS => json_encode(${jsonToPhpArray(parsed, 2)})`)
    } catch {
      opts.push(`  CURLOPT_POSTFIELDS => '${body}'`)
    }
  }

  const hdrLines = hdrs.map(([k, v]) => `    "${k}: ${v}"`)
  if (body && hasBody(method)) {
    hdrLines.push(`    "Content-Type: application/json"`)
  }
  opts.push(`  CURLOPT_HTTPHEADER => [\n${hdrLines.join(',\n')}\n  ]`)

  lines.push(`curl_setopt_array($curl, [\n${opts.join(',\n')}\n]);`)
  lines.push('')
  lines.push('$response = curl_exec($curl);')
  lines.push('$err = curl_error($curl);')
  lines.push('')
  lines.push('curl_close($curl);')
  lines.push('')
  lines.push('if ($err) {')
  lines.push('  echo "cURL Error #:" . $err;')
  lines.push('} else {')
  lines.push('  echo $response;')
  lines.push('}')
  return lines.join('\n')
}

function generateGo(method: string, url: string, hdrs: [string, string][], body: string): string {
  const imports = ['\t"fmt"', '\t"net/http"', '\t"io"']
  if (body && hasBody(method)) {
    imports.push('\t"strings"')
  }
  imports.sort()

  const lines: string[] = ['package main', '', `import (\n${imports.join('\n')}\n)`, '', 'func main() {', '']
  lines.push(`\turl := "${url}"`)
  lines.push('')

  if (body && hasBody(method)) {
    const escaped = body.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')
    lines.push(`\tpayload := strings.NewReader("${escaped}")`)
    lines.push('')
    lines.push(`\treq, _ := http.NewRequest("${method}", url, payload)`)
  } else {
    lines.push(`\treq, _ := http.NewRequest("${method}", url, nil)`)
  }

  lines.push('')
  for (const [k, v] of hdrs) {
    lines.push(`\treq.Header.Add("${k}", "${v}")`)
  }
  if (body && hasBody(method)) {
    lines.push(`\treq.Header.Add("Content-Type", "application/json")`)
  }

  lines.push('')
  lines.push('\tres, _ := http.DefaultClient.Do(req)')
  lines.push('')
  lines.push('\tdefer res.Body.Close()')
  lines.push('\tbody, _ := io.ReadAll(res.Body)')
  lines.push('')
  lines.push('\tfmt.Println(string(body))')
  lines.push('')
  lines.push('}')
  return lines.join('\n')
}

function generateJava(method: string, url: string, hdrs: [string, string][], body: string): string {
  const lines: string[] = []

  if (body && hasBody(method)) {
    const escaped = body.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')
    lines.push(`HttpResponse<String> response = Unirest.${method.toLowerCase()}("${url}")`)
    for (const [k, v] of hdrs) {
      lines.push(`  .header("${k}", "${v}")`)
    }
    lines.push(`  .header("Content-Type", "application/json")`)
    lines.push(`  .body("${escaped}")`)
    lines.push('  .asString();')
  } else {
    lines.push(`HttpResponse<String> response = Unirest.${method.toLowerCase()}("${url}")`)
    for (const [k, v] of hdrs) {
      lines.push(`  .header("${k}", "${v}")`)
    }
    lines.push('  .asString();')
  }

  return lines.join('\n')
}

function generateRuby(method: string, url: string, hdrs: [string, string][], body: string): string {
  const lines: string[] = ["require 'uri'", "require 'net/http'", '']
  lines.push(`url = URI("${url}")`)
  lines.push('')
  lines.push('http = Net::HTTP.new(url.host, url.port)')
  lines.push('http.use_ssl = true')
  lines.push('')

  const methodClass: Record<string, string> = {
    GET: 'Get',
    POST: 'Post',
    PUT: 'Put',
    PATCH: 'Patch',
    DELETE: 'Delete',
  }
  lines.push(`request = Net::HTTP::${methodClass[method] || 'Get'}.new(url)`)

  for (const [k, v] of hdrs) {
    lines.push(`request["${k}"] = '${v}'`)
  }

  if (body && hasBody(method)) {
    lines.push(`request["Content-Type"] = 'application/json'`)
    const escaped = body.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')
    lines.push(`request.body = "${escaped}"`)
  }

  lines.push('')
  lines.push('response = http.request(request)')
  lines.push('puts response.read_body')
  return lines.join('\n')
}

type Lang = 'curl' | 'python' | 'javascript' | 'php' | 'go' | 'java' | 'ruby'

const LANGUAGES: { key: Lang; label: string; shiki: string }[] = [
  { key: 'curl', label: 'cURL', shiki: 'bash' },
  { key: 'python', label: 'Python', shiki: 'python' },
  { key: 'javascript', label: 'JavaScript', shiki: 'javascript' },
  { key: 'php', label: 'PHP', shiki: 'php' },
  { key: 'go', label: 'Go', shiki: 'go' },
  { key: 'java', label: 'Java', shiki: 'java' },
  { key: 'ruby', label: 'Ruby', shiki: 'ruby' },
]

const GENERATORS: Record<Lang, (method: string, url: string, hdrs: [string, string][], body: string) => string> = {
  curl: generateCurl,
  python: generatePython,
  javascript: generateJavaScript,
  php: generatePHP,
  go: generateGo,
  java: generateJava,
  ruby: generateRuby,
}

export default function CodeExamples({ method, path, state }: CodeExamplesProps) {
  const [activeLang, setActiveLang] = useState<Lang>('curl')

  const url = useMemo(
    () =>
      buildUrl(
        resolveServerUrl(state.baseUrl, state.serverVars, state.serverUrlSuffix),
        path,
        state.pathParams,
        state.queryParams
      ),
    [state.baseUrl, state.serverVars, state.serverUrlSuffix, path, state.pathParams, state.queryParams]
  )

  const hdrs = useMemo(() => headerPairs(state.headers, state.token), [state.headers, state.token])

  const code = useMemo(
    () => GENERATORS[activeLang](method, url, hdrs, state.body),
    [activeLang, method, url, hdrs, state.body]
  )

  const shikiLang = LANGUAGES.find((l) => l.key === activeLang)!.shiki

  return (
    <div className="group/code-card flex shrink-0 max-h-[calc(50vh-4rem)] flex-col rounded-xl border border-stone-200 bg-stone-50 dark:border-stone-700 dark:bg-stone-800/50">
      <div className="flex shrink-0 items-center justify-between border-b border-stone-200 px-3 py-2 dark:border-stone-700">
        <span className="text-xs font-medium text-stone-500 dark:text-stone-400">Request</span>
        <Select value={activeLang} onValueChange={(v) => setActiveLang(v as Lang)}>
          <SelectTrigger size="sm" className="h-7 text-xs">
            <SelectValue placeholder="Language">{LANGUAGES.find((l) => l.key === activeLang)?.label}</SelectValue>
          </SelectTrigger>
          <SelectContent align="end" alignItemWithTrigger={false} className="p-1">
            {LANGUAGES.map((lang) => (
              <SelectItem key={lang.key} value={lang.key} className="px-1.5 py-1 pr-1.5 text-xs">
                {lang.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="relative min-h-0 flex-1 overflow-y-auto">
        <div className="p-4">
          <HighlightedCode code={code} language={shikiLang} />
        </div>
        <CopyButton text={code} />
      </div>
    </div>
  )
}

export { buildUrl, resolveServerUrl }
