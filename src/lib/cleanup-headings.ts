import type { MarkdownHeading } from 'astro'

interface ParsedHeading {
  text: string
  insideTabs: boolean
}

function parseHeadings(body: string): ParsedHeading[] {
  const out: ParsedHeading[] = []
  const lines = body.split('\n')
  let tabsDepth = 0

  for (const line of lines) {
    const opens = line.match(/<Tabs\b[^>]*?(?<!\/)>/g)
    const closes = line.match(/<\/Tabs>/g)

    const headingMatch = line.match(/^\s*(#{2,3})\s+(.+)$/)
    if (headingMatch) {
      const rawText = headingMatch[2]
        .trim()
        .replace(/\{[^}]*\}/g, '')
        .trim()
      out.push({ text: rawText, insideTabs: tabsDepth > 0 })
    }

    if (opens) tabsDepth += opens.length
    if (closes) tabsDepth -= closes.length
    if (tabsDepth < 0) tabsDepth = 0
  }

  return out
}

export const cleanupHeadings = (body: string, headings: MarkdownHeading[]): MarkdownHeading[] => {
  const parsed = parseHeadings(body ?? '')

  return headings
    .filter((h) => h.depth >= 2 && h.depth <= 3)
    .map((h, index) => ({
      depth: h.depth,
      slug: h.slug,
      text: parsed[index]?.text ?? h.text,
      insideTabs: parsed[index]?.insideTabs ?? false,
    }))
    .filter((h) => !h.insideTabs)
    .map(({ depth, slug, text }) => ({ depth, slug, text }))
}
