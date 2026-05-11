import { useState } from 'react'
import { ChevronDown, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Source {
  title: string
  url: string
}

export function Sources({ sources }: { sources: Source[] }) {
  const [open, setOpen] = useState(false)

  if (sources.length === 0) return null

  return (
    <div className="flex flex-col gap-1 mb-2">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center gap-2.5 px-1 py-2 text-[13px] font-medium text-muted-foreground hover:text-muted-foreground transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/10 rounded-sm'
        )}
      >
        <FileText className="size-3.5 shrink-0" />
        <span>
          Consulted {sources.length} {sources.length === 1 ? 'page' : 'pages'}
        </span>
        <ChevronDown className={cn('size-3 transition-transform duration-150', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="flex flex-col gap-0.5 pl-6">
          {sources.map((s) => (
            <a
              key={s.url}
              href={s.url}
              target="_blank"
              rel="noreferrer noopener"
              className="text-[13px] text-muted-foreground/80 hover:text-foreground underline-offset-2 hover:underline truncate px-1 py-0.5 rounded-sm transition-colors"
            >
              {s.title}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
