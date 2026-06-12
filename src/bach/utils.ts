import type { DocsConfig } from './types'

/**
 * Creates a docs configuration object with type-safe collection names.
 * Pass the collections object as the first argument so TypeScript can infer
 * valid collection names for the `collection` field in navigation groups.
 */
export function defineConfig<T, TCollection extends keyof T & string>(
  _collections: T,
  config: DocsConfig<TCollection>
): DocsConfig<TCollection> {
  return config
}

/** Convert a kebab-case slug to a Title Case string. */
export function titleFromSlug(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

/** Convert a string to a kebab-case slug. */
export function slugify(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-')
}

/**
 * Remove a trailing `/index` from a page path, leaving bare `index` unchanged.
 * Used when matching navigation config paths to entry IDs.
 */
export function normalizePagePath(pagePath: string): string {
  if (pagePath === 'index') return 'index'
  return pagePath.replace(/\/index$/, '')
}

/** Alias for {@link normalizePagePath}. */
export function normalizeSlug(rawSlug: string): string {
  if (rawSlug === 'index') return 'index'
  return rawSlug.replace(/\/index$/, '')
}

/**
 * Strip `.md` or `.mdx` from an entry ID, then normalize the slug.
 * This is the canonical way to turn a file name into a URL-safe page path.
 */
export function normalizeEntryId(id: string): string {
  const rawSlug = id.replace(/\.(md|mdx)$/, '')
  return normalizeSlug(rawSlug)
}

/** Return the last segment of a slash-separated path. */
export function lastSegment(pagePath: string): string {
  const parts = pagePath.split('/')
  return parts[parts.length - 1]!
}

// TODO (non-blocking): bach shouldn't read from the environment.
// BASE_URL is set by astro, we should pass the BASE_URL through some input to bach.
// We use the bach Site class to pass input from astro to bach. We should move these utils
// onto the site and pass in the BASE_URL to the Site constructor.
/** URL prefix derived from Astro's `base` config (e.g. `/docs`). Empty when base is `/`. */
export const BASE_PREFIX = import.meta.env.BASE_URL.replace(/\/$/, '')

/** Prefix a root-relative path with the docs base. */
export function withBase(path: string): string {
  if (path === '/') return `${BASE_PREFIX}/`
  if (path.startsWith('/')) return `${BASE_PREFIX}${path}`
  return `${BASE_PREFIX}/${path}`
}

/** Remove the docs base from the start of `path`, if present. */
export function stripBase(path: string): string {
  if (path === BASE_PREFIX) return '/'
  if (path.startsWith(`${BASE_PREFIX}/`)) return path.slice(BASE_PREFIX.length)
  return path
}
