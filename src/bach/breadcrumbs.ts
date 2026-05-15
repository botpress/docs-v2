import type { DocsConfig, PageItem } from './types'
import { normalizePagePath, normalizeEntryId, titleFromSlug, lastSegment } from './utils'
import { buildPages, findFirstHref } from './tree'

/**
 * Recursively walk the navigation config looking for a breadcrumb trail that
 * ends at `pagePath`. Collection groups are skipped because their entries are
 * handled by the caller (see {@link buildBreadcrumbs}).
 */
export async function searchPagesForBreadcrumbs<TCollection extends string>(
  pagePath: string,
  pages: PageItem<TCollection>[],
  prefix: { label: string; href: string }[],
  titleMap: Map<string, string>,
  sidebarTitleMap: Map<string, string>,
  iconMap: Map<string, string>
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
        const firstChildHref = findFirstHref(
          buildPages(item.pages, 0, '', titleMap, new Map(), sidebarTitleMap, iconMap)
        )
        groupPrefix.push({ label: item.group, href: firstChildHref ?? '/' })
      }

      const result = await searchPagesForBreadcrumbs(
        pagePath,
        item.pages,
        groupPrefix,
        titleMap,
        sidebarTitleMap,
        iconMap
      )
      if (result) return result
    }
  }

  return null
}

/**
 * Build a breadcrumb array for a given entry ID.
 * Looks up the page path in every tab's navigation tree; if no match is found
 * falls back to a single home crumb.
 *
 * The active page itself is excluded from the returned array.
 */
export async function buildBreadcrumbs<TCollection extends string>(
  config: DocsConfig<TCollection>,
  entryId: string,
  pageTitle: string,
  titleMap: Map<string, string>,
  sidebarTitleMap: Map<string, string>,
  iconMap: Map<string, string>
): Promise<{ label: string; href: string }[]> {
  const pagePath = normalizeEntryId(entryId)

  for (const tab of config.navigation.tabs) {
    const crumbs = await searchPagesForBreadcrumbs(pagePath, tab.pages, [], titleMap, sidebarTitleMap, iconMap)
    if (crumbs) {
      // Remove the active page itself — breadcrumbs show only the parent path
      return crumbs.slice(0, -1)
    }
  }

  return [{ label: pageTitle, href: '/' }]
}
