import { useMemo } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import HighlightedCode from './highlighted-code'
import type { Schema, Endpoint } from './types'

function generateSampleValue(schema: Schema | undefined, depth = 0): any {
  if (!schema || depth > 5) return null

  if (schema.example !== undefined) return schema.example
  if (schema.default !== undefined) return schema.default

  if (schema.oneOf?.[0]) return generateSampleValue(schema.oneOf[0], depth + 1)
  if (schema.anyOf?.[0]) return generateSampleValue(schema.anyOf[0], depth + 1)

  if (schema.enum?.[0]) return schema.enum[0]

  switch (schema.type) {
    case 'string':
      if (schema.format === 'date-time') return '2025-01-15T12:00:00Z'
      if (schema.format === 'date') return '2025-01-15'
      if (schema.format === 'email') return 'user@example.com'
      if (schema.format === 'uri') return 'https://example.com'
      return 'string'
    case 'number':
    case 'integer':
      return schema.minimum ?? 0
    case 'boolean':
      return true
    case 'array':
      if (schema.items) {
        const item = generateSampleValue(schema.items, depth + 1)
        return item !== null ? [item] : []
      }
      return []
    case 'object': {
      if (schema.properties) {
        const obj: Record<string, any> = {}
        for (const [key, propSchema] of Object.entries(schema.properties)) {
          const val = generateSampleValue(propSchema, depth + 1)
          if (val !== null) obj[key] = val
        }
        return obj
      }
      if (schema.additionalProperties && typeof schema.additionalProperties === 'object') {
        const val = generateSampleValue(schema.additionalProperties, depth + 1)
        return { key: val }
      }
      return {}
    }
    default:
      return null
  }
}

interface ResponseExamplesProps {
  responses: NonNullable<Endpoint['responses']>
}

export default function ResponseExamples({ responses }: ResponseExamplesProps) {
  const examples = useMemo(() => {
    const result: { status: string; json: string }[] = []

    for (const [status, resp] of Object.entries(responses)) {
      const contentType = Object.keys(resp.content || {})[0]
      const schema = resp.content?.[contentType!]?.schema
      if (!schema) continue

      const sample = generateSampleValue(schema)
      if (sample === null) continue

      result.push({ status, json: JSON.stringify(sample, null, 2) })
    }

    return result
  }, [responses])

  if (examples.length === 0) return null

  const defaultTab = examples.find((e) => e.status.startsWith('2'))?.status || examples[0]!.status

  return (
    <div className="rounded-lg border border-stone-200 bg-stone-50 dark:border-stone-700 dark:bg-stone-800/50">
      <Tabs defaultValue={defaultTab}>
        <div className="flex items-center justify-between border-b border-stone-200 px-3 pt-2 dark:border-stone-700">
          <span className="text-xs font-medium text-stone-500 dark:text-stone-400">Response</span>
          {examples.length > 1 && (
            <TabsList variant="line" className="h-7 gap-0">
              {examples.map((ex) => (
                <TabsTrigger key={ex.status} value={ex.status} className="px-2 text-xs">
                  <span
                    className={
                      ex.status.startsWith('2')
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : ex.status.startsWith('4') || ex.status.startsWith('5')
                          ? 'text-red-600 dark:text-red-400'
                          : ''
                    }
                  >
                    {ex.status}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
          )}
        </div>

        {examples.map((ex) => (
          <TabsContent key={ex.status} value={ex.status} className="p-0">
            <div className="p-4">
              <HighlightedCode code={ex.json} language="json" />
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

export { generateSampleValue }
