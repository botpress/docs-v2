import { getEntry } from 'astro:content'
import type { DynamicCollectionEntry } from '@/bach/content'
import { normalizeEntryId } from '@/bach/utils'

const INTEGRATION_GUIDE_PREFIX = /^integrations\/integration-guides\/(.+)$/

export interface IntegrationHeadingsState {
  hideCards: boolean
  hideTriggers: boolean
  hiddenSlugs: Set<string>
}

export async function getIntegrationHeadingsState(entry: DynamicCollectionEntry): Promise<IntegrationHeadingsState> {
  const match = normalizeEntryId(entry.id).match(INTEGRATION_GUIDE_PREFIX)
  const slug = match ? match[1].replace(/\/introduction$/, '') : null
  const integration = slug ? await getEntry('integrations', slug) : null
  const isIntegrationPage = slug !== null

  const hideCards = isIntegrationPage && Object.keys(integration?.data.actions ?? {}).length === 0
  const hideTriggers = isIntegrationPage && Object.keys(integration?.data.events ?? {}).length === 0

  const hiddenSlugs = new Set<string>()
  if (hideCards) hiddenSlugs.add('cards')
  if (hideTriggers) hiddenSlugs.add('triggers')

  return { hideCards, hideTriggers, hiddenSlugs }
}
