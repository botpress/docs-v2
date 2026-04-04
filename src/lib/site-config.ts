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
    links: [] as NavbarLink[],
  },
} as const
