import type { ReactNode } from 'react'

interface StepProps {
  title?: string
  children?: ReactNode
  className?: string
}

export function Step({ title, children, className }: StepProps) {
  return (
    <div
      className={['group/step relative flex items-start pb-5', '[counter-increment:step]', className]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="absolute top-11 h-[calc(100%-2.75rem)] w-px bg-stone-200/70 last:bg-gradient-to-b last:from-stone-200 last:via-stone-200 last:via-80% last:to-transparent dark:bg-white/10 dark:last:from-white/10 dark:last:via-white/10" />
      <div className="absolute ml-[-13px] py-2">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-stone-50 font-semibold text-stone-900 text-xs before:content-[counter(step)] dark:bg-white/10 dark:text-stone-50" />
      </div>
      <div className="w-full overflow-hidden pr-px pl-8">
        {title && <p className="mt-2 font-semibold text-stone-900 dark:text-stone-200">{title}</p>}
        <div className={['prose dark:prose-invert', !title && 'mt-2'].filter(Boolean).join(' ')}>{children}</div>
      </div>
    </div>
  )
}

interface StepsProps {
  children?: ReactNode
  className?: string
}

export function Steps({ children, className }: StepsProps) {
  return (
    <div className={['mt-10 mb-6 ml-3.5 [counter-reset:step]', className].filter(Boolean).join(' ')} role="list">
      {children}
    </div>
  )
}
