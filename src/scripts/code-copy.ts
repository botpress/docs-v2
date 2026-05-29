import { COPY_ICON, CHECK_ICON, CHEVRON_DOWN_ICON, CHEVRON_UP_ICON } from '@/scripts/code-icons'

const EXPAND_LINE_THRESHOLD = 15

function expandLabel(count: number) {
  return `See all ${count} lines ${CHEVRON_DOWN_ICON}`
}

function initCopyButtons() {
  document.querySelectorAll('pre.astro-code').forEach((pre) => {
    if (pre.closest('.code-block-wrapper') || pre.closest('.code-group')) return

    const wrapper = document.createElement('div')
    wrapper.className = 'code-block-wrapper'
    pre.parentNode?.insertBefore(wrapper, pre)
    wrapper.appendChild(pre)

    const btn = document.createElement('button')
    btn.className = 'code-copy-btn'
    btn.setAttribute('aria-label', 'Copy code')
    btn.setAttribute('data-tooltip', 'Copy')
    btn.innerHTML = COPY_ICON

    btn.addEventListener('click', async () => {
      const code = pre.querySelector('code')?.textContent ?? ''
      await navigator.clipboard.writeText(code)
      btn.innerHTML = CHECK_ICON
      btn.setAttribute('data-tooltip', 'Copied!')
      setTimeout(() => {
        btn.innerHTML = COPY_ICON
        btn.setAttribute('data-tooltip', 'Copy')
      }, 2000)
    })

    wrapper.appendChild(btn)

    const lineCount = pre.querySelectorAll('.line').length
    if (pre.hasAttribute('data-expandable') || lineCount > EXPAND_LINE_THRESHOLD) {
      wrapper.classList.add('is-collapsible')

      const expandBtn = document.createElement('button')
      expandBtn.className = 'code-expand-btn'
      expandBtn.innerHTML = expandLabel(lineCount)

      expandBtn.addEventListener('click', () => {
        const expanded = wrapper.classList.toggle('is-expanded')
        expandBtn.innerHTML = expanded ? `Show fewer lines ${CHEVRON_UP_ICON}` : expandLabel(lineCount)
      })

      wrapper.appendChild(expandBtn)
    }
  })
}

document.addEventListener('DOMContentLoaded', initCopyButtons)
document.addEventListener('astro:page-load', initCopyButtons)
