import { useRef, useEffect, useCallback, useState } from 'react'
import type React from 'react'
import { ArrowUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Context } from './context'
import { ModelSelector } from './model-selector'
import type { ContextItem } from './store'

interface ComposerProps {
  onSend: (message: string) => void
  inputRef?: React.RefObject<HTMLTextAreaElement | null>
  currentContext: ContextItem[]
  setCurrentContext: (value: ContextItem[]) => void
  suggestedContext?: ContextItem | null
  addSuggestedContext?: () => void
  selectedModel: string
  onModelChange: (model: string) => void
}

/**
 * Auto-growing textarea composer at the bottom — styled to match the main
 * content area with the send button horizontally aligned to the input.
 */
export function Composer({
  onSend,
  inputRef: externalRef,
  currentContext,
  setCurrentContext,
  suggestedContext,
  addSuggestedContext,
  selectedModel,
  onModelChange,
}: ComposerProps) {
  const [value, setValue] = useState('')
  const internalRef = useRef<HTMLTextAreaElement>(null)
  const textareaRef = externalRef ?? internalRef

  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 160) + 'px'
  }, [value, textareaRef])

  const submit = useCallback(() => {
    const trimmed = value.trim()
    if (!trimmed) return
    onSend(trimmed)
    setValue('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [value, onSend, textareaRef])

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    submit()
  }

  const canSend = value.trim().length > 0

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full">
      <div
        className={cn(
          'rounded-xl border border-stone-200 bg-white',
          'dark:border-stone-800 dark:bg-stone-900',
          'focus-within:border-primary dark:focus-within:border-primary',
          'transition-colors'
        )}
      >
        {/* Context + model floating inside the composer */}
        <div className="flex items-start gap-2 flex-wrap px-3 pt-2">
          <Context
            currentContext={currentContext}
            setCurrentContext={setCurrentContext}
            suggestedContext={suggestedContext}
            addSuggestedContext={addSuggestedContext}
          />
          <div className="ml-auto shrink-0">
            <ModelSelector selectedModel={selectedModel} onModelChange={onModelChange} />
          </div>
        </div>

        {/* Input + send button on the same horizontal line */}
        <div className="flex items-end gap-2 px-3 pb-2 pt-1">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKey}
            rows={1}
            placeholder="Ask a question..."
            className={cn(
              'block flex-1 resize-none bg-transparent outline-none',
              'min-h-0 py-2 text-[14px] leading-6 text-stone-900',
              'dark:text-stone-100',
              'placeholder:text-stone-400 dark:placeholder:text-stone-500',
              'font-sans'
            )}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!canSend}
            aria-label="Send"
            className={cn(
              'size-8 shrink-0 rounded-full transition-all disabled:opacity-100',
              canSend ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-muted text-muted-foreground/40'
            )}
          >
            <ArrowUp className="size-4" strokeWidth={2.25} />
          </Button>
        </div>
      </div>
    </form>
  )
}
