import { createDefineProject } from '@botpress-private/dab'
import type { ProjectConfigFor } from '@botpress-private/dab'
import type { SyncedProjectContext } from './types.js'

const baseDefineProject = createDefineProject('static-site')

type ExpectedConfig = ProjectConfigFor<'static-site'>

// Type helper to check for excess properties
type ExactConfig<T extends ExpectedConfig> =
  Exclude<keyof T, keyof ExpectedConfig> extends never
    ? T
    : { ERROR: 'Unexpected properties'; got: Exclude<keyof T, keyof ExpectedConfig> }

/**
 * Define your static-site configuration with precise types for provisions, variables, and secrets
 */
export function defineProject<T extends ExpectedConfig>(
  definer: (ctx: SyncedProjectContext) => ExactConfig<T>
): ReturnType<typeof baseDefineProject> {
  return baseDefineProject((ctx) => definer(ctx as SyncedProjectContext) as ExpectedConfig)
}
