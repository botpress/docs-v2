import { useState } from 'react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ChevronRight } from 'lucide-react'
import PropertyRow from './property-row'
import type { Schema } from './types'

interface SchemaExplorerProps {
  schema: Schema
  required?: string[]
  depth?: number
}

const MAX_DEPTH = 6

function SchemaNode({
  name,
  schema,
  isRequired,
  depth,
}: {
  name: string
  schema: Schema
  isRequired: boolean
  depth: number
}) {
  const hasNestedObject = schema.type === 'object' && schema.properties
  const hasArrayObject = schema.type === 'array' && schema.items?.type === 'object' && schema.items?.properties
  const hasAdditionalProps =
    schema.type === 'object' && schema.additionalProperties && typeof schema.additionalProperties === 'object'
  const hasUnion = schema.oneOf || schema.anyOf
  const isExpandable = hasNestedObject || hasArrayObject || hasAdditionalProps || hasUnion

  if (!isExpandable) {
    return <PropertyRow name={name} schema={schema} required={isRequired} />
  }

  return <ExpandableProperty name={name} schema={schema} isRequired={isRequired} depth={depth} />
}

function ExpandableProperty({
  name,
  schema,
  isRequired,
  depth,
}: {
  name: string
  schema: Schema
  isRequired: boolean
  depth: number
}) {
  const [open, setOpen] = useState(depth === 0)

  const hasUnion = schema.oneOf || schema.anyOf
  const hasNestedObject = schema.type === 'object' && schema.properties
  const hasArrayObject = schema.type === 'array' && schema.items?.type === 'object' && schema.items?.properties
  const hasAdditionalProps =
    schema.type === 'object' && schema.additionalProperties && typeof schema.additionalProperties === 'object'

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="border-b border-stone-100 py-3 last:border-b-0 dark:border-stone-800/50">
        <CollapsibleTrigger className="flex w-full cursor-pointer items-start gap-1 text-left">
          <ChevronRight
            className={`mt-0.5 h-4 w-4 shrink-0 text-stone-400 transition-transform duration-150 ${open ? 'rotate-90' : ''}`}
          />
          <div className="min-w-0 flex-1">
            <PropertyRow name={name} schema={schema} required={isRequired} />
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent className="ml-5">
          {hasUnion && <UnionSchema schema={schema} depth={depth} />}
          {hasNestedObject && !hasUnion && (
            <SchemaExplorer schema={schema} required={schema.required} depth={depth + 1} />
          )}
          {hasArrayObject && !hasUnion && (
            <div className="mt-1 border-l-2 border-stone-200 pl-4 dark:border-stone-700">
              <p className="py-2 text-xs font-medium text-stone-500 dark:text-stone-400">Array items:</p>
              <SchemaExplorer schema={schema.items!} required={schema.items!.required} depth={depth + 1} />
            </div>
          )}
          {hasAdditionalProps && !hasUnion && (
            <AdditionalPropertiesSchema schema={schema.additionalProperties as Schema} depth={depth} />
          )}
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}

function UnionSchema({ schema, depth }: { schema: Schema; depth: number }) {
  const variants = schema.oneOf || schema.anyOf || []
  const label = schema.oneOf ? 'oneOf' : 'anyOf'

  if (variants.length === 0) return null

  if (variants.length === 1) {
    const v = variants[0]!
    if (v.properties) {
      return <SchemaExplorer schema={v} required={v.required} depth={depth + 1} />
    }
    return null
  }

  return (
    <div className="mt-2">
      <Tabs defaultValue="0">
        <TabsList variant="line" className="h-7 gap-0">
          {variants.map((v, i) => (
            <TabsTrigger key={i} value={String(i)} className="px-2 text-xs">
              {v.title || `${label}[${i}]`}
            </TabsTrigger>
          ))}
        </TabsList>
        {variants.map((v, i) => (
          <TabsContent key={i} value={String(i)} className="pt-1">
            {v.properties ? (
              <SchemaExplorer schema={v} required={v.required} depth={depth + 1} />
            ) : (
              <PropertyRow name="value" schema={v} />
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

function AdditionalPropertiesSchema({ schema, depth }: { schema: Schema; depth: number }) {
  return (
    <div className="mt-1 border-l-2 border-stone-200 pl-4 dark:border-stone-700">
      <div className="py-2">
        <code className="text-xs text-stone-500 dark:text-stone-400">[key: string]</code>
      </div>
      {schema.properties ? (
        <SchemaExplorer schema={schema} required={schema.required} depth={depth + 1} />
      ) : (
        <PropertyRow name="value" schema={schema} />
      )}
    </div>
  )
}

export default function SchemaExplorer({ schema, required = [], depth = 0 }: SchemaExplorerProps) {
  if (depth > MAX_DEPTH) {
    return <p className="py-2 text-xs italic text-stone-400">Schema too deeply nested to display.</p>
  }

  if (!schema.properties && !schema.additionalProperties && !schema.oneOf && !schema.anyOf) {
    return null
  }

  const entries = schema.properties ? Object.entries(schema.properties) : []
  const hasAdditionalProps = schema.additionalProperties && typeof schema.additionalProperties === 'object'

  if (schema.oneOf || schema.anyOf) {
    return <UnionSchema schema={schema} depth={depth} />
  }

  return (
    <div className={depth > 0 ? 'border-l-2 border-stone-200 pl-4 dark:border-stone-700' : ''}>
      {entries.map(([propName, propSchema]) => (
        <SchemaNode
          key={propName}
          name={propName}
          schema={propSchema}
          isRequired={required.includes(propName)}
          depth={depth}
        />
      ))}
      {hasAdditionalProps && (
        <AdditionalPropertiesSchema schema={schema.additionalProperties as Schema} depth={depth} />
      )}
    </div>
  )
}
