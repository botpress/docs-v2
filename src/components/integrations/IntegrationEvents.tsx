import { Field } from '@/components/field'
import { Expandable } from '@/components/Expandable'
import { SchemaFields } from './SchemaFields'
import type { EventSchema } from '@/bach/schemas/integrations'

function EventSection({ eventKey, event }: { eventKey: string; event: EventSchema }) {
  const payloadProps = event.schema?.properties

  return (
    <div>
      <h3>{event.title ?? eventKey}</h3>
      {event.description && <p>{event.description}</p>}

      {payloadProps && Object.keys(payloadProps).length > 0 && (
        <div>
          <Field name="payload" type="object" required={false}>
            <Expandable title="child attributes">
              <SchemaFields properties={payloadProps} required={event.schema?.required} />
            </Expandable>
          </Field>
        </div>
      )}
    </div>
  )
}

export function IntegrationEvents({ events }: { events: Record<string, EventSchema> }) {
  const entries = Object.entries(events)
  if (entries.length === 0) return null

  return (
    <div>
      {entries.map(([key, event]) => (
        <EventSection key={key} eventKey={key} event={event} />
      ))}
    </div>
  )
}
