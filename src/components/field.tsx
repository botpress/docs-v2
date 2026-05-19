import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'

interface FieldProps {
  name: string
  type: string
  required?: boolean
  default?: unknown
  deprecated?: boolean
  hidden?: boolean
  parentPath?: string
  children?: ReactNode
}

function Field({ name, type, required, default: defaultValue, deprecated, hidden, parentPath, children }: FieldProps) {
  let stringifiedDefault: string | null = null
  if (defaultValue !== undefined && defaultValue !== null) {
    if (typeof defaultValue === 'object') {
      const nested = Object.values(defaultValue as Record<string, unknown>).some(
        (v) => v !== null && typeof v === 'object'
      )
      if (!nested) {
        try {
          const s = JSON.stringify(defaultValue)
          if (s && s.length > 0 && s.length < 60) stringifiedDefault = s
        } catch {}
      }
    } else {
      try {
        const s = JSON.stringify(defaultValue)
        if (s && s.length > 0 && s.length < 60) stringifiedDefault = s
      } catch {}
    }
  }

  if (hidden) return null

  return (
    <div className="not-prose border-b border-stone-100 py-6 last:border-b-0 dark:border-stone-800/50">
      <div className="flex flex-wrap items-center gap-2">
        <code className="text-sm font-semibold">
          {parentPath && <span className="text-stone-500 dark:text-stone-400">{parentPath}.</span>}
          <span className="text-primary">{name}</span>
          {!required && <span className="text-stone-600 dark:text-stone-400">?</span>}
        </code>
        {type && (
          <Badge variant="info">
            <code className="font-semibold">{type}</code>
          </Badge>
        )}
        {deprecated && <Badge variant="deprecated">deprecated</Badge>}
        {stringifiedDefault !== null && <Badge variant="info">default: {stringifiedDefault}</Badge>}
      </div>
      {children && (
        <div className="mt-4 text-sm text-stone-600 dark:text-stone-400 [&>p:first-child]:mt-0 [&>p:last-child]:mb-0">
          {children}
        </div>
      )}
    </div>
  )
}

// temporary aliases for backwards compatibility when i bring over the existing docs
const ResponseField = Field
const ParamField = Field

export { Field, ResponseField, ParamField }
export type { FieldProps }
