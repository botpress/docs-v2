import { Check, ChevronDown, Copy, ExternalLink, FileText } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

interface CopyMarkdownButtonProps {
  markdownUrl: string
}

export default function CopyMarkdownButton({ markdownUrl }: CopyMarkdownButtonProps) {
  const [status, setStatus] = useState<'idle' | 'copying' | 'copied' | 'error'>('idle')
  const [menuOpen, setMenuOpen] = useState(false)
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setMenuOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
      if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current)
    }
  }, [])

  async function copyMarkdown() {
    if (status === 'copying') return

    if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current)
    setStatus('copying')

    try {
      const response = await fetch(markdownUrl)
      if (!response.ok) throw new Error(`Failed to fetch ${markdownUrl}`)

      const markdown = await response.text()
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable')

      await navigator.clipboard.writeText(markdown)
      setStatus('copied')
      setMenuOpen(false)
    } catch {
      setStatus('error')
    }

    resetTimeoutRef.current = setTimeout(() => setStatus('idle'), 2000)
  }

  const isCopied = status === 'copied'
  const label =
    status === 'copying' ? 'Copying...' : isCopied ? 'Copied' : status === 'error' ? 'Retry copy' : 'Copy page'

  return (
    <div ref={containerRef} className="not-prose relative inline-flex shrink-0 items-stretch" aria-live="polite">
      <button
        type="button"
        onClick={copyMarkdown}
        className="inline-flex items-center gap-2 rounded-l-xl border border-r-0 border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-600 transition-colors hover:border-stone-300 hover:text-stone-900 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300 dark:hover:border-stone-700 dark:hover:text-stone-100"
        aria-label={label}
      >
        {isCopied ? <Check className="size-4" /> : <Copy className="size-4" />}
        <span>{label}</span>
      </button>

      <button
        type="button"
        onClick={() => setMenuOpen((open) => !open)}
        className="inline-flex items-center rounded-r-xl border border-stone-200 bg-white px-2.5 text-xs text-stone-500 transition-colors hover:border-stone-300 hover:text-stone-900 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:border-stone-800 dark:bg-stone-900 dark:text-stone-400 dark:hover:border-stone-700 dark:hover:text-stone-100"
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        aria-label="Open markdown actions"
      >
        <ChevronDown className={`size-4 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
      </button>

      {menuOpen && (
        <div className="absolute top-full right-0 z-20 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-stone-200 bg-white p-1.5 shadow-xl dark:border-stone-800 dark:bg-stone-950">
          <button
            type="button"
            role="menuitem"
            onClick={copyMarkdown}
            className="flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-stone-50 dark:hover:bg-stone-900"
          >
            <span className="mt-1 text-stone-500 dark:text-stone-400">
              {isCopied ? <Check className="size-4" /> : <Copy className="size-4" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-stone-900 dark:text-stone-100">Copy page</span>
              <span className="block text-sm text-stone-500 dark:text-stone-400">Copy page as Markdown for LLMs</span>
            </span>
          </button>

          <a
            role="menuitem"
            href={markdownUrl}
            target="_blank"
            rel="noreferrer"
            onClick={() => setMenuOpen(false)}
            className="flex items-start gap-3 rounded-xl px-3 py-3 text-left no-underline transition-colors hover:bg-stone-50 dark:hover:bg-stone-900"
          >
            <span className="mt-1 text-stone-500 dark:text-stone-400">
              <FileText className="size-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1 text-sm font-medium text-stone-900 dark:text-stone-100">
                <span>View as Markdown</span>
                <ExternalLink className="size-3" />
              </span>
              <span className="block text-sm text-stone-500 dark:text-stone-400">View this page as plain text</span>
            </span>
          </a>
        </div>
      )}
    </div>
  )
}
