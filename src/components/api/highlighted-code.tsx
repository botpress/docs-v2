import { useState, useEffect, useRef, useMemo } from 'react'

interface ShikiHighlighter {
  codeToHtml(code: string, options: { lang: string; themes: Record<string, string> }): string
}

let highlighterPromise: Promise<ShikiHighlighter> | null = null

function getHighlighter(): Promise<ShikiHighlighter> {
  if (!highlighterPromise) {
    highlighterPromise = import('shiki').then((mod) =>
      mod.createHighlighter({
        themes: ['github-light', 'github-dark'],
        langs: ['bash', 'javascript', 'python', 'json', 'php', 'go', 'java', 'ruby'],
      })
    ) as Promise<ShikiHighlighter>
  }
  return highlighterPromise
}

interface HighlightedCodeProps {
  code: string
  language: string
  className?: string
}

export default function HighlightedCode({ code, language, className }: HighlightedCodeProps) {
  const [html, setHtml] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const trimmedCode = useMemo(() => code.trim(), [code])

  useEffect(() => {
    let cancelled = false
    getHighlighter().then((highlighter) => {
      if (cancelled) return
      const result = highlighter.codeToHtml(trimmedCode, {
        lang: language,
        themes: { light: 'github-light', dark: 'github-dark' },
      })
      setHtml(result)
    })
    return () => {
      cancelled = true
    }
  }, [trimmedCode, language])

  if (!html) {
    return (
      <pre className={`overflow-x-auto text-xs leading-relaxed text-stone-800 dark:text-stone-200 ${className || ''}`}>
        <code>{trimmedCode}</code>
      </pre>
    )
  }

  return (
    <div
      ref={containerRef}
      className={`overflow-x-auto text-xs leading-relaxed [&_.shiki]:!bg-transparent [&_pre]:!bg-transparent [&_pre]:!p-0 [&_code]:!bg-transparent ${className || ''}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
