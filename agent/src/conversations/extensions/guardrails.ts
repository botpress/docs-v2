export function makeGuardrails(onSearch?: () => void | Promise<void>) {
  let hasSearched = false

  return {
    onBeforeTool: async ({ tool }: { tool: { name: string } }) => {
      if (tool.name === 'search_knowledge') {
        hasSearched = true
        if (onSearch) await onSearch()
      }
    },
    onExit: async ({ exit }: { exit?: { name?: string } }) => {
      if (!hasSearched && exit?.name === 'answer') {
        throw new Error(
          'Knowledge search is required for this question but was not performed. Use the search_knowledge tool before answering.'
        )
      }
    },
  }
}
