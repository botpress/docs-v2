export interface NavbarLink {
  label: string
  href: string
  type?: 'link' | 'button'
  external?: boolean
}

export const siteConfig = {
  name: 'Docs',
  logo: '/logo/light.svg',
  logoDark: '/logo/dark.svg',
  primaryColor: '#5054A8',
  darkModePrimaryColor: '#7B7FD1',
  navbar: {
    links: [{ label: 'Dashboard', href: 'https://app.botpress.cloud', type: 'button', external: true }] as NavbarLink[],
  },
} as const
