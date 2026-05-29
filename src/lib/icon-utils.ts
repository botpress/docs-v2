export function toPascalCase(name: string): string {
  return name
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('')
}

export function toLucideKebab(name: string): string {
  return name.replace(/([a-z])([A-Z0-9])/g, '$1-$2').toLowerCase()
}
