import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Field } from '@/components/field'
import { Expandable } from '@/components/Expandable'
import type { Schema } from '@/bach/schemas'

interface SchemaExplorerProps {
  schema: Schema
  required?: string[]
  depth?: number
  parentPath?: string
}

const MAX_DEPTH = 6

function schemaTypeLabel(schema: Schema): string {
  if (schema.enum) return `enum<${schema.type || 'string'}>`
  if (schema.oneOf || schema.anyOf) {
    const variants = schema.oneOf || schema.anyOf || []
    const labels = variants.map(schemaTypeLabel)
    const unique = [...new Set(labels)]
    return unique.join(' | ')
  }
  if (schema.type === 'array' && schema.items) return `${schemaTypeLabel(schema.items)}[]`
  if (schema.nullable && schema.type) return `${schema.type} | null`
  return schema.format || schema.type || 'any'
}

function constraintSuffix(schema: Schema): string[] {
  const tags: string[] = []
  if (schema.format) tags.push(schema.format)
  if (schema.pattern) tags.push(`pattern: ${schema.pattern}`)
  if (schema.minLength !== undefined) tags.push(`min length: ${schema.minLength}`)
  if (schema.maxLength !== undefined) tags.push(`max length: ${schema.maxLength}`)
  if (schema.minimum !== undefined) tags.push(`>= ${schema.minimum}`)
  if (schema.maximum !== undefined) tags.push(`<= ${schema.maximum}`)
  return tags
}

function SchemaNode({
  name,
  schema,
  isRequired,
  depth,
  parentPath,
}: {
  name: string
  schema: Schema
  isRequired: boolean
  depth: number
  parentPath?: string
}) {
  const hasNestedObject = schema.type === 'object' && schema.properties
  const hasArrayObject = schema.type === 'array' && schema.items?.type === 'object' && schema.items?.properties
  const hasAdditionalProps =
    schema.type === 'object' && schema.additionalProperties && typeof schema.additionalProperties === 'object'
  const hasUnion = schema.oneOf || schema.anyOf
  const isExpandable = hasNestedObject || hasArrayObject || hasAdditionalProps || hasUnion

  const typeLabel = schemaTypeLabel(schema)
  const constraints = constraintSuffix(schema)

  const description = (
    <>
      {schema.description}
      {constraints.length > 0 && <span className="ml-1 text-xs text-stone-400">({constraints.join(', ')})</span>}
      {schema.enum && (
        <div className="mt-2 flex flex-wrap items-center gap-1">
          Available options:
          {schema.enum.map((v, i) => (
            <span key={v}>
              <Badge variant="info">
                <code>"{v}"</code>
              </Badge>
              {i < schema.enum!.length - 1 && ','}
            </span>
          ))}
        </div>
      )}
    </>
  )

  const hasDescription = schema.description || constraints.length > 0 || schema.enum

  const fullPath = parentPath ? `${parentPath}.${name}` : name

  if (!isExpandable) {
    return (
      <Field
        name={name}
        type={typeLabel}
        required={isRequired}
        deprecated={schema.deprecated}
        default={schema.default}
        parentPath={parentPath}
      >
        {hasDescription ? description : undefined}
      </Field>
    )
  }

  return (
    <Field
      name={name}
      type={typeLabel}
      required={isRequired}
      deprecated={schema.deprecated}
      default={schema.default}
      parentPath={parentPath}
    >
      {hasDescription ? description : undefined}
      {hasUnion && <UnionSchema schema={schema} depth={depth} parentPath={fullPath} />}
      {hasNestedObject && !hasUnion && (
        <Expandable title={`${name} properties`}>
          <SchemaExplorer schema={schema} required={schema.required} depth={depth + 1} parentPath={fullPath} />
        </Expandable>
      )}
      {hasArrayObject && !hasUnion && (
        <Expandable title={`${name} item properties`}>
          <SchemaExplorer
            schema={schema.items!}
            required={schema.items!.required}
            depth={depth + 1}
            parentPath={fullPath}
          />
        </Expandable>
      )}
      {hasAdditionalProps && !hasUnion && (
        <Expandable title={`${name} values`}>
          <AdditionalPropertiesSchema
            schema={schema.additionalProperties as Schema}
            depth={depth}
            parentPath={fullPath}
          />
        </Expandable>
      )}
    </Field>
  )
}

function UnionSchema({ schema, depth, parentPath }: { schema: Schema; depth: number; parentPath?: string }) {
  const variants = schema.oneOf || schema.anyOf || []

  if (variants.length === 0) return null

  if (variants.length === 1) {
    const v = variants[0]!
    if (v.properties) {
      return (
        <Expandable title="properties">
          <SchemaExplorer schema={v} required={v.required} depth={depth + 1} parentPath={parentPath} />
        </Expandable>
      )
    }
    return null
  }

  return (
    <div className="mt-2 min-w-0">
      <Tabs defaultValue="0">
        <div className="overflow-x-auto overflow-y-hidden">
          <TabsList variant="line" className="h-7 gap-0 [&>*]:flex-none">
            {variants.map((v, i) => (
              <TabsTrigger key={i} value={String(i)} className="px-2 text-xs">
                {v.title || `Option ${i + 1}`}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        {variants.map((v, i) => (
          <TabsContent key={i} value={String(i)} className="pt-1">
            {v.properties ? (
              <Expandable title={v.title || `Option ${i + 1} properties`}>
                <SchemaExplorer schema={v} required={v.required} depth={depth + 1} parentPath={parentPath} />
              </Expandable>
            ) : (
              <Field name="value" type={schemaTypeLabel(v)} parentPath={parentPath}>
                {v.description}
              </Field>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

function AdditionalPropertiesSchema({
  schema,
  depth,
  parentPath,
}: {
  schema: Schema
  depth: number
  parentPath?: string
}) {
  if (schema.properties) {
    return <SchemaExplorer schema={schema} required={schema.required} depth={depth + 1} parentPath={parentPath} />
  }
  return (
    <Field name="[key: string]" type={schemaTypeLabel(schema)} parentPath={parentPath}>
      {schema.description}
    </Field>
  )
}

export default function SchemaExplorer({ schema, required, depth = 0, parentPath }: SchemaExplorerProps) {
  const requiredFields = required ?? schema.required ?? []
  if (depth > MAX_DEPTH) {
    return <p className="py-2 text-xs italic text-stone-400">Schema too deeply nested to display.</p>
  }

  if (!schema.properties && !schema.additionalProperties && !schema.oneOf && !schema.anyOf) {
    return null
  }

  const entries = schema.properties ? Object.entries(schema.properties) : []
  const hasAdditionalProps = schema.additionalProperties && typeof schema.additionalProperties === 'object'

  if (schema.oneOf || schema.anyOf) {
    return <UnionSchema schema={schema} depth={depth} parentPath={parentPath} />
  }

  return (
    <div>
      {entries.map(([propName, propSchema]) => (
        <SchemaNode
          key={propName}
          name={propName}
          schema={propSchema}
          isRequired={requiredFields.includes(propName)}
          depth={depth}
          parentPath={parentPath}
        />
      ))}
      {hasAdditionalProps && (
        <AdditionalPropertiesSchema
          schema={schema.additionalProperties as Schema}
          depth={depth}
          parentPath={parentPath}
        />
      )}
    </div>
  )
}

export { schemaTypeLabel }
