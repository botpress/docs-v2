export interface ApiSource {
  slug: string
  label: string
}

export interface PackageApiSource extends ApiSource {
  api: { exportOpenapi: (dir: string) => void }
  key: string
}

export interface StaticApiSource extends ApiSource {
  file: string
}

export interface ApiEntryData {
  title: string
  description?: string
  method: string
  apiSlug: string
  apiLabel: string
  sortOrder: number
  endpoint: import('../schemas/api').Endpoint
}
