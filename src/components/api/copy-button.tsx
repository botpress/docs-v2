import { Button } from '@/components/ui/button'
import { Check, Copy } from 'lucide-react'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'

export default function CopyButton({ text }: { text: string }) {
  const { copied, copy } = useCopyToClipboard()

  return (
    <Button
      variant="outline"
      size="icon-xs"
      onClick={() => copy(text)}
      className="absolute top-2 right-2 opacity-0 transition-opacity group-hover/code-card:opacity-100 focus:opacity-100"
      title="Copy to clipboard"
    >
      {copied ? <Check /> : <Copy />}
    </Button>
  )
}
