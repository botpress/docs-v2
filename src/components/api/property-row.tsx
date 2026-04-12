import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import type { Schema } from './types'

interface PropertyRowProps {
  name: string
  schema: Schema
  required?: boolean
  location?: string
  children?: ReactNode
}

function schemaTypeLabel(schema: Schema): string {
  if (schema.enum) return 'enum'
  if (schema.oneOf) return schema.oneOf.map(schemaTypeLabel).join(' | ')
  if (schema.anyOf) return schema.anyOf.map(schemaTypeLabel).join(' | ')
  if (schema.type === 'array' && schema.items) return `${schemaTypeLabel(schema.items)}[]`
  if (schema.nullable && schema.type) return `${schema.type} | null`
  return schema.format || schema.type || 'any'
}

function ConstraintBadges({ schema }: { schema: Schema }) {
  const tags: string[] = []

  if (schema.format) tags.push(schema.format)
  if (schema.pattern) tags.push(`pattern: ${schema.pattern}`)
  if (schema.minLength !== undefined) tags.push(`min length: ${schema.minLength}`)
  if (schema.maxLength !== undefined) tags.push(`max length: ${schema.maxLength}`)
  if (schema.minimum !== undefined) tags.push(`>= ${schema.minimum}`)
  if (schema.maximum !== undefined) tags.push(`<= ${schema.maximum}`)

  if (tags.length === 0) return null

  return (
    <>
      {tags.map((tag) => (
        <Badge key={tag} variant="info">
          {tag}
        </Badge>
      ))}
    </>
  )
}

export default function PropertyRow({ name, schema, required, location, children }: PropertyRowProps) {
  return (
    <div className="border-b border-stone-100 py-3 last:border-b-0 dark:border-stone-800/50">
      <div className="flex flex-wrap items-center gap-2">
        <code className="text-sm font-semibold text-stone-900 dark:text-stone-100">{name}</code>
        <Badge variant="info">{schemaTypeLabel(schema)}</Badge>
        {location && <Badge variant="info">{location}</Badge>}
        {required && <Badge variant="required">required</Badge>}
        {schema.deprecated && <Badge variant="deprecated">deprecated</Badge>}
        {schema.default !== undefined && <Badge variant="info">default: {JSON.stringify(schema.default)}</Badge>}
        <ConstraintBadges schema={schema} />
      </div>

      {schema.description && <p className="mt-1.5 text-sm text-stone-600 dark:text-stone-400">{schema.description}</p>}

      {schema.enum && (
        <div className="mt-2 flex flex-wrap gap-1">
          {schema.enum.map((v) => (
            <code
              key={v}
              className="rounded bg-stone-100 px-1.5 py-0.5 text-xs text-stone-600 dark:bg-stone-800 dark:text-stone-400"
            >
              {v}
            </code>
          ))}
        </div>
      )}

      {children}
    </div>
  )
}

export { schemaTypeLabel }
