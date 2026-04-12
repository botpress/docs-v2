import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Lock } from 'lucide-react'
import type { SecurityScheme } from './types'

interface AuthRequirementsProps {
  security?: Record<string, string[]>[]
  securitySchemes?: Record<string, SecurityScheme>
}

function schemeLabel(scheme: SecurityScheme): string {
  if (scheme.type === 'http' && scheme.scheme === 'bearer') return 'Bearer'
  if (scheme.type === 'http' && scheme.scheme === 'basic') return 'Basic'
  if (scheme.type === 'apiKey') return 'API Key'
  if (scheme.type === 'oauth2') return 'OAuth 2.0'
  if (scheme.type === 'openIdConnect') return 'OpenID Connect'
  return scheme.type
}

function schemeDescription(scheme: SecurityScheme): string {
  if (scheme.description) return scheme.description
  if (scheme.type === 'http' && scheme.scheme === 'bearer')
    return `Bearer authentication header of the form \`Bearer <token>\`, where \`<token>\` is your auth token.`
  if (scheme.type === 'http' && scheme.scheme === 'basic')
    return 'Pass credentials via Basic authentication in the Authorization header.'
  if (scheme.type === 'apiKey')
    return `Pass the API key in the ${scheme.in || 'header'}${scheme.name ? ` as \`${scheme.name}\`` : ''}.`
  return ''
}

export default function AuthRequirements({ security, securitySchemes }: AuthRequirementsProps) {
  if (!security || security.length === 0 || !securitySchemes) return null

  const resolvedOptions = security
    .map((req) => {
      const entries = Object.entries(req)
      if (entries.length === 0) return null
      return entries
        .map(([schemeName, scopes]) => {
          const scheme = securitySchemes[schemeName]
          if (!scheme) return null
          return { name: schemeName, scheme, scopes }
        })
        .filter(Boolean) as { name: string; scheme: SecurityScheme; scopes: string[] }[]
    })
    .filter((opt) => opt && opt.length > 0) as { name: string; scheme: SecurityScheme; scopes: string[] }[][]

  if (resolvedOptions.length === 0) return null

  return (
    <div>
      <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-100">Authorization</h2>
      <Separator className="my-3" />
      <div className="rounded-lg border border-stone-200 dark:border-stone-700">
        {resolvedOptions.map((option, i) => (
          <div
            key={i}
            className={`px-4 py-3 ${i < resolvedOptions.length - 1 ? 'border-b border-stone-200 dark:border-stone-700' : ''}`}
          >
            {option.map((entry) => (
              <div key={entry.name} className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Lock className="h-3.5 w-3.5 text-stone-400" />
                  <code className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                    {entry.scheme.type === 'http' ? 'Authorization' : entry.scheme.name || entry.name}
                  </code>
                  <Badge variant="info">{schemeLabel(entry.scheme)}</Badge>
                  <Badge variant="required">required</Badge>
                  {entry.scheme.bearerFormat && <Badge variant="info">format: {entry.scheme.bearerFormat}</Badge>}
                </div>
                <p className="text-sm text-stone-600 dark:text-stone-400">{schemeDescription(entry.scheme)}</p>
                {entry.scopes.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    <span className="text-xs text-stone-500 dark:text-stone-400">Scopes:</span>
                    {entry.scopes.map((scope) => (
                      <Badge key={scope} variant="info">
                        {scope}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
