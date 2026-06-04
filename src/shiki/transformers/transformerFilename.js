/** @returns {import('shiki').ShikiTransformer} */
export function transformerFilename() {
  return {
    name: 'transformer:filename',
    pre(node) {
      const meta = this.options?.meta?.__raw ?? ''
      const match = meta.trim().match(/^([^\s{[\]]+)/)
      if (match?.[1]) {
        node.properties['data-title'] = match[1]
      }
    },
  }
}
