import { runtimeApi, adminApi, tablesApi, filesApi } from '@botpress/api'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const TEMP_DIR = path.resolve(__dirname, '../.tmp-api-specs')
const STATIC_SPECS_DIR = path.resolve(__dirname, '../public/api-specs')
const OUTPUT_DIR = path.resolve(__dirname, '../src/content/docs/api-reference')

const PACKAGE_APIS: { api: { exportOpenapi: (dir: string) => void }; slug: string; label: string; key: string }[] = [
  { api: adminApi, slug: 'admin-api', label: 'Admin API', key: 'admin' },
  { api: filesApi, slug: 'files-api', label: 'Files API', key: 'files' },
  { api: runtimeApi, slug: 'runtime-api', label: 'Runtime API', key: 'runtime' },
  { api: tablesApi, slug: 'tables-api', label: 'Tables API', key: 'tables' },
]

const STATIC_APIS: { file: string; slug: string; label: string }[] = [
  { file: 'chat-openapi.json', slug: 'chat-api', label: 'Chat API' },
]

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete'] as const

interface OperationData {
  method: string
  path: string
  operationId?: string
  summary?: string
  description?: string
  tags?: string[]
  parameters?: any[]
  requestBody?: any
  responses?: Record<string, any>
  security?: any[]
  deprecated?: boolean
  experimental?: boolean
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

function exportSpec(apiEntry: (typeof PACKAGE_APIS)[number]): any {
  const exportDir = path.join(TEMP_DIR, apiEntry.key)
  apiEntry.api.exportOpenapi(exportDir)
  const specPath = path.join(exportDir, 'openapi.json')
  const spec = JSON.parse(fs.readFileSync(specPath, 'utf-8'))
  return postProcessSpec(spec)
}

function loadStaticSpec(file: string): any {
  const specPath = path.join(STATIC_SPECS_DIR, file)
  return JSON.parse(fs.readFileSync(specPath, 'utf-8'))
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
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
  if (!schema || depth > 5) return schema
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
    }
    return { type: 'object', ...merged }
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
  return schema
}

function extractOperation(
  pathObj: any,
  method: string,
  apiPath: string,
  spec: any
): OperationData & { hidden?: boolean } {
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
    if ((resolved as any)?.$ref) resolved = resolveRef((resolved as any).$ref, spec) || resolved
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

  return {
    method: method.toUpperCase(),
    path: apiPath,
    operationId: op.operationId,
    summary: op.summary,
    description: op.description,
    tags: op.tags,
    parameters: params.length > 0 ? params : undefined,
    requestBody: requestBody || undefined,
    responses: Object.keys(responses).length > 0 ? responses : undefined,
    security: op.security,
    deprecated: op.deprecated,
    experimental: op['x-experimental'] || false,
    hidden: op['x-hidden'] || false,
  }
}

function generateMdx(op: OperationData): string {
  const title = op.operationId || `${op.method} ${op.path}`
  const desc = op.description?.split('\n')[0]?.slice(0, 200) || ''
  const dataJson = JSON.stringify(op)

  return `---
title: "${title.replace(/"/g, '\\"')}"
${desc ? `description: "${desc.replace(/"/g, '\\"')}"` : ''}
method: "${op.method}"
prose: false
---

import APIEndpoint from '@/components/api-endpoint'

<APIEndpoint endpoint={${dataJson}} />
`
}

function processSpec(spec: any, slug: string, label: string) {
  const apiDir = path.join(OUTPUT_DIR, slug)
  const operations: { op: OperationData; filename: string }[] = []

  for (const [apiPath, pathObj] of Object.entries(spec.paths as Record<string, any>)) {
    for (const method of HTTP_METHODS) {
      if (!pathObj[method]) continue
      const op = extractOperation(pathObj, method, apiPath, spec)
      if ((op as any).hidden) continue
      delete (op as any).hidden
      const filename = slugify(op.operationId || `${method}-${apiPath.replace(/\//g, '-')}`)
      operations.push({ op, filename })
    }
  }

  const endpointsDir = path.join(apiDir, 'endpoints')
  fs.mkdirSync(endpointsDir, { recursive: true })

  fs.writeFileSync(
    path.join(apiDir, '_category.json'),
    JSON.stringify({ label, sidebarPages: ['endpoints'] }, null, 2) + '\n'
  )

  fs.writeFileSync(
    path.join(endpointsDir, '_category.json'),
    JSON.stringify(
      {
        label: 'Endpoints',
        sidebarPages: operations.map((e) => e.filename),
      },
      null,
      2
    ) + '\n'
  )

  for (const entry of operations) {
    const mdxPath = path.join(endpointsDir, `${entry.filename}.mdx`)
    fs.writeFileSync(mdxPath, generateMdx(entry.op))
  }

  return operations.length
}

function run() {
  fs.mkdirSync(TEMP_DIR, { recursive: true })

  let totalOps = 0

  for (const entry of PACKAGE_APIS) {
    const spec = exportSpec(entry)
    const count = processSpec(spec, entry.slug, entry.label)
    console.log(`${entry.label}: ${count} endpoints (from @botpress/api)`)
    totalOps += count
  }

  for (const entry of STATIC_APIS) {
    const spec = loadStaticSpec(entry.file)
    const count = processSpec(spec, entry.slug, entry.label)
    console.log(`${entry.label}: ${count} endpoints (from static file)`)
    totalOps += count
  }

  fs.rmSync(TEMP_DIR, { recursive: true, force: true })

  console.log(`\nGenerated ${totalOps} endpoint pages total`)
}

run()
