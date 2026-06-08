export interface NavbarLink {
  label: string
  href: string
  type?: 'link' | 'button'
  external?: boolean
}

export const siteConfig = {
  name: 'Docs',
  logo: '/docs/logo/light.svg',
  logoDark: '/docs/logo/dark.svg',
  navbar: {
    links: [{ label: 'Dashboard', href: 'https://app.botpress.cloud', type: 'button', external: true }] as NavbarLink[],
  },
} as const
