import { useState, type ReactNode } from 'react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
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

  return (
    <Collapsible
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        onChange?.(next)
      }}
      className={`not-prose mt-3 rounded-lg border border-stone-200 dark:border-stone-700 ${className ?? ''}`}
    >
      <CollapsibleTrigger className="flex w-full cursor-pointer items-center gap-2 px-3.5 py-2.5 text-sm text-stone-600 hover:bg-stone-50/50 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-white/5 dark:hover:text-stone-200">
        <ChevronRight className={`size-3 shrink-0 transition-transform ${open ? 'rotate-90' : ''}`} />
        <span>
          {open ? 'Hide' : 'Show'} {title}
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="border-t border-stone-100 px-4 dark:border-stone-800/50">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  )
}

export { Expandable }
export type { ExpandableProps }
