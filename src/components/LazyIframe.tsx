import { useEffect, useRef } from 'react'

interface LazyIframeProps {
  src: string
  title: string
  height?: string
  className?: string
}

function LazyIframe({ src, title, height = '500px', className }: LazyIframeProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    const wrapper = wrapperRef.current
    const iframe = iframeRef.current
    if (!wrapper || !iframe) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !iframe.src) {
            iframe.src = src
            observer.unobserve(wrapper)
          }
        })
      },
      { rootMargin: '200px' }
    )

    if (!iframe.src) {
      observer.observe(wrapper)
    }

    return () => observer.disconnect()
  }, [src])

  return (
    <div ref={wrapperRef} style={{ height }}>
      <iframe
        ref={iframeRef}
        title={title}
        className={`w-full rounded-xl h-full ${className ?? ''}`}
        style={{ border: 'none' }}
      />
    </div>
  )
}

export { LazyIframe }
export type { LazyIframeProps }
