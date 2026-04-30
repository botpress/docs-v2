import type { PageItem, PackageApiConfig, StaticApiConfig } from '../types'

export interface ApiLoaderConfig {
  packageApis: PackageApiConfig[]
  staticApis: StaticApiConfig[]
}

function collectFromPages(pages: PageItem[], result: ApiLoaderConfig) {
  for (const item of pages) {
    if (typeof item === 'string') continue
    if (item.openapi) {
      if ('api' in item.openapi) {
        result.packageApis.push(item.openapi)
      } else {
        result.staticApis.push(item.openapi)
      }
    }
    collectFromPages(item.pages, result)
  }
}

export function collectApiConfigs(config: { navigation: { tabs: Array<{ pages: PageItem[] }> } }): ApiLoaderConfig {
  const result: ApiLoaderConfig = { packageApis: [], staticApis: [] }
  for (const tab of config.navigation.tabs) {
    collectFromPages(tab.pages, result)
  }
  return result
}
