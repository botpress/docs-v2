export const name = 'docs-v2'

import { defineProject } from './.dab'

export default defineProject((ctx) => ({
  distDir: './dist',
  host: `docs-v2.foundation.botpress.${ctx.env === 'production' ? 'cloud' : 'dev'}`,
}))
