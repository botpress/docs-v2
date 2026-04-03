import { useEffect, useRef, useCallback, useState } from 'react'

interface PagefindResult {
  id: string
  url: string
  meta: { title?: string }
  excerpt: string
}

interface PagefindSearchResult {
  id: string
  data: () => Promise<PagefindResult>
}

interface PagefindInstance {
  search: (query: string) => Promise<{ results: PagefindSearchResult[] }>
  init: () => Promise<void>
}

export default function SearchOverlay() {
  const inputRef = useRef<HTMLInputElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const isOpen = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PagefindResult[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const pagefindRef = useRef<PagefindInstance | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    async function loadPagefind() {
      try {
        // Pagefind generates its JS at build time into /pagefind/.
        // We load it dynamically at runtime via a constructed URL to avoid
        // Vite/Rollup trying to resolve it at build time.
        const pagefindPath = `${window.location.origin}/pagefind/pagefind.js`
        const pf = await import(/* @vite-ignore */ pagefindPath)
        await pf.init()
        pagefindRef.current = pf
      } catch {
        // Pagefind not available in dev mode
      }
    }
    loadPagefind()
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    const trimmed = query.trim()
    if (!trimmed) {
      setResults([])
      setHasSearched(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      if (!pagefindRef.current) {
        setHasSearched(true)
        return
      }

      try {
        const search = await pagefindRef.current.search(trimmed)
        const loaded = await Promise.all(search.results.slice(0, 8).map((r) => r.data()))
        setResults(loaded)
      } catch (err) {
        console.error('Search error:', err)
      } finally {
        setHasSearched(true)
      }
    }, 200)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  useEffect(() => {
    setSelectedIndex(-1)
  }, [results])

  const open = useCallback(() => {
    if (!overlayRef.current) return
    isOpen.current = true
    overlayRef.current.style.display = 'flex'
    document.body.style.overflow = 'hidden'
    void overlayRef.current.offsetHeight
    overlayRef.current.setAttribute('data-open', '')
    inputRef.current?.focus()
  }, [])

  const reset = useCallback(() => {
    setQuery('')
    setResults([])
    setHasSearched(false)
  }, [])

  const close = useCallback(() => {
    if (!overlayRef.current) return
    isOpen.current = false
    overlayRef.current.removeAttribute('data-open')
    document.body.style.overflow = ''
    const handler = () => {
      if (overlayRef.current && !isOpen.current) {
        overlayRef.current.style.display = 'none'
      }
    }
    overlayRef.current.addEventListener('transitionend', handler, { once: true })
    setTimeout(handler, 250)
    reset()
  }, [reset])

  const navigateToSelected = useCallback(() => {
    const result = results[selectedIndex]
    if (result) {
      close()
      window.location.href = result.url
    }
  }, [results, selectedIndex, close])

  useEffect(() => {
    function handleCustomEvent() {
      open()
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen.current) {
        e.preventDefault()
        close()
      }
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        if (isOpen.current) {
          close()
        } else {
          open()
        }
      }
    }

    window.addEventListener('hc:open-search', handleCustomEvent)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('hc:open-search', handleCustomEvent)
      document.removeEventListener('keydown', handleKeyDown)
      if (isOpen.current) {
        document.body.style.overflow = ''
      }
    }
  }, [open, close])

  const hasQuery = query.trim().length > 0
  const showEmpty = hasQuery && hasSearched && results.length === 0

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] hidden items-start justify-center pt-[min(20vh,120px)] transition-colors duration-200 data-[open]:bg-black/40 dark:data-[open]:bg-black/60"
      onClick={(e) => {
        if (e.target === overlayRef.current) close()
      }}
    >
      <div
        ref={containerRef}
        className="mx-4 flex w-full max-w-xl flex-col overflow-hidden rounded-xl border border-stone-200 bg-white shadow-2xl transition-[opacity,transform] duration-200 dark:border-stone-700 dark:bg-stone-900"
        style={{
          opacity: 'var(--overlay-opacity, 0)',
          transform: 'var(--overlay-transform, scale(0.98) translateY(-8px))',
        }}
      >
        <style>{`
          [data-open] > div {
            --overlay-opacity: 1;
            --overlay-transform: scale(1) translateY(0);
          }
        `}</style>

        <div className="flex items-center gap-3 border-b border-stone-100 px-4 dark:border-stone-800">
          <svg
            className="h-5 w-5 shrink-0 text-stone-400 dark:text-stone-500"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown' && results.length) {
                e.preventDefault()
                setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1))
              } else if (e.key === 'ArrowUp' && results.length) {
                e.preventDefault()
                setSelectedIndex((prev) => Math.max(prev - 1, -1))
              } else if (e.key === 'Enter' && selectedIndex >= 0) {
                e.preventDefault()
                navigateToSelected()
              }
            }}
            placeholder="Search docs..."
            autoComplete="off"
            className="h-12 flex-1 bg-transparent text-base text-stone-900 outline-none placeholder:text-stone-400 dark:text-stone-100 dark:placeholder:text-stone-500"
          />
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {hasQuery && results.length > 0 && (
            <div className="flex flex-col p-2">
              {results.map((result, i) => {
                const isSelected = selectedIndex === i
                return (
                  <a
                    key={result.id}
                    href={result.url}
                    onClick={() => close()}
                    className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${isSelected ? 'bg-stone-100 dark:bg-white/10' : 'hover:bg-stone-50 dark:hover:bg-white/5'}`}
                  >
                    <svg
                      className="h-4 w-4 shrink-0 text-stone-400 dark:text-stone-500"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    <div className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-stone-900 dark:text-stone-100">
                        {result.meta?.title || 'Untitled'}
                      </span>
                      {result.excerpt && (
                        <span
                          className="block truncate text-xs text-stone-400 dark:text-stone-500"
                          dangerouslySetInnerHTML={{ __html: result.excerpt }}
                        />
                      )}
                    </div>
                    <svg
                      className="h-4 w-4 shrink-0 text-stone-300 transition-colors group-hover:text-stone-500 dark:text-stone-600 dark:group-hover:text-stone-400"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M7 17 17 7" />
                      <path d="M7 7h10v10" />
                    </svg>
                  </a>
                )
              })}
            </div>
          )}

          {showEmpty && (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-stone-400 dark:text-stone-500">
                No results found
              </p>
            </div>
          )}

          {!hasQuery && (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-stone-400 dark:text-stone-500">Type to search across all docs</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
