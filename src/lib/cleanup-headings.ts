import type { MarkdownHeading } from 'astro'

interface ParsedHeading {
  text: string
  insideTabs: boolean
}

function stripFences(body: string): string {
  const lines = body.split('\n')
  const out: string[] = []
  let opener: string | null = null
  for (const line of lines) {
    const m = line.match(/^[ \t]{0,3}(`{3,}|~{3,})/)
    if (opener === null) {
      if (m) {
        opener = m[1]
        out.push('')
        continue
      }
      out.push(line)
    } else {
      if (m && m[1][0] === opener[0] && m[1].length >= opener.length) {
        opener = null
      }
      out.push('')
    }
  }
  return out.join('\n')
}

const TOKEN_RE = /<Tabs\b[\s\S]*?(?<!\/)>|<\/Tabs>|^[ \t]*#{2,3}[ \t]+.+$/gm

function parseHeadings(body: string): ParsedHeading[] {
  const cleaned = stripFences(body)
  const out: ParsedHeading[] = []
  let tabsDepth = 0
  for (const match of cleaned.matchAll(TOKEN_RE)) {
    const tok = match[0]
    if (tok.startsWith('</Tabs')) {
      tabsDepth = Math.max(0, tabsDepth - 1)
    } else if (tok.startsWith('<Tabs')) {
      if (!/\/[ \t\r\n]*>$/.test(tok)) tabsDepth++
    } else {
      const hm = tok.match(/^[ \t]*(#{2,3})[ \t]+(.+)$/)
      if (hm) {
        const rawText = hm[2]
          .trim()
          .replace(/\{[^}]*\}/g, '')
          .trim()
        out.push({ text: rawText, insideTabs: tabsDepth > 0 })
      }
    }
  }
  return out
}

export interface CleanupHeadingsOptions {
  hideSlugs?: Set<string>
}

export const cleanupHeadings = (
  body: string,
  headings: MarkdownHeading[],
  options: CleanupHeadingsOptions = {}
): MarkdownHeading[] => {
  const parsed = parseHeadings(body ?? '')
  const hideSlugs = options.hideSlugs

  return headings
    .filter((h) => h.depth >= 2 && h.depth <= 3)
    .map((h, index) => ({
      depth: h.depth,
      slug: h.slug,
      text: parsed[index]?.text ?? h.text,
      insideTabs: parsed[index]?.insideTabs ?? false,
    }))
    .filter((h) => !h.insideTabs)
    .filter((h) => !hideSlugs?.has(h.slug))
    .map(({ depth, slug, text }) => ({ depth, slug, text }))
}
