import type { APIRoute } from 'astro'
import path from 'node:path'
import {
  buildSidebarTree,
  buildSidebarEntryMap,
  buildCollectionsSidebarData,
  getReferencedCollections,
  readDocsConfig,
  fetchCollection,
} from '@/bach'
import type { ContentEntry } from '@/bach'
import type { SidebarNode } from '../lib/sidebar-types'

const SITE_URL = 'https://botpress.com/docs'
const contentDir = path.resolve('./src/content/docs')

function toMdUrl(href: string): string {
  if (href === '/') return `${SITE_URL}/index.md`
  return `${SITE_URL}${href}.md`
}

function renderNodes(nodes: SidebarNode[], depth: number): string {
  const lines: string[] = []

  for (const node of nodes) {
    if (node.type === 'article') {
      lines.push(`${'  '.repeat(depth)}- [${node.title}](${toMdUrl(node.href)})`)
    } else {
      lines.push('')
      lines.push(`${'#'.repeat(depth + 2)} ${node.label}`)

      if (node.href) {
        lines.push(`- [${node.label}](${toMdUrl(node.href)})`)
      }

      lines.push(renderNodes(node.children, depth + 1))
    }
  }

  return lines.join('\n')
}

export const GET: APIRoute = async () => {
  const docsConfig = await readDocsConfig()
  const collectionNames = Array.from(getReferencedCollections(docsConfig))

  // Fetch all referenced collections for sidebar tree building
  const allEntries = new Map<string, ContentEntry[]>()

  for (const name of collectionNames) {
    try {
      const entries = await fetchCollection(name)
      allEntries.set(name, entries)
    } catch {
      // Skip missing collections
    }
  }

  const { titleMap, methodMap } = buildCollectionsSidebarData(allEntries)
  const collectionsMap = buildSidebarEntryMap(allEntries)

  const treeResult = await buildSidebarTree(titleMap, contentDir, methodMap, collectionsMap)
  const sections: string[] = []

  sections.push('# Botpress Documentation')
  sections.push('')
  sections.push('> Documentation for building AI agents with Botpress.')
  sections.push('')
  sections.push(`Full docs available at: ${SITE_URL}`)

  if (treeResult.tabs.length > 0) {
    for (const tab of treeResult.tabs) {
      const tree = treeResult.trees[tab.slug]
      if (!tree?.length) continue

      sections.push('')
      sections.push(`## ${tab.label}`)
      sections.push(renderNodes(tree, 0))
    }
  } else {
    sections.push(renderNodes(treeResult.defaultTree, 0))
  }

  const body =
    sections
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim() + '\n'

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
