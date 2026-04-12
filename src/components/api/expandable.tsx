import { useState, useId, type ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'

interface ExpandableProps {
  title?: string
  defaultOpen?: boolean
  onChange?: (open: boolean) => void
  children?: ReactNode
  className?: string
}

function Expandable({
  title = 'child attributes',
  defaultOpen = false,
  onChange,
  children,
  className,
}: ExpandableProps) {
  const [open, setOpen] = useState(defaultOpen)
  const contentId = `expandable-${useId()}`

  const toggle = () => {
    const next = !open
    setOpen(next)
    onChange?.(next)
  }

  return (
    <div className={`mt-3 rounded-lg border border-stone-200 dark:border-stone-700 ${className ?? ''}`}>
      <button
        type="button"
        className="flex w-full items-center gap-2 px-3.5 py-2.5 text-sm text-stone-600 hover:bg-stone-50/50 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-white/5 dark:hover:text-stone-200"
        onClick={toggle}
        aria-expanded={open}
        aria-controls={contentId}
      >
        <ChevronRight className={`h-3 w-3 shrink-0 transition-transform ${open ? 'rotate-90' : ''}`} />
        <span>
          {open ? 'Hide' : 'Show'} {title}
        </span>
      </button>
      {open && (
        <div id={contentId} className="border-t border-stone-100 px-4 dark:border-stone-800/50">
          {children}
        </div>
      )}
    </div>
  )
}

export { Expandable }
export type { ExpandableProps }
