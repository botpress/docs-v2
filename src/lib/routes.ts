/**
 * Compute every valid internal path from a map of collection entries.
 *
 * - For the default collection, entry IDs are normalized (strip `.md`/`.mdx`,
 *   trailing `/index`) and converted to absolute paths (`/slug`).
 * - For other collections, raw entry IDs are used as-is.
 * - An explicit `/` is always included.
 */
export function getValidRoutes(
  entriesByCollection: Map<string, Array<{ id: string }>>,
  defaultCollection: string
): Set<string> {
  const routes = new Set<string>()
  routes.add('/')

  for (const [collectionName, entries] of entriesByCollection) {
    for (const entry of entries) {
      const rawId = entry.id
      const slug =
        collectionName === defaultCollection ? rawId.replace(/\.(md|mdx)$/, '').replace(/\/index$/, '') : rawId
      routes.add(slug === 'index' || slug === '' ? '/' : `/${slug}`)
    }
  }

  return routes
}
