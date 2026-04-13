import fs from 'node:fs'
import path from 'node:path'
import type { Endpoint } from '@/components/api/types'

const specsDir = path.resolve('./public/api-specs')

const specCache = new Map<string, any>()

function loadSpec(specFile: string): any {
  if (specCache.has(specFile)) return specCache.get(specFile)
  const filePath = path.join(specsDir, specFile)
  const spec = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  specCache.set(specFile, spec)
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

export function parseOpenApiField(value: string): { specFile: string; method: string; route: string } {
  const parts = value.trim().split(/\s+/)
  if (parts.length < 3) {
    throw new Error(`Invalid openapi field: "${value}". Expected format: "<specFile> <METHOD> <route>"`)
  }
  return {
    specFile: parts[0]!,
    method: parts[1]!.toUpperCase(),
    route: parts.slice(2).join(' '),
  }
}

export function resolveOpenApi(openapiField: string): Endpoint {
  const { specFile, method, route } = parseOpenApiField(openapiField)
  const spec = loadSpec(specFile)

  const pathObj = spec.paths?.[route]
  if (!pathObj) {
    throw new Error(`Path "${route}" not found in spec "${specFile}"`)
  }

  const methodLower = method.toLowerCase()
  const op = pathObj[methodLower]
  if (!op) {
    throw new Error(`Method "${method}" not found for path "${route}" in spec "${specFile}"`)
  }

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
    method,
    path: route,
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
