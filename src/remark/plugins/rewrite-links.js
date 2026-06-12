import { baseUrl } from '../../const.js'

//TODO: Use this to clean up broken links in markdown files
function rewriteHref(href) {
  if (!href.startsWith('/')) return href
  if (href.startsWith(baseUrl)) return href

  return `${baseUrl}${href}`
}

function rewriteNode(node) {
  if (!node || typeof node !== 'object') return

  if ((node.type === 'link' || node.type === 'definition') && typeof node.url === 'string') {
    node.url = rewriteHref(node.url)
  }

  if (Array.isArray(node.children)) {
    for (const child of node.children) rewriteNode(child)
  }
}

export default function remarkRewriteLinks() {
  return (tree) => rewriteNode(tree)
}
