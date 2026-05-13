import { Paperclip } from 'lucide-react'

interface ParsedAttached {
  currentContext?: { title: string; path: string }[]
}

export function AttachedContext({ attached }: { attached: string }) {
  let parsed: ParsedAttached
  try {
    parsed = JSON.parse(attached) as ParsedAttached
  } catch {
    return null
  }

  if (!parsed.currentContext?.length) return null

  return (
    <div className="mt-1 flex flex-col gap-1">
      {parsed.currentContext.map((context) => (
        <div key={context.path} className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Paperclip className="size-3 shrink-0" />
          <a
            href={context.path}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate text-primary underline-offset-2 hover:underline"
          >
            {context.title}
          </a>
        </div>
      ))}
    </div>
  )
}
