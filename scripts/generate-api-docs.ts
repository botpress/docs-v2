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

interface SlimOperation {
  method: string
  path: string
  operationId?: string
  description?: string
}

function generateMdx(op: SlimOperation, specFile: string): string {
  const title = op.operationId || `${op.method} ${op.path}`
  const desc = op.description?.split('\n')[0]?.slice(0, 200) || ''

  return `---
title: "${title.replace(/"/g, '\\"')}"
${desc ? `description: "${desc.replace(/"/g, '\\"')}"` : ''}
openapi: ${specFile} ${op.method} ${op.path}
---
`
}

function processSpec(spec: any, slug: string, label: string, specFile: string) {
  const apiDir = path.join(OUTPUT_DIR, slug)
  const operations: { op: SlimOperation; filename: string }[] = []

  for (const [apiPath, pathObj] of Object.entries(spec.paths as Record<string, any>)) {
    for (const method of HTTP_METHODS) {
      if (!pathObj[method]) continue
      const op = pathObj[method]
      if (op['x-hidden']) continue
      const slimOp: SlimOperation = {
        method: method.toUpperCase(),
        path: apiPath,
        operationId: op.operationId,
        description: op.description,
      }
      const filename = slugify(slimOp.operationId || `${method}-${apiPath.replace(/\//g, '-')}`)
      operations.push({ op: slimOp, filename })
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
    fs.writeFileSync(mdxPath, generateMdx(entry.op, specFile))
  }

  return operations.length
}

function run() {
  fs.mkdirSync(TEMP_DIR, { recursive: true })
  fs.mkdirSync(STATIC_SPECS_DIR, { recursive: true })

  let totalOps = 0

  for (const entry of PACKAGE_APIS) {
    const spec = exportSpec(entry)
    const specFile = `${entry.key}-openapi.json`
    fs.writeFileSync(path.join(STATIC_SPECS_DIR, specFile), JSON.stringify(spec, null, 2))
    const count = processSpec(spec, entry.slug, entry.label, specFile)
    console.log(`${entry.label}: ${count} endpoints (from @botpress/api)`)
    totalOps += count
  }

  for (const entry of STATIC_APIS) {
    const spec = loadStaticSpec(entry.file)
    const count = processSpec(spec, entry.slug, entry.label, entry.file)
    console.log(`${entry.label}: ${count} endpoints (from static file)`)
    totalOps += count
  }

  fs.rmSync(TEMP_DIR, { recursive: true, force: true })

  console.log(`\nGenerated ${totalOps} endpoint pages total`)
}

run()
