import type { DocsConfig } from './types'

export function defineConfig<T, TCollection extends keyof T & string>(
  collections: T,
  config: DocsConfig<TCollection>
): DocsConfig<TCollection> {
  return config
}

export function titleFromSlug(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export function slugify(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-')
}

export function normalizePagePath(pagePath: string): string {
  if (pagePath === 'index') return 'index'
  return pagePath.replace(/\/index$/, '')
}

export function normalizeSlug(rawSlug: string): string {
  if (rawSlug === 'index') return 'index'
  return rawSlug.replace(/\/index$/, '')
}

export function lastSegment(pagePath: string): string {
  const parts = pagePath.split('/')
  return parts[parts.length - 1]!
}
