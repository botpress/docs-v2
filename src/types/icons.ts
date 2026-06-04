import type lucide from '@iconify-json/lucide/icons.json'

type LucideKey = keyof (typeof lucide)['icons']

export type IconName = `lucide:${LucideKey}` | LucideKey
