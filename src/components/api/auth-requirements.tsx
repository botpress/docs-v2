import { Separator } from '@/components/ui/separator'
import { Field } from '@/components/field'
import type { SecurityScheme } from '@/components/api/types'

interface AuthRequirementsProps {
  security?: Record<string, string[]>[]
  securitySchemes?: Record<string, SecurityScheme>
}

function schemeTypeLabel(scheme: SecurityScheme): string {
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
    return 'Bearer authentication header of the form Bearer <token>, where <token> is your auth token.'
  if (scheme.type === 'http' && scheme.scheme === 'basic')
    return 'Pass credentials via Basic authentication in the Authorization header.'
  if (scheme.type === 'apiKey')
    return `Pass the API key in the ${scheme.in || 'header'}${scheme.name ? ` as ${scheme.name}` : ''}.`
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
      {resolvedOptions.map((option, i) =>
        option.map((entry) => {
          const fieldName = entry.scheme.type === 'http' ? 'Authorization' : entry.scheme.name || entry.name
          const typeParts = [schemeTypeLabel(entry.scheme)]
          if (entry.scheme.bearerFormat) typeParts.push(entry.scheme.bearerFormat)

          return (
            <Field key={`${i}-${entry.name}`} name={fieldName} type={typeParts.join(' · ')} required>
              {schemeDescription(entry.scheme)}
              {entry.scopes.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  <span className="text-xs text-stone-500 dark:text-stone-400">Scopes:</span>
                  {entry.scopes.map((scope) => (
                    <code
                      key={scope}
                      className="rounded bg-stone-100 px-1.5 py-0.5 text-xs text-stone-600 dark:bg-stone-800 dark:text-stone-400"
                    >
                      {scope}
                    </code>
                  ))}
                </div>
              )}
            </Field>
          )
        })
      )}
    </div>
  )
}
