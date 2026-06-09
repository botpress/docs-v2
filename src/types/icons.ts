import type lucide from '@iconify-json/lucide/icons.json'
import type simpleIcons from '@iconify-json/simple-icons/icons.json'

type LucideKey = keyof (typeof lucide)['icons']
type SimpleIconKey = keyof (typeof simpleIcons)['icons']

export type IconName = `lucide:${LucideKey}` | LucideKey | `simple-icons:${SimpleIconKey}`
