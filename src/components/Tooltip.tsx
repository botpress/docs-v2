import type { ReactNode } from 'react'

interface TooltipProps {
  tip?: string
  description?: string
  title?: string
  children?: ReactNode
  className?: string
}

export function Tooltip({ tip, description, title, children, className }: TooltipProps) {
  const text = tip || description || title

  if (!text) return <>{children}</>

  return (
    <span className={['group/tooltip relative inline-block', className].filter(Boolean).join(' ')}>
      <span className="cursor-help underline decoration-stone-400 decoration-dotted decoration-2 underline-offset-4 dark:decoration-stone-500">
        {children}
      </span>
      <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded-xl border border-stone-200 bg-white px-4 py-3 text-xs font-medium text-stone-900 opacity-0 shadow-sm transition-opacity group-hover/tooltip:pointer-events-auto group-hover/tooltip:opacity-100 dark:border-stone-800 dark:bg-stone-950 dark:text-stone-200">
        {text}
      </span>
    </span>
  )
}
