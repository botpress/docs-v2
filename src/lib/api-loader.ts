import { runtimeApi, adminApi, tablesApi, filesApi } from '@botpress/api'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import type { Loader } from 'astro/loaders'

const STATIC_SPECS_DIR = path.resolve('./public/api-specs')

const PACKAGE_APIS: { api: { exportOpenapi: (dir: string) => void }; slug: string; label: string; key: string }[] = [
  { api: adminApi, slug: 'admin-api', label: 'Admin API', key: 'admin' },
  { api: filesApi, slug: 'files-api', label: 'Files API', key: 'files' },
  { api: runtimeApi, slug: 'runtime-api', label: 'Runtime API', key: 'runtime' },
  { api: tablesApi, slug: 'tables-api', label: 'Tables API', key: 'tables' },
]

const STATIC_APIS: { file: string; slug: string; label: string }[] = [
  { file: 'chat-openapi.json', slug: 'chat-api', label: 'Chat API' },
]

const API_ORDER = ['admin-api', 'chat-api', 'files-api', 'runtime-api', 'tables-api']

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete'] as const

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function postProcessSpec(spec: any): any {
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

function resolveRef(ref: string, spec: any): any {
  if (!ref.startsWith('#/')) return undefined
  const parts = ref.replace('#/', '').split('/')
  let result = spec
  for (const part of parts) {
    result = result?.[part]
    if (!result) return undefined
  }
  return result
}

function resolveSchema(schema: any, spec: any, depth = 0): any {
  if (!schema || depth > 10) return schema
  if (schema.$ref) {
    const resolved = resolveRef(schema.$ref, spec)
    return resolveSchema(resolved, spec, depth + 1)
  }
  if (schema.allOf) {
    const merged: any = {}
    for (const sub of schema.allOf) {
      const resolved = resolveSchema(sub, spec, depth + 1)
      if (resolved?.properties) {
        merged.properties = { ...merged.properties, ...resolved.properties }
      }
      if (resolved?.required) {
        merged.required = [...(merged.required || []), ...resolved.required]
      }
      if (resolved?.type) merged.type = resolved.type
      if (resolved?.description && !merged.description) merged.description = resolved.description
    }
    return { type: 'object', ...merged }
  }
  if (schema.oneOf) {
    return { ...schema, oneOf: schema.oneOf.map((s: any) => resolveSchema(s, spec, depth + 1)) }
  }
  if (schema.anyOf) {
    return { ...schema, anyOf: schema.anyOf.map((s: any) => resolveSchema(s, spec, depth + 1)) }
  }
  if (schema.properties) {
    const props: Record<string, any> = {}
    for (const [key, val] of Object.entries(schema.properties)) {
      props[key] = resolveSchema(val as any, spec, depth + 1)
    }
    return { ...schema, properties: props }
  }
  if (schema.items) {
    return { ...schema, items: resolveSchema(schema.items, spec, depth + 1) }
  }
  if (schema.additionalProperties && typeof schema.additionalProperties === 'object') {
    return { ...schema, additionalProperties: resolveSchema(schema.additionalProperties, spec, depth + 1) }
  }
  return schema
}

function extractEndpoint(pathObj: any, method: string, apiPath: string, spec: any) {
  const op = pathObj[method]

  const params = [...(pathObj.parameters || []), ...(op.parameters || [])].map((p: any) => {
    if (p.$ref) p = resolveRef(p.$ref, spec) || p
    if (p.schema) p = { ...p, schema: resolveSchema(p.schema, spec) }
    return p
  })

  let requestBody = op.requestBody
  if (requestBody?.$ref) requestBody = resolveRef(requestBody.$ref, spec)
  if (requestBody?.content) {
    const resolved: any = { ...requestBody, content: {} }
    for (const [ct, media] of Object.entries(requestBody.content as Record<string, any>)) {
      resolved.content[ct] = {
        ...media,
        schema: media.schema ? resolveSchema(media.schema, spec) : undefined,
      }
    }
    requestBody = resolved
  }

  const responses: Record<string, any> = {}
  for (const [status, resp] of Object.entries(op.responses || {})) {
    let resolved: any = resp
    if (resolved?.$ref) resolved = resolveRef(resolved.$ref, spec) || resolved
    if (resolved?.content) {
      const resolvedContent: any = {}
      for (const [ct, media] of Object.entries(resolved.content as Record<string, any>)) {
        resolvedContent[ct] = {
          ...media,
          schema: media.schema ? resolveSchema(media.schema, spec) : undefined,
        }
      }
      resolved = { ...resolved, content: resolvedContent }
    }
    responses[status] = resolved
  }

  const security = op.security ?? spec.security
  const securitySchemes = spec.components?.securitySchemes

  return {
    method: method.toUpperCase(),
    path: apiPath,
    operationId: op.operationId,
    summary: op.summary,
    description: op.description,
    parameters: params.length > 0 ? params : undefined,
    requestBody: requestBody || undefined,
    responses: Object.keys(responses).length > 0 ? responses : undefined,
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
  endpoint: any
}

export function apiLoader(): Loader {
  return {
    name: 'api-loader',
    async load({ store, parseData }) {
      store.clear()

      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'api-specs-'))

      try {
        for (const entry of PACKAGE_APIS) {
          const exportDir = path.join(tmpDir, entry.key)
          entry.api.exportOpenapi(exportDir)
          const specPath = path.join(exportDir, 'openapi.json')
          const spec = postProcessSpec(JSON.parse(fs.readFileSync(specPath, 'utf-8')))
          await processSpec(spec, entry.slug, entry.label, store, parseData)
        }

        for (const entry of STATIC_APIS) {
          const specPath = path.join(STATIC_SPECS_DIR, entry.file)
          const spec = JSON.parse(fs.readFileSync(specPath, 'utf-8'))
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

export { API_ORDER }
