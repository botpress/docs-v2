/** @returns {import('shiki').ShikiTransformer} */
export function transformerFilename() {
  return {
    name: 'transformer:filename',
    pre(node) {
      const meta = this.options?.meta?.__raw ?? ''
      const titleAttr = meta.match(/\btitle=["']([^"']+)["']/)
      if (titleAttr?.[1]) {
        node.properties['data-title'] = titleAttr[1]
        return
      }
      const bare = meta.trim().match(/^([^\s{[\]]+)/)
      if (bare?.[1]) {
        node.properties['data-title'] = bare[1]
      }
    },
  }
}
