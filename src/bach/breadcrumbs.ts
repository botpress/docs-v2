import type { PageItem } from './types'
import { normalizePagePath, normalizeSlug, titleFromSlug, lastSegment } from './utils'
import { buildPages, findFirstHref, readDocsConfig } from './tree'

export async function searchPagesForBreadcrumbs<TCollection extends string>(
  pagePath: string,
  pages: PageItem<TCollection>[],
  prefix: { label: string; href: string }[],
  titleMap: Map<string, string>
): Promise<{ label: string; href: string }[] | null> {
  const normalizedTarget = normalizePagePath(pagePath)

  for (const item of pages) {
    if (typeof item === 'string') {
      if (normalizePagePath(item) === normalizedTarget) {
        const href = normalizedTarget === 'index' ? '/' : `/${normalizedTarget}`
        return [...prefix, { label: titleMap.get(normalizedTarget) ?? titleFromSlug(lastSegment(item)), href }]
      }
    } else {
      // Check if this is a collection group and the target matches a collection entry
      if ('collection' in item) {
        // Collection groups don't have explicit pages to match
        // We'll skip matching here and let the caller handle collection entry breadcrumbs
        continue
      }

      const groupPrefix = [...prefix]
      if (item.root) {
        const rootNormalized = normalizePagePath(item.root)
        groupPrefix.push({
          label: item.group,
          href: rootNormalized === 'index' ? '/' : `/${rootNormalized}`,
        })
        if (rootNormalized === normalizedTarget) {
          return groupPrefix
        }
      } else {
        const firstChildHref = findFirstHref(buildPages(item.pages, 0, '', titleMap, new Map()))
        groupPrefix.push({ label: item.group, href: firstChildHref ?? '/' })
      }

      const result = await searchPagesForBreadcrumbs(pagePath, item.pages, groupPrefix, titleMap)
      if (result) return result
    }
  }

  return null
}

export async function buildBreadcrumbs(
  entryId: string,
  _contentDir: string,
  pageTitle: string,
  titleMap: Map<string, string>
): Promise<{ label: string; href: string }[]> {
  const rawSlug = entryId.replace(/\.(md|mdx)$/, '')
  const pagePath = normalizeSlug(rawSlug)

  const docsConfig = await readDocsConfig()

  for (const tab of docsConfig.navigation.tabs) {
    const crumbs = await searchPagesForBreadcrumbs(pagePath, tab.pages, [], titleMap)
    if (crumbs) {
      // Remove the active page itself — breadcrumbs show only the parent path
      return crumbs.slice(0, -1)
    }
  }

  return [{ label: pageTitle, href: '/' }]
}
