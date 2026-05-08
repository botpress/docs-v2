import { Plus, X } from 'lucide-react'
import type { ContextItem } from './store'

interface ContextProps {
  currentContext: ContextItem[]
  setCurrentContext: (value: ContextItem[]) => void
  suggestedContext?: ContextItem | null
  addSuggestedContext?: () => void
}

export function Context({ currentContext, setCurrentContext, suggestedContext, addSuggestedContext }: ContextProps) {
  if (currentContext.length === 0 && !suggestedContext) return null

  const removeContext = (indexToRemove: number) => {
    setCurrentContext(currentContext.filter((_, i) => i !== indexToRemove))
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {suggestedContext && currentContext.length === 0 && (
        <button
          type="button"
          onClick={addSuggestedContext}
          aria-label="Add suggested context"
          className="group flex items-center gap-1.5 rounded-md border border-dashed border-border bg-background px-2 py-1 text-xs text-muted-foreground transition-colors hover:border-border hover:bg-muted hover:text-foreground"
        >
          <span className="flex flex-col items-start leading-tight">
            <span className="font-medium text-foreground">{suggestedContext.title}</span>
            <span className="text-[10px] text-muted-foreground">{suggestedContext.path}</span>
          </span>
          <Plus className="size-3" />
        </button>
      )}

      {currentContext.map((context, index) => (
        <div
          key={context.path}
          className="flex items-center gap-1.5 rounded-md border border-border bg-muted px-2 py-1 text-xs text-foreground"
        >
          <span className="flex flex-col items-start leading-tight">
            <span className="font-medium">{context.title}</span>
            <span className="text-[10px] text-muted-foreground">{context.path}</span>
          </span>
          <button
            type="button"
            onClick={() => removeContext(index)}
            aria-label="Remove context"
            className="rounded text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-3" />
          </button>
        </div>
      ))}
    </div>
  )
}
