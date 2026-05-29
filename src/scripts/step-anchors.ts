function initStepAnchors() {
  document.querySelectorAll('a.step-anchor').forEach((anchor) => {
    anchor.addEventListener('click', async (e) => {
      e.preventDefault()
      const href = anchor.getAttribute('href')
      if (!href) return
      history.pushState(null, '', href)
      const target = document.querySelector(href)
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      try {
        await navigator.clipboard.writeText(window.location.href)
      } catch {
        // clipboard access denied
      }
    })
  })
}

document.addEventListener('DOMContentLoaded', initStepAnchors)
document.addEventListener('astro:page-load', initStepAnchors)
