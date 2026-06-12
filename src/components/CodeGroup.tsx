import { useState, useEffect, useRef, type ReactNode } from 'react'
import { COPY_ICON, CHECK_ICON } from '@/scripts/code-icons'

function CodeGroup({ children }: { children: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const presRef = useRef<HTMLElement[]>([])
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [tabs, setTabs] = useState<string[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const pres = Array.from(container.querySelectorAll<HTMLElement>('pre.astro-code'))
    if (pres.length === 0) return
    presRef.current = pres
    setTabs(
      pres.map((pre, i) => {
        return pre.getAttribute('data-title') || `File ${i + 1}`
      })
    )
    pres.forEach((pre, i) => {
      pre.hidden = i !== 0
    })
    return () => clearTimeout(copyTimerRef.current)
  }, [])

  const handleSetActive = (newIndex: number) => {
    presRef.current.forEach((pre, i) => {
      pre.hidden = i !== newIndex
    })
    setActiveIndex(newIndex)
  }

  const handleCopy = async () => {
    const code = presRef.current[activeIndex]?.querySelector('code')?.textContent ?? ''
    await navigator.clipboard.writeText(code)
    setCopied(true)
    clearTimeout(copyTimerRef.current)
    copyTimerRef.current = setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="code-group not-prose">
      {tabs.length > 0 && (
        <div className="code-group-tabs" role="tablist">
          {tabs.map((title, i) => (
            <button
              key={i}
              className="code-group-tab"
              role="tab"
              aria-selected={i === activeIndex}
              data-active={String(i === activeIndex)}
              onClick={() => handleSetActive(i)}
            >
              {title}
            </button>
          ))}
          <button
            className="code-group-copy"
            aria-label="Copy code"
            onClick={handleCopy}
            dangerouslySetInnerHTML={{ __html: copied ? CHECK_ICON : COPY_ICON }}
          />
        </div>
      )}
      <div ref={containerRef}>{children}</div>
    </div>
  )
}

export { CodeGroup }
