/** @returns {import('shiki').ShikiTransformer} */
export function transformerFilename() {
  return {
    name: 'transformer:filename',
    pre(node) {
      const meta = this.options?.meta?.__raw ?? ''
      const titleMatch = meta.match(/title=(?:"([^"]+)"|'([^']+)')/)
      if (titleMatch) {
        node.properties['data-title'] = titleMatch[1] ?? titleMatch[2]
        return
      }
      const match = meta.trim().match(/^([^\s{[\]]+)/)
      if (match?.[1]) {
        node.properties['data-title'] = match[1]
      }
    },
  }
}
