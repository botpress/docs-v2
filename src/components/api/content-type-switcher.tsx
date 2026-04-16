import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface ContentTypeSwitcherProps {
  types: string[]
  value: string
  onChange: (value: string) => void
}

export default function ContentTypeSwitcher({ types, value, onChange }: ContentTypeSwitcherProps) {
  if (types.length <= 1) return null

  return (
    <Select
      value={value}
      onValueChange={(v) => {
        if (v) onChange(v)
      }}
    >
      <SelectTrigger size="sm" className="h-6 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {types.map((t) => (
          <SelectItem key={t} value={t}>
            {t}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
