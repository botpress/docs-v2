import { withBase } from '@/bach/utils'

export interface NavbarLink {
  label: string
  href: string
  type?: 'link' | 'button'
  external?: boolean
}

export const siteConfig = {
  name: 'Docs',
  logo: withBase('/logo/light.svg'),
  logoDark: withBase('/logo/dark.svg'),
  navbar: {
    links: [{ label: 'Dashboard', href: 'https://app.botpress.cloud', type: 'button', external: true }] as NavbarLink[],
  },
} as const
