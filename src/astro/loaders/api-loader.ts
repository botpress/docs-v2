import SwaggerParser from '@apidevtools/swagger-parser'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import type { Loader } from 'astro/loaders'
import type { Endpoint } from '@/components/api/types'

const STATIC_SPECS_DIR = path.resolve('./public/api-specs')

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

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function tagFilterSpec(spec: any): any {
  for (const apiPath of Object.keys(spec.paths || {})) {
    for (const verb of Object.keys(spec.paths[apiPath])) {
      if (!HTTP_METHODS.includes(verb as any)) continue
      const op = spec.paths[apiPath][verb]

      if (!op.tags?.includes('documented')) {
        op['x-hidden'] = true
      } else {
        op.tags = op.tags.filter((t: string) => t !== 'documented')
      }

      if (op.tags?.includes('experimental') || op.tags?.includes('expermimental')) {
        op.tags = op.tags.filter((t: string) => t !== 'experimental' && t !== 'expermimental')
        op['x-experimental'] = true
      }
    }
  }
  return spec
}

function extractEndpoint(pathObj: any, method: string, apiPath: string, spec: any): Endpoint {
  const op = pathObj[method]

  const params = [...(pathObj.parameters || []), ...(op.parameters || [])]

  const security = op.security ?? spec.security
  const securitySchemes = spec.components?.securitySchemes

  const server = spec.servers?.[0]
  const rawUrl = server?.url as string | undefined
  const rawVars = server?.variables as Record<string, { default?: string; description?: string }> | undefined
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
    parameters: params.length > 0 ? params : undefined,
    requestBody: op.requestBody || undefined,
    responses: op.responses && Object.keys(op.responses).length > 0 ? op.responses : undefined,
    security: security || undefined,
    securitySchemes: securitySchemes || undefined,
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

          const origWrite = process.stdout.write
          process.stdout.write = () => true
          try {
            entry.api.exportOpenapi(exportDir)
          } finally {
            process.stdout.write = origWrite
          }

          const specPath = path.join(exportDir, 'openapi.json')
          const raw = tagFilterSpec(JSON.parse(fs.readFileSync(specPath, 'utf-8')))
          const spec = await SwaggerParser.dereference(raw)
          await processSpec(spec, entry.slug, entry.label, store, parseData)
        }

        for (const entry of staticApis) {
          const specPath = path.join(STATIC_SPECS_DIR, entry.file)
          const raw = JSON.parse(fs.readFileSync(specPath, 'utf-8'))
          const spec = await SwaggerParser.dereference(raw)
          await processSpec(spec, entry.slug, entry.label, store, parseData)
        }
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true })
      }
    },
  }
}

async function processSpec(spec: any, apiSlug: string, apiLabel: string, store: any, parseData: any) {
  let sortOrder = 0

  for (const [apiPath, pathObj] of Object.entries(spec.paths as Record<string, any>)) {
    for (const method of HTTP_METHODS) {
      if (!pathObj[method]) continue
      const op = pathObj[method]
      if (op['x-hidden']) continue

      const endpoint = extractEndpoint(pathObj, method, apiPath, spec)
      const operationId = op.operationId as string | undefined
      const filename = slugify(operationId || `${method}-${apiPath.replace(/\//g, '-')}`)
      const id = `${apiSlug}/endpoints/${filename}`
      const title = operationId || `${method.toUpperCase()} ${apiPath}`
      const description = (op.description?.split('\n')[0]?.slice(0, 200) as string) || ''

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
