import { useState, useEffect, useRef, type ReactNode, type KeyboardEvent } from 'react'

const TAB_BUTTON_BASE =
  '-mb-px flex max-w-max items-center gap-1.5 whitespace-nowrap border-b pt-3 pb-2.5 font-semibold text-sm leading-6'
const TAB_BUTTON_ACTIVE = 'border-current text-primary'
const TAB_BUTTON_INACTIVE =
  'border-transparent text-stone-900 hover:border-stone-300 dark:text-stone-200 dark:hover:border-stone-700'

interface TabInfo {
  title: string
  iconHtml: string | null
}

interface TabsProps {
  defaultIndex?: number
  className?: string
  children: ReactNode
}

function Tabs({ defaultIndex = 0, className, children }: TabsProps) {
  const panelsRef = useRef<HTMLDivElement>(null)
  const panelEls = useRef<HTMLElement[]>([])
  const tabEls = useRef<HTMLLIElement[]>([])
  const [tabs, setTabs] = useState<TabInfo[]>([])
  const [activeIndex, setActiveIndex] = useState(defaultIndex)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const container = panelsRef.current
    if (!container) return
    const panels = Array.from(container.querySelectorAll<HTMLElement>(':scope > .bp-tab-panel'))
    if (panels.length === 0) return

    panelEls.current = panels

    const tabData = panels.map((panel) => {
      const title = panel.dataset.bpTabTitle ?? 'Tab'
      const iconSource = panel.querySelector<HTMLElement>(':scope > .bp-tab-icon-source')
      let iconHtml: string | null = null
      if (iconSource) {
        const clone = iconSource.cloneNode(true) as HTMLElement
        clone.hidden = false
        clone.removeAttribute('aria-hidden')
        clone.classList.remove('bp-tab-icon-source')
        iconHtml = clone.outerHTML
      }
      return { title, iconHtml }
    })

    const safeDefault = Math.max(0, Math.min(defaultIndex, panels.length - 1))
    panels.forEach((panel, i) => {
      panel.dataset.active = String(i === safeDefault)
      panel.setAttribute('aria-hidden', String(i !== safeDefault))
    })

    setTabs(tabData)
    setActiveIndex(safeDefault)
    setReady(true)
  }, [])

  const handleSetActive = (newIndex: number) => {
    if (newIndex === activeIndex) return
    setActiveIndex(newIndex)
    panelEls.current.forEach((panel, i) => {
      panel.dataset.active = String(i === newIndex)
      panel.setAttribute('aria-hidden', String(i !== newIndex))
    })
    window.setTimeout(() => tabEls.current[newIndex]?.focus(), 0)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLLIElement>) => {
    const count = tabs.length
    let newIndex = activeIndex
    switch (e.key) {
      case 'ArrowLeft':
        newIndex = (activeIndex - 1 + count) % count
        break
      case 'ArrowRight':
        newIndex = (activeIndex + 1) % count
        break
      case 'Home':
        newIndex = 0
        break
      case 'End':
        newIndex = count - 1
        break
      default:
        return
    }
    e.preventDefault()
    handleSetActive(newIndex)
  }

  return (
    <div className={`bp-tabs tab-container${className ? ` ${className}` : ''}`} data-ready={ready ? 'true' : undefined}>
      <ul
        className="bp-tab-list not-prose mb-6 flex min-w-full flex-none gap-x-6 overflow-auto border-b border-stone-200 pb-px dark:border-stone-700"
        role="tablist"
        aria-label="Tabs"
      >
        {tabs.map((tab, i) => (
          <li
            key={i}
            ref={(el) => {
              if (el) tabEls.current[i] = el
            }}
            role="tab"
            aria-selected={i === activeIndex}
            tabIndex={i === activeIndex ? 0 : -1}
            data-active={String(i === activeIndex)}
            className="cursor-pointer"
            onClick={() => handleSetActive(i)}
            onKeyDown={handleKeyDown}
          >
            <div
              className={`${TAB_BUTTON_BASE} ${i === activeIndex ? TAB_BUTTON_ACTIVE : TAB_BUTTON_INACTIVE}`}
              data-active={String(i === activeIndex)}
              data-bp-tab-button=""
            >
              {tab.iconHtml && <span dangerouslySetInnerHTML={{ __html: tab.iconHtml }} />}
              <span>{tab.title}</span>
            </div>
          </li>
        ))}
      </ul>
      <div ref={panelsRef} className="bp-tab-panels">
        {children}
      </div>
    </div>
  )
}

export { Tabs }
export type { TabsProps }
