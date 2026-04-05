import type { ReactNode } from 'react'
import { Info as InfoIcon, Lightbulb, TriangleAlert, OctagonAlert, CircleCheck, NotebookPen } from 'lucide-react'

type CalloutVariant = 'note' | 'info' | 'tip' | 'check' | 'warning' | 'danger' | 'goodtoknow'

const config: Record<
  CalloutVariant,
  {
    icon: React.ElementType
    border: string
    bg: string
    text: string
  }
> = {
  note: {
    icon: InfoIcon,
    border: 'border-blue-200 dark:border-blue-900',
    bg: 'bg-blue-50 dark:bg-blue-600/20',
    text: 'text-blue-800 dark:text-blue-300',
  },
  info: {
    icon: InfoIcon,
    border: 'border-fuchsia-200/50 dark:border-purple-500/30',
    bg: 'bg-fuchsia-50/50 dark:bg-fuchsia-500/10',
    text: 'text-fuchsia-900 dark:text-fuchsia-200',
  },
  tip: {
    icon: Lightbulb,
    border: 'border-green-200 dark:border-green-900',
    bg: 'bg-green-50 dark:bg-green-600/20',
    text: 'text-green-800 dark:text-green-300',
  },
  check: {
    icon: CircleCheck,
    border: 'border-green-200 dark:border-green-900',
    bg: 'bg-green-50 dark:bg-green-600/20',
    text: 'text-green-800 dark:text-green-300',
  },
  warning: {
    icon: TriangleAlert,
    border: 'border-yellow-200 dark:border-yellow-900',
    bg: 'bg-yellow-50 dark:bg-yellow-600/20',
    text: 'text-yellow-800 dark:text-yellow-300',
  },
  danger: {
    icon: OctagonAlert,
    border: 'border-red-200 dark:border-red-900',
    bg: 'bg-red-50 dark:bg-red-600/20',
    text: 'text-red-800 dark:text-red-300',
  },
  goodtoknow: {
    icon: NotebookPen,
    border: 'border-green-200 dark:border-green-900',
    bg: 'bg-green-50 dark:bg-green-600/20',
    text: 'text-green-800 dark:text-green-300',
  },
}

interface CalloutProps {
  variant?: CalloutVariant
  title?: string
  children: ReactNode
}

function Callout({ variant = 'note', title, children }: CalloutProps) {
  const c = config[variant]
  const Icon = c.icon

  return (
    <div
      role="alert"
      className={`my-4 flex gap-3 overflow-hidden rounded-xl border px-5 py-4 text-sm ${c.border} ${c.bg}`}
    >
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${c.text}`} />
      <div
        className={`min-w-0 ${c.text} [&_a]:border-current [&_a]:text-current [&_code]:text-current [&_p]:leading-relaxed`}
      >
        {title && <p className="mb-1 font-semibold leading-none tracking-tight">{title}</p>}
        <div className="[&_p]:m-0">{children}</div>
      </div>
    </div>
  )
}

export function Note({ title, children }: Omit<CalloutProps, 'variant'>) {
  return (
    <Callout variant="note" title={title}>
      {children}
    </Callout>
  )
}

export function InfoCallout({ title, children }: Omit<CalloutProps, 'variant'>) {
  return (
    <Callout variant="info" title={title}>
      {children}
    </Callout>
  )
}

export function Tip({ title, children }: Omit<CalloutProps, 'variant'>) {
  return (
    <Callout variant="tip" title={title}>
      {children}
    </Callout>
  )
}

export function Check({ title, children }: Omit<CalloutProps, 'variant'>) {
  return (
    <Callout variant="check" title={title}>
      {children}
    </Callout>
  )
}

export function Warning({ title, children }: Omit<CalloutProps, 'variant'>) {
  return (
    <Callout variant="warning" title={title}>
      {children}
    </Callout>
  )
}

export function Danger({ title, children }: Omit<CalloutProps, 'variant'>) {
  return (
    <Callout variant="danger" title={title}>
      {children}
    </Callout>
  )
}

export function GoodToKnow({ title, children }: Omit<CalloutProps, 'variant'>) {
  return (
    <Callout variant="goodtoknow" title={title}>
      {children}
    </Callout>
  )
}

export function Info({ title, children }: Omit<CalloutProps, 'variant'>) {
  return (
    <Callout variant="info" title={title}>
      {children}
    </Callout>
  )
}

export default Callout
