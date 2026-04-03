import { visit } from 'unist-util-visit'

const ASIDE_TYPES = new Set(['note', 'tip', 'caution', 'danger'])

const ICONS = {
  note: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>',
  tip: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>',
  caution:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>',
  danger:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>',
}

const LABELS = {
  note: 'Note',
  tip: 'Tip',
  caution: 'Caution',
  danger: 'Danger',
}

/**
 * Remark plugin that transforms :::note / :::tip / :::caution / :::danger
 * container directives into HTML aside elements with icon headers.
 *
 * Requires remark-directive to be loaded first.
 */
export function remarkAsides() {
  return (tree) => {
    visit(tree, 'containerDirective', (node) => {
      if (!ASIDE_TYPES.has(node.name)) return

      const type = node.name
      const customLabel = node.children?.[0]?.data?.directiveLabel ? node.children[0].children?.[0]?.value : undefined
      const label = customLabel || LABELS[type]

      const data = node.data || (node.data = {})
      data.hName = 'aside'
      data.hProperties = { 'data-aside-type': type }

      const header = {
        type: 'paragraph',
        data: {
          hName: 'div',
          hProperties: { class: 'aside-header' },
        },
        children: [
          {
            type: 'html',
            value: ICONS[type],
          },
          {
            type: 'text',
            data: {
              hName: 'span',
              hProperties: {},
              hChildren: [{ type: 'text', value: label }],
            },
            value: label,
          },
        ],
      }

      if (node.children?.[0]?.data?.directiveLabel) {
        node.children.shift()
      }

      node.children.unshift(header)
    })
  }
}
