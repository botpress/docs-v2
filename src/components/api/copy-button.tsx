import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Check, Copy } from 'lucide-react'

interface CopyButtonProps {
  text: string
}

export default function CopyButton({ text }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <Button
      variant="outline"
      size="icon-xs"
      onClick={handleCopy}
      className="absolute top-2 right-2 opacity-0 transition-opacity group-hover/code-card:opacity-100 focus:opacity-100"
      title="Copy to clipboard"
    >
      {copied ? <Check /> : <Copy />}
    </Button>
  )
}
