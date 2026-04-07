function splitPathSuffix(path: string): { pathname: string; suffix: string } {
  const hashIndex = path.indexOf('#')
  const queryIndex = path.indexOf('?')
  const splitIndex = [hashIndex, queryIndex].filter((index) => index >= 0).sort((a, b) => a - b)[0] ?? -1

  return {
    pathname: splitIndex >= 0 ? path.slice(0, splitIndex) : path,
    suffix: splitIndex >= 0 ? path.slice(splitIndex) : '',
  }
}

export function toMarkdownPath(path: string): string {
  const { pathname, suffix } = splitPathSuffix(path)

  if (pathname === '/') return `/index.md${suffix}`
  if (pathname.endsWith('.md')) return path
  if (pathname.endsWith('/')) return `${pathname.slice(0, -1)}.md${suffix}`

  return `${pathname}.md${suffix}`
}

export function toMarkdownHref(href: string): string {
  if (!href.startsWith('/')) return href

  const { pathname } = splitPathSuffix(href)
  if (pathname.endsWith('.md')) return href
  if (/\.[a-z0-9]+$/i.test(pathname)) return href

  return toMarkdownPath(href)
}
