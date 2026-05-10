import { Check, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { MODELS } from './config'

interface ModelSelectorProps {
  selectedModel: string
  onModelChange: (model: string) => void
}

export function ModelSelector({ selectedModel, onModelChange }: ModelSelectorProps) {
  const current = MODELS.find((m) => m.id === selectedModel) ?? MODELS[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="sm" aria-label="Select model" className="text-muted-foreground">
            <span>{current.displayName}</span>
            <ChevronDown />
          </Button>
        }
      />
      <DropdownMenuContent align="end" sideOffset={4} className="min-w-48">
        {MODELS.map((model) => {
          const selected = model.id === selectedModel
          return (
            <DropdownMenuItem key={model.id} onClick={() => onModelChange(model.id)}>
              <span className="flex-1">{model.displayName}</span>
              {selected && <Check className="size-3.5" />}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
