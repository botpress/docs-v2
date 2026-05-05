import type { DocsConfig } from './types'
import type { DynamicCollectionEntry, StaticPath } from './content'
import type { SiteContext, PageContext } from './context'
import { getSiteContext, getPageContext } from './context'
import { getStaticPaths } from './content'

export class BachSite<TCollection extends string = string> {
  private _config: DocsConfig<TCollection>
  private _siteContextCache: SiteContext | null = null

  constructor(config: DocsConfig<TCollection>) {
    this._config = config
  }

  /** Build (and cache) the global site context. */
  async getContext(): Promise<SiteContext> {
    if (this._siteContextCache) return this._siteContextCache
    this._siteContextCache = await getSiteContext(this._config)
    return this._siteContextCache
  }

  /** Derive the full page context for a URL path and content entry. */
  async getPageContext(pathname: string, entry: DynamicCollectionEntry): Promise<PageContext> {
    const siteContext = await this.getContext()
    return getPageContext(pathname, entry, siteContext)
  }

  /** Generate Astro `getStaticPaths` entries for all docs collections. */
  async getStaticPaths(options?: {
    /** Collection names to include. Defaults to all referenced collections. */
    collections?: string[]
    /** Whether to include the `index` entry. Defaults to `false`. */
    includeIndex?: boolean
  }): Promise<StaticPath[]> {
    return getStaticPaths(this._config, options)
  }
}
