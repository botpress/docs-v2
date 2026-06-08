import { defineProject } from './.dab'

export const name = 'docs-v2'

export default defineProject((ctx) => ({
  distDir: './dist',
  host: `docs-v2.foundation.botpress.${ctx.env === 'production' ? 'cloud' : 'dev'}`,
}))
