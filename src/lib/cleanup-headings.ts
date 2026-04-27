import type { MarkdownHeading } from 'astro'

function extractRawHeadingTexts(body: string): string[] {
  const headingRegex = /^(#{2,3})\s+(.+)$/gm
  const texts: string[] = []
  let match
  while ((match = headingRegex.exec(body)) !== null) {
    const rawText = match[2].trim()
    // strip jsx expressions from raw text
    const text = rawText.replace(/\{[^}]*\}/g, '').trim()
    texts.push(text)
  }
  return texts
}

export const cleanupHeadings = (body: string, headings: MarkdownHeading[]): MarkdownHeading[] => {
  const rawTexts = extractRawHeadingTexts(body ?? '')
  return headings
    .filter((h) => h.depth >= 2 && h.depth <= 3)
    .map((h, index) => ({
      depth: h.depth,
      slug: h.slug,
      // use cleaned text from raw body if available, fallback to processed text
      text: rawTexts[index] ?? h.text,
    }))
}
