import { z } from 'astro/zod'

export const docsSchema = z.object({
  title: z.string(),
  sidebarTitle: z.string().optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  prose: z.boolean().default(true),
})

export type DocsSchema = z.infer<typeof docsSchema>
