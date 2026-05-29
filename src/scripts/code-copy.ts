import { COPY_ICON, CHECK_ICON } from '@/scripts/code-icons'

const CHEVRON_DOWN = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`
const CHEVRON_UP = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>`

const EXPAND_LINE_THRESHOLD = 15

function expandLabel(count: number) {
  return `See all ${count} lines ${CHEVRON_DOWN}`
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
        expandBtn.innerHTML = expanded ? `Show fewer lines ${CHEVRON_UP}` : expandLabel(lineCount)
      })

      wrapper.appendChild(expandBtn)
    }
  })
}

document.addEventListener('DOMContentLoaded', initCopyButtons)
document.addEventListener('astro:page-load', initCopyButtons)
