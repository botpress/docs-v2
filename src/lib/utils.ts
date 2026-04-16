import { clsx, type ClassValue } from 'clsx'
import type { Badge } from '@/components/ui/badge'
import type { ComponentProps } from 'react'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const badgeVariantForMethod = (method: string): ComponentProps<typeof Badge>['variant'] => {
  switch (method.toLowerCase()) {
    case 'get':
      return 'get'
    case 'post':
      return 'post'
    case 'put':
      return 'put'
    case 'patch':
      return 'patch'
    case 'delete':
      return 'delete'
    default:
      return 'default'
  }
}
