import { defineProject } from './.dab'

export const name = 'docs-v2'

export default defineProject((ctx) => ({
  distDir: './dist',
  host: `${ctx.env === 'production' ? 'docs.foundation.botpress.cloud' : 'docs.foundation.botpress.dev'}`,
}))
