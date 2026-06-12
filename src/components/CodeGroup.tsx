import { useState, useEffect, useRef, type ReactNode } from 'react'
import { COPY_ICON, CHECK_ICON, CHEVRON_DOWN_ICON, CHEVRON_UP_ICON } from '@/scripts/code-icons'

const EXPAND_LINE_THRESHOLD = 15

type CollapsibleInfo = { collapsible: boolean; lineCount: number }

function CodeGroup({ children }: { children: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const presRef = useRef<HTMLElement[]>([])
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [tabs, setTabs] = useState<string[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [copied, setCopied] = useState(false)
  const [collapsibleInfo, setCollapsibleInfo] = useState<CollapsibleInfo[]>([])
  const [expandedTabs, setExpandedTabs] = useState<Set<number>>(new Set())

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const pres = Array.from(
      container.querySelectorAll<HTMLElement>(':scope > pre.astro-code, :scope > astro-slot > pre.astro-code')
    )
    if (pres.length === 0) return
    presRef.current = pres
    setTabs(pres.map((pre, i) => pre.getAttribute('data-title') || `File ${i + 1}`))
    const info: CollapsibleInfo[] = pres.map((pre) => {
      const lineCount = pre.querySelectorAll('.line').length
      const collapsible = pre.hasAttribute('data-expandable') || lineCount > EXPAND_LINE_THRESHOLD
      return { collapsible, lineCount }
    })
    setCollapsibleInfo(info)
    pres.forEach((pre, i) => {
      pre.hidden = i !== 0
      if (info[i].collapsible) pre.classList.add('is-collapsible')
    })
    return () => clearTimeout(copyTimerRef.current)
  }, [])

  useEffect(() => {
    presRef.current.forEach((pre, i) => {
      pre.classList.toggle('is-expanded', expandedTabs.has(i))
    })
  }, [expandedTabs])

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

  const toggleExpanded = () => {
    setExpandedTabs((prev) => {
      const next = new Set(prev)
      if (next.has(activeIndex)) next.delete(activeIndex)
      else next.add(activeIndex)
      return next
    })
  }

  const activeInfo = collapsibleInfo[activeIndex]
  const activeCollapsible = activeInfo?.collapsible ?? false
  const activeExpanded = expandedTabs.has(activeIndex)
  const activeLineCount = activeInfo?.lineCount ?? 0

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
      {activeCollapsible && (
        <button
          className="code-expand-btn"
          onClick={toggleExpanded}
          dangerouslySetInnerHTML={{
            __html: activeExpanded
              ? `Show fewer lines ${CHEVRON_UP_ICON}`
              : `See all ${activeLineCount} lines ${CHEVRON_DOWN_ICON}`,
          }}
        />
      )}
    </div>
  )
}

export { CodeGroup }
