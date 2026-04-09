import { useEffect, useRef, useState, useCallback } from 'react'

interface TOCHeading {
  depth: number
  slug: string
  text: string
}

interface SVGData {
  width: number
  height: number
  path: string
}

interface ItemState {
  id: string
  active: boolean
  fallback: boolean
  t: number
}

const BASE = 8

function lineX(depth: number): number {
  if (depth <= 2) return BASE
  if (depth === 3) return BASE + 8
  return BASE + 16
}

function textPad(depth: number): number {
  if (depth <= 2) return BASE + 12
  if (depth === 3) return BASE + 24
  return BASE + 36
}

export function ClerkTOC({ headings }: { headings: TOCHeading[] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const thumbRef = useRef<HTMLDivElement>(null)
  const [activeSlugs, setActiveSlugs] = useState<Set<string>>(new Set())
  const [svg, setSvg] = useState<SVGData | null>(null)
  const prevStartRef = useRef(0)
  const prevEndRef = useRef(0)

  // SVG spine computation via ResizeObserver
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    function compute() {
      if (!el || el.clientHeight === 0) return
      let w = 0,
        h = 0,
        pB = 0,
        pX = 0,
        d = ''

      for (let i = 0; i < headings.length; i++) {
        const a = el.querySelector<HTMLElement>(`a[href="#${headings[i].slug}"]`)
        if (!a) continue
        const cs = getComputedStyle(a)
        const x = lineX(headings[i].depth) + 0.5
        const top = a.offsetTop + parseFloat(cs.paddingTop)
        const bot = a.offsetTop + a.clientHeight - parseFloat(cs.paddingBottom)
        w = Math.max(x + 8, w)
        h = Math.max(h, bot)
        d += i === 0 ? `M${x} ${top} L${x} ${bot}` : ` C${pX} ${top - 4} ${x} ${pB + 4} ${x} ${top} L${x} ${bot}`
        pX = x
        pB = bot
      }
      setSvg({ width: w, height: h, path: d })
    }

    const obs = new ResizeObserver(compute)
    compute()
    obs.observe(el)
    return () => obs.disconnect()
  }, [headings])

  // Thumb position: spans from first active to last active anchor
  const updateThumb = useCallback((active: Set<string>) => {
    const el = containerRef.current
    const thumb = thumbRef.current
    if (!el || !thumb) return

    if (active.size === 0) {
      thumb.style.setProperty('--toc-top', '0px')
      thumb.style.setProperty('--toc-height', '0px')
      return
    }

    let upper = Number.MAX_VALUE
    let lower = 0

    for (const slug of active) {
      const a = el.querySelector<HTMLElement>(`a[href="#${slug}"]`)
      if (!a) continue
      const cs = getComputedStyle(a)
      upper = Math.min(upper, a.offsetTop + parseFloat(cs.paddingTop))
      lower = Math.max(lower, a.offsetTop + a.clientHeight - parseFloat(cs.paddingBottom))
    }

    thumb.style.setProperty('--toc-top', `${upper}px`)
    thumb.style.setProperty('--toc-height', `${lower - upper}px`)
  }, [])

  // IntersectionObserver scroll spy (matches Fumadocs core/toc.tsx Observer)
  useEffect(() => {
    const main = document.querySelector('main')
    if (!main || !headings.length) return

    const items: ItemState[] = headings
      .map((h) => {
        const el = document.getElementById(h.slug)
        return el ? { id: h.slug, active: false, fallback: false, t: 0 } : null
      })
      .filter(Boolean) as ItemState[]

    if (!items.length) return

    function publish() {
      const next = new Set<string>()
      for (const item of items) {
        if (item.active) next.add(item.id)
      }
      setActiveSlugs(next)
      updateThumb(next)
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.length) return

        let hasActive = false
        for (const item of items) {
          const entry = entries.find((e) => e.target.id === item.id)
          const active = entry ? entry.isIntersecting : item.active && !item.fallback
          if (item.active !== active) {
            item.active = active
            item.fallback = false
            item.t = Date.now()
          }
          if (active) hasActive = true
        }

        if (!hasActive) {
          const viewTop = main!.getBoundingClientRect().top
          let min = Number.MAX_VALUE
          let fallbackIdx = -1

          for (let i = 0; i < items.length; i++) {
            const el = document.getElementById(items[i].id)
            if (!el) continue
            const d = Math.abs(viewTop - el.getBoundingClientRect().top)
            if (d < min) {
              fallbackIdx = i
              min = d
            }
          }

          if (fallbackIdx !== -1) {
            items[fallbackIdx].active = true
            items[fallbackIdx].fallback = true
            items[fallbackIdx].t = Date.now()
          }
        }

        publish()
      },
      { root: main, rootMargin: '0px', threshold: 0.98 }
    )

    for (const item of items) {
      const el = document.getElementById(item.id)
      if (el) observer.observe(el)
    }

    return () => observer.disconnect()
  }, [headings, updateThumb])

  // Recompute thumb on resize
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const obs = new ResizeObserver(() => updateThumb(activeSlugs))
    obs.observe(el)
    return () => obs.disconnect()
  }, [activeSlugs, updateThumb])

  if (!headings.length) return null

  const startIdx = headings.findIndex((h) => activeSlugs.has(h.slug))
  const endIdx = headings.findLastIndex((h) => activeSlugs.has(h.slug))

  let isUp = false
  if (startIdx !== -1) {
    isUp =
      prevStartRef.current > startIdx ||
      prevEndRef.current > endIdx ||
      (prevStartRef.current === startIdx && prevEndRef.current === endIdx)
    prevStartRef.current = startIdx
    prevEndRef.current = endIdx
  }

  const edgeItem = headings[isUp ? startIdx : endIdx]
  const edgeDepth = edgeItem?.depth ?? 2
  const hasActive = activeSlugs.size > 0

  const clipPath =
    'polygon(0 var(--toc-top), 100% var(--toc-top), 100% calc(var(--toc-top) + var(--toc-height)), 0 calc(var(--toc-top) + var(--toc-height)))'

  return (
    <>
      <h4 className="mb-3 text-xs font-medium text-stone-400 dark:text-stone-500">On this page</h4>
      <div className="relative">
        {svg && (
          <div ref={thumbRef} className="absolute top-0 left-0" style={{ width: svg.width, height: svg.height }}>
            <svg
              viewBox={`0 0 ${svg.width} ${svg.height}`}
              className="absolute transition-[clip-path] duration-200"
              style={{ width: svg.width, height: svg.height, clipPath }}
            >
              <path d={svg.path} strokeWidth="1" fill="none" className="stroke-primary" />
            </svg>
            {hasActive && (
              <div
                className="absolute size-1 rounded-full bg-primary transition-all duration-200"
                style={{
                  translate: `${lineX(edgeDepth) - 1}px calc(${isUp ? 'var(--toc-top)' : 'var(--toc-top) + var(--toc-height)'} - 1.5px)`,
                }}
              />
            )}
          </div>
        )}
        <div ref={containerRef} className="flex flex-col">
          {headings.map((h, i) => {
            const offset = lineX(h.depth)
            const upperOffset = i > 0 ? lineX(headings[i - 1].depth) : offset
            const lowerOffset = i + 1 < headings.length ? lineX(headings[i + 1].depth) : offset

            return (
              <a
                key={h.slug}
                href={`#${h.slug}`}
                className={`relative block py-1.5 text-sm leading-snug transition-colors first:pt-0 last:pb-0 ${
                  activeSlugs.has(h.slug)
                    ? 'text-primary'
                    : 'text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300'
                }`}
                style={{ paddingLeft: textPad(h.depth) }}
              >
                {offset !== upperOffset && (
                  <svg
                    viewBox={`${Math.min(offset, upperOffset)} 0 ${Math.abs(upperOffset - offset)} 12`}
                    className="absolute -top-1.5 -z-10"
                    style={{
                      width: Math.abs(upperOffset - offset) + 1,
                      height: 12,
                      left: Math.min(offset, upperOffset),
                    }}
                  >
                    <path
                      d={`M ${upperOffset} 0 C ${upperOffset} 8 ${offset} 4 ${offset} 12`}
                      strokeWidth="1"
                      fill="none"
                      className="stroke-stone-200 dark:stroke-stone-700"
                    />
                  </svg>
                )}
                <div
                  className={`absolute inset-y-0 w-px bg-stone-200 -z-10 dark:bg-stone-700 ${offset !== upperOffset ? 'top-1.5' : ''} ${offset !== lowerOffset ? 'bottom-1.5' : ''}`}
                  style={{ left: offset }}
                />
                {h.text}
              </a>
            )
          })}
        </div>
      </div>
    </>
  )
}
