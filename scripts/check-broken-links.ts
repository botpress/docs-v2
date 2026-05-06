#!/usr/bin/env bun
/**
 * Fast, build-less broken link checker.
 *
 * Derives every valid internal route from docs files on disk and OpenAPI specs,
 * then scans source files for internal links and reports broken ones.
 *
 * Usage: bun run scripts/check-broken-links.ts
 */

import fs from 'node:fs'
import path from 'node:path'
import { getApiEntryIds } from '../src/bach/loaders/api'
import { apiCollectionConfigs } from '../src/api-collections'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function findFiles(dir: string, extensions: string[]): string[] {
  const results: string[] = []
  const stack = [dir]
  while (stack.length) {
    const current = stack.pop()!
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name)
      if (entry.isDirectory()) {
        stack.push(full)
      } else if (extensions.includes(path.extname(entry.name))) {
        results.push(full)
      }
    }
  }
  return results
}

function normalizeEntryId(id: string): string {
  const rawSlug = id.replace(/\.(md|mdx)$/, '')
  if (rawSlug === 'index') return 'index'
  return rawSlug.replace(/\/index$/, '')
}

interface BrokenLink {
  file: string
  line: number
  target: string
}

function normalizeLink(href: string): string {
  // Strip hash and query
  const hashIdx = href.indexOf('#')
  const queryIdx = href.indexOf('?')
  const endIdx =
    hashIdx >= 0 && queryIdx >= 0 ? Math.min(hashIdx, queryIdx) : hashIdx >= 0 ? hashIdx : queryIdx >= 0 ? queryIdx : -1

  let normalized = endIdx >= 0 ? href.slice(0, endIdx) : href

  // Strip trailing slash (except root)
  if (normalized.length > 1 && normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1)
  }

  // Strip .md/.mdx extensions
  if (normalized.endsWith('.md') || normalized.endsWith('.mdx')) {
    normalized = normalized.slice(0, -path.extname(normalized).length)
  }

  return normalized
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  // 1. Build canonical route set
  const validRoutes = new Set<string>()
  validRoutes.add('/')

  // Docs entries
  const docsFiles = findFiles('src/content/docs', ['.md', '.mdx'])
  for (const file of docsFiles) {
    const id = path.relative('src/content/docs', file)
    const slug = normalizeEntryId(id)
    validRoutes.add(slug === 'index' ? '/' : `/${slug}`)
  }

  // API entries from OpenAPI specs
  for (const config of apiCollectionConfigs) {
    const ids = getApiEntryIds(config)
    for (const id of ids) {
      validRoutes.add(`/${id}`)
    }
  }

  // Static assets from public/
  if (fs.existsSync('public')) {
    const publicFiles = findFiles('public', ['.svg', '.png', '.jpg', '.jpeg', '.gif', '.ico', '.json', '.xml', '.txt'])
    for (const file of publicFiles) {
      validRoutes.add('/' + path.relative('public', file))
    }
  }

  // Known Astro-generated routes
  validRoutes.add('/sitemap-index.xml')
  validRoutes.add('/sitemap-0.xml')

  // 2. Scan source files for internal links
  const srcFiles = findFiles('src', ['.astro', '.tsx', '.mdx'])
  const filesToScan = [...new Set([...docsFiles, ...srcFiles])]

  const MARKDOWN_LINK_RE = /(?<!!)\]\((\/[^)\s]+)\)/g
  const HREF_RE = /\bhref=(['"])(\/[^'"]*)\1/g

  const broken: BrokenLink[] = []

  for (const file of filesToScan) {
    const content = fs.readFileSync(file, 'utf-8')
    const lines = content.split('\n')

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!
      const lineNum = i + 1

      // Markdown links: [text](/path)
      for (const match of line.matchAll(MARKDOWN_LINK_RE)) {
        const rawHref = match[1]!
        const normalized = normalizeLink(rawHref)
        if (!validRoutes.has(normalized)) {
          broken.push({ file, line: lineNum, target: rawHref })
        }
      }

      // JSX/Astro hrefs: href="/path"
      for (const match of line.matchAll(HREF_RE)) {
        const rawHref = match[2]!
        const normalized = normalizeLink(rawHref)
        if (!validRoutes.has(normalized)) {
          broken.push({ file, line: lineNum, target: rawHref })
        }
      }
    }
  }

  // 3. Report
  if (broken.length === 0) {
    console.log(`✓ No broken internal links found in ${filesToScan.length} files`)
    process.exit(0)
  }

  const byFile = new Map<string, BrokenLink[]>()
  for (const link of broken) {
    const list = byFile.get(link.file) ?? []
    list.push(link)
    byFile.set(link.file, list)
  }

  // TODO: replace the warnings with errors once all the content is merged in
  console.warn(`\n✗ Found ${broken.length} broken internal link(s):\n`)
  for (const [file, links] of byFile) {
    console.warn(`  ${file}`)
    for (const link of links) {
      console.warn(`    line ${link.line}: ${link.target}`)
    }
  }
  console.warn('')

  // TODO: replace with 1 once content is merged in
  process.exit(0)
}

main()
