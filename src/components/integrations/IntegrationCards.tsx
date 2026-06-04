import { Field } from '@/components/field'
import { Expandable } from '@/components/Expandable'
import { SchemaFields } from './SchemaFields'
import type { ActionSchema } from '@/bach/schemas/integrations'

function ActionSection({ actionKey, action }: { actionKey: string; action: ActionSchema }) {
  const inputProps = action.input?.schema?.properties
  const outputProps = action.output?.schema?.properties

  return (
    <div>
      <h3>{action.title ?? actionKey}</h3>
      {action.description && <p>{action.description}</p>}

      {inputProps && Object.keys(inputProps).length > 0 && (
        <div>
          <Field name="input" type="object" required={false}>
            <Expandable title="child attributes">
              <SchemaFields properties={inputProps} required={action.input?.schema?.required} />
            </Expandable>
          </Field>
        </div>
      )}

      {outputProps && Object.keys(outputProps).length > 0 && (
        <div>
          <Field name="output" type="object" required={false}>
            <Expandable title="child attributes">
              <SchemaFields properties={outputProps} required={action.output?.schema?.required} />
            </Expandable>
          </Field>
        </div>
      )}
    </div>
  )
}

export function IntegrationCards({ actions }: { actions: Record<string, ActionSchema> }) {
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
