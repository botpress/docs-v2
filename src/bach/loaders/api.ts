import SwaggerParser from '@apidevtools/swagger-parser'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import type { DataStore, Loader, LoaderContext } from 'astro/loaders'
import type { Endpoint } from '../schemas/api'

const STATIC_SPECS_DIR = path.resolve('./public/api-specs')

interface OpenApiOperation {
  operationId?: string
  summary?: string
  description?: string
  deprecated?: boolean
  tags?: string[]
  parameters?: Record<string, unknown>[]
  requestBody?: Record<string, unknown>
  responses?: Record<string, unknown>
  security?: Record<string, string[]>[]
  'x-hidden'?: boolean
  'x-experimental'?: boolean
}

interface OpenApiPathItem {
  parameters?: Record<string, unknown>[]
  get?: OpenApiOperation
  post?: OpenApiOperation
  put?: OpenApiOperation
  patch?: OpenApiOperation
  delete?: OpenApiOperation
}

interface OpenApiSpec {
  paths: Record<string, OpenApiPathItem>
  servers?: { url: string; variables?: Record<string, { default?: string; description?: string }> }[]
  security?: Record<string, string[]>[]
  components?: { securitySchemes?: Record<string, unknown> }
}

export interface ApiSource {
  slug: string
  label: string
}

export interface PackageApiSource extends ApiSource {
  api: { exportOpenapi: (dir: string) => void }
  key: string
}

export interface StaticApiSource extends ApiSource {
  file: string
}

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete'] as const
const MARKDOWN_LINK_RE = /\[([^\]]+)\]\([^)]+\)/g

// TODO: actually include schemas in the docs so we don't have to strip these
function stripMarkdownLinks(input: unknown): unknown {
  if (typeof input === 'string') return input.replace(MARKDOWN_LINK_RE, '$1')

  if (Array.isArray(input)) return input.map(stripMarkdownLinks)

  if (input && typeof input === 'object') {
    const obj = input as Record<string, string | unknown>
    for (const key of Object.keys(obj)) {
      if (key === 'description' && typeof obj[key] === 'string') {
        obj[key] = obj[key].replace(MARKDOWN_LINK_RE, '$1')
      } else if (typeof obj[key] === 'object') {
        stripMarkdownLinks(obj[key])
      }
    }
    return obj
  }
  return input
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function tagFilterSpec(spec: OpenApiSpec): OpenApiSpec {
  for (const pathItem of Object.values(spec.paths || {})) {
    for (const method of HTTP_METHODS) {
      const op = pathItem[method]
      if (!op) continue

      if (!op.tags?.includes('documented')) {
        op['x-hidden'] = true
      } else {
        op.tags = op.tags.filter((t) => t !== 'documented')
      }

      if (op.tags?.includes('experimental') || op.tags?.includes('expermimental')) {
        op.tags = op.tags.filter((t) => t !== 'experimental' && t !== 'expermimental')
        op['x-experimental'] = true
      }
    }
  }
  return spec
}

function extractEndpoint(
  pathItem: OpenApiPathItem,
  method: (typeof HTTP_METHODS)[number],
  apiPath: string,
  spec: OpenApiSpec
): Endpoint {
  const op = pathItem[method]!

  const params = [...(pathItem.parameters || []), ...(op.parameters || [])]

  const security = op.security ?? spec.security
  const securitySchemes = spec.components?.securitySchemes

  const server = spec.servers?.[0]
  const rawUrl = server?.url
  const rawVars = server?.variables
  const serverVariables = rawVars
    ? Object.entries(rawVars).map(([name, v]) => ({ name, default: v.default || '', description: v.description }))
    : undefined

  const baseUrl = rawUrl?.replace(/\/?\{[^}]+\}/g, '').replace(/\/+$/, '') || undefined
  const serverUrlSuffix = rawUrl && baseUrl && rawUrl.length > baseUrl.length ? rawUrl.slice(baseUrl.length) : undefined

  return {
    method: method.toUpperCase(),
    path: apiPath,
    operationId: op.operationId,
    summary: op.summary,
    description: op.description,
    baseUrl,
    serverUrlSuffix,
    serverVariables: serverVariables?.length ? serverVariables : undefined,
    parameters: params.length > 0 ? (params as unknown as Endpoint['parameters']) : undefined,
    requestBody: (op.requestBody as Endpoint['requestBody']) || undefined,
    responses:
      op.responses && Object.keys(op.responses).length > 0 ? (op.responses as Endpoint['responses']) : undefined,
    security: security || undefined,
    securitySchemes: (securitySchemes as Endpoint['securitySchemes']) || undefined,
    deprecated: op.deprecated || false,
    experimental: op['x-experimental'] || false,
  }
}

export interface ApiEntryData {
  title: string
  description?: string
  method: string
  apiSlug: string
  apiLabel: string
  sortOrder: number
  endpoint: Endpoint
}

interface ApiLoaderOptions {
  packageApis: PackageApiSource[]
  staticApis: StaticApiSource[]
}

export function apiLoader({ packageApis, staticApis }: ApiLoaderOptions): Loader {
  return {
    name: 'api-loader',
    async load({ store, parseData }) {
      store.clear()

      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'api-specs-'))

      try {
        for (const entry of packageApis) {
          const exportDir = path.join(tmpDir, entry.key)

          console.log('Processing openapi for', entry.key)
          const origWrite = process.stdout.write
          //process.stdout.write = () => true
          try {
            entry.api.exportOpenapi(exportDir)
          } finally {
            process.stdout.write = origWrite
          }

          const specPath = path.join(exportDir, 'openapi.json')
          const raw = tagFilterSpec(JSON.parse(fs.readFileSync(specPath, 'utf-8')) as OpenApiSpec)
          const dereferenced = await SwaggerParser.dereference(
            raw as unknown as Parameters<typeof SwaggerParser.dereference>[0]
          )
          const spec = stripMarkdownLinks(dereferenced) as OpenApiSpec
          await processSpec(spec, entry.slug, entry.label, store, parseData)
        }

        for (const entry of staticApis) {
          const specPath = path.join(STATIC_SPECS_DIR, entry.file)
          const raw = JSON.parse(fs.readFileSync(specPath, 'utf-8'))
          const dereferenced = await SwaggerParser.dereference(raw)
          const spec = stripMarkdownLinks(dereferenced) as OpenApiSpec
          await processSpec(spec, entry.slug, entry.label, store, parseData)
        }
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true })
      }
    },
  }
}

async function processSpec(
  spec: OpenApiSpec,
  apiSlug: string,
  apiLabel: string,
  store: DataStore,
  parseData: LoaderContext['parseData']
) {
  let sortOrder = 0

  for (const [apiPath, pathItem] of Object.entries(spec.paths)) {
    for (const method of HTTP_METHODS) {
      const op = pathItem[method]
      if (!op) continue
      if (op['x-hidden']) continue

      const endpoint = extractEndpoint(pathItem, method, apiPath, spec)
      const operationId = op.operationId
      const filename = slugify(operationId || `${method}-${apiPath.replace(/\//g, '-')}`)
      const id = `${apiSlug}/${filename}`
      const title = operationId || `${method.toUpperCase()} ${apiPath}`
      const description = op.description?.split('\n')[0]?.slice(0, 200) || undefined

      const data = await parseData({
        id,
        data: {
          title,
          description,
          method: method.toUpperCase(),
          apiSlug,
          apiLabel,
          sortOrder,
          endpoint,
        },
      })

      store.set({ id, data })
      sortOrder++
    }
  }
}
