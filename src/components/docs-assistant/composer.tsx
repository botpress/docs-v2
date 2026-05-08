import { useRef, useEffect, useCallback, useState } from 'react'
import type React from 'react'
import { ArrowUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ComposerProps {
  onSend: (message: string) => void
  inputRef?: React.RefObject<HTMLTextAreaElement | null>
}

/**
 * Auto-growing textarea composer at the bottom — soft elevation, generous
 * padding, send arrow as a circular accent button.
 */
export function Composer({ onSend, inputRef: externalRef }: ComposerProps) {
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
          'rounded-2xl border border-border bg-background',
          'shadow-sm',
          'focus-within:border-foreground/20 focus-within:shadow-md',
          'transition-shadow transition-colors'
        )}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKey}
          rows={1}
          placeholder="Ask a question..."
          className={cn(
            'block w-full resize-none bg-transparent outline-none',
            'px-4 pt-3.5 pb-2 text-[14px] leading-6 text-foreground',
            'placeholder:text-muted-foreground/70 font-sans'
          )}
        />
        <div className="flex items-center justify-end px-2 pb-2">
          <button
            type="submit"
            disabled={!canSend}
            aria-label="Send"
            className={cn(
              'size-8 rounded-full flex items-center justify-center transition-all',
              canSend
                ? 'bg-primary text-primary-foreground hover:opacity-90'
                : 'bg-muted text-muted-foreground/40 cursor-not-allowed'
            )}
          >
            <ArrowUp className="size-4" strokeWidth={2.25} />
          </button>
        </div>
      </div>
    </form>
  )
}
