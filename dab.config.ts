import * as dab from '@botpress-private/dab'
import * as d from './.dab/index'

export const name = 'docs'
export const state = dab.defineState({
  type: 'local',
  path: 'dab/state',
})

export default d.defineApp(() => ({
  distDir: './dist',
}))
