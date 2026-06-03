import { Field } from '@/components/field'
import { Expandable } from '@/components/Expandable'

type JsonSchemaProp = Record<string, unknown>

type Action = {
  title?: string
  description?: string
  input?: {
    schema: {
      properties?: Record<string, JsonSchemaProp>
      required?: string[]
    }
  }
  output?: {
    schema: {
      properties?: Record<string, JsonSchemaProp>
      required?: string[]
    }
  }
}

function resolveType(prop: JsonSchemaProp): string {
  const t = prop.type
  if (Array.isArray(t)) return t.find((x) => x !== 'null') ?? 'unknown'
  return (t as string) ?? 'object'
}

function resolveProperty(prop: JsonSchemaProp) {
  if (Array.isArray(prop.anyOf)) {
    const nonNull = (prop.anyOf as JsonSchemaProp[]).find((p) => p.type !== 'null')
    if (nonNull) {
      const xzui = nonNull['x-zui'] as Record<string, unknown> | undefined
      const parentXzui = prop['x-zui'] as Record<string, unknown> | undefined
      return {
        type: resolveType(nonNull),
        description: (nonNull.description ?? prop.description) as string | undefined,
        title: (xzui?.title ?? parentXzui?.title) as string | undefined,
        default: nonNull.default ?? prop.default,
        enum: nonNull.enum as string[] | undefined,
        properties: nonNull.properties as Record<string, JsonSchemaProp> | undefined,
        required: nonNull.required as string[] | undefined,
        items: nonNull.items as JsonSchemaProp | undefined,
      }
    }
  }

  const xzui = prop['x-zui'] as Record<string, unknown> | undefined
  return {
    type: resolveType(prop),
    description: prop.description as string | undefined,
    title: xzui?.title as string | undefined,
    default: prop.default,
    enum: prop.enum as string[] | undefined,
    properties: prop.properties as Record<string, JsonSchemaProp> | undefined,
    required: prop.required as string[] | undefined,
    items: prop.items as JsonSchemaProp | undefined,
  }
}

function SchemaFields({
  properties,
  required = [],
}: {
  properties: Record<string, JsonSchemaProp>
  required?: string[]
}) {
  return (
    <>
      {Object.entries(properties).map(([key, rawProp]) => {
        const prop = resolveProperty(rawProp)
        const isRequired = required.includes(key)

        return (
          <Field key={key} name={prop.title ?? key} type={prop.type} required={isRequired} default={prop.default}>
            {prop.description && <p>{prop.description}</p>}
            {prop.enum && (
              <p>
                {'Options: '}
                {prop.enum.map((v, i) => (
                  <span key={v}>
                    <code>{v}</code>
                    {i < prop.enum!.length - 1 ? ', ' : ''}
                  </span>
                ))}
              </p>
            )}
            {prop.type === 'object' && prop.properties && (
              <Expandable title="properties">
                <SchemaFields properties={prop.properties} required={prop.required} />
              </Expandable>
            )}
            {prop.type === 'array' && prop.items && (prop.items.properties as Record<string, JsonSchemaProp>) && (
              <Expandable title="item properties">
                <SchemaFields
                  properties={prop.items.properties as Record<string, JsonSchemaProp>}
                  required={(prop.items.required as string[]) ?? []}
                />
              </Expandable>
            )}
          </Field>
        )
      })}
    </>
  )
}

function ActionSection({ actionKey, action }: { actionKey: string; action: Action }) {
  const inputProps = action.input?.schema?.properties
  const outputProps = action.output?.schema?.properties

  return (
    <div>
      <h3>{action.title ?? actionKey}</h3>
      {action.description && <p>{action.description}</p>}

      {inputProps && Object.keys(inputProps).length > 0 && (
        <div>
          <h4>Input</h4>
          <SchemaFields properties={inputProps} required={action.input?.schema?.required} />
        </div>
      )}

      {outputProps && Object.keys(outputProps).length > 0 && (
        <div>
          <h4>Output</h4>
          <SchemaFields properties={outputProps} required={action.output?.schema?.required} />
        </div>
      )}
    </div>
  )
}

export function IntegrationCards({ actions }: { actions: Record<string, Action> }) {
  const entries = Object.entries(actions)
  if (entries.length === 0) return null

  return (
    <div>
      {entries.map(([key, action]) => (
        <ActionSection key={key} actionKey={key} action={action} />
      ))}
    </div>
  )
}
