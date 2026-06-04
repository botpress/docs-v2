/** @returns {import('shiki').ShikiTransformer} */
export function transformerExpandable() {
  return {
    name: 'transformer:expandable',
    pre(node) {
      const meta = this.options?.meta?.__raw ?? ''
      if (/\bexpandable\b/.test(meta)) {
        node.properties['data-expandable'] = 'true'
      }
    },
  }
}
