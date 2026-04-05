import type { CSSProperties } from 'react'

const ICONS_CDN_URL = 'https://d3gk2c5xim1je2.cloudfront.net'

interface IconProps {
  icon: string
  size?: number
  color?: string
  className?: string
}

export function Icon({ icon, size = 16, color, className }: IconProps) {
  const url = `${ICONS_CDN_URL}/lucide/v0.545.0/${icon.toLowerCase()}.svg`

  const style: CSSProperties = {
    width: size,
    height: size,
    display: 'inline-block',
    verticalAlign: 'middle',
    WebkitMaskImage: `url(${url})`,
    WebkitMaskRepeat: 'no-repeat',
    WebkitMaskPosition: 'center',
    WebkitMaskSize: '100%',
    maskImage: `url(${url})`,
    maskRepeat: 'no-repeat',
    maskPosition: 'center',
    maskSize: '100%',
    backgroundColor: color || 'currentColor',
  }

  return <svg className={['inline', className].filter(Boolean).join(' ')} style={style} />
}
