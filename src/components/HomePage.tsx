import { Card } from './Card'
import { Badge } from './Badge'
import { WebchatCard, IntegrationsCard } from './LinkCard'

export default function HomePage() {
  const openSearch = () => {
    window.dispatchEvent(new CustomEvent('hc:open-search'))
  }

  return (
    <div className="w-full overflow-y-auto">
      <div className="mx-auto flex max-w-[68rem] flex-col flex-wrap gap-8 px-8 md:flex-row lg:px-16 mb-8 lg:mb-0">
        <div className="relative z-10 max-w-3xl pt-8 lg:pt-16 lg:pb-12">
          <h1 className="block text-3xl font-medium tracking-tight text-stone-900 md:text-4xl dark:text-stone-50">
            Documentation
          </h1>
          <div className="mx-auto mt-4 mb-8 text-md text-stone-500 md:text-lg dark:text-stone-400">
            Learn how to use Botpress, the complete AI agent platform.
          </div>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={openSearch}
              className="flex cursor-pointer items-center gap-2 rounded-xl border border-primary bg-primary px-4 py-2 text-[0.9rem] font-medium leading-[130%] text-white transition-all hover:opacity-90 dark:border-primary-dark dark:bg-primary-dark"
            >
              <img
                src="/homepage-assets/bolt-white-transparent-fill.svg"
                alt=""
                className="pointer-events-none h-[0.9em] w-auto"
              />
              <span>Ask AI</span>
            </button>
            <a
              href="https://discord.gg/botpress"
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-[#626762] bg-[#fcfcfc] px-4 py-2 text-center text-[0.9rem] leading-[130%] transition-all dark:bg-[#1a1a1a]"
            >
              Get help
            </a>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-[68rem] flex-col flex-wrap px-8 pb-4 md:flex-row md:gap-8 lg:px-16">
        <div className="md:max-w-[33.333%] md:flex-[1_1_0%]">
          <Card title="ADK" img="/homepage-assets/adk.jpg" cta="Install the CLI" href="/adk/introduction">
            TypeScript library for building AI agents from code <Badge color="blue">Beta</Badge>
          </Card>
        </div>
        <div className="md:max-w-[33.333%] md:flex-[1_1_0%]">
          <Card title="Studio" img="/homepage-assets/studio.jpg" cta="Build an agent" href="/studio/introduction">
            Visual, drag-and-drop interface for building AI agents
          </Card>
        </div>
        <div className="md:max-w-[33.333%] md:flex-[1_1_0%]">
          <Card title="Desk" img="/homepage-assets/desk.jpg" cta="Import your customers" href="/desk/introduction">
            Customer support workspace for human-AI teams
          </Card>
        </div>
      </div>

      <div className="mx-auto mt-4 flex max-w-[68rem] flex-col flex-wrap px-8 md:flex-row md:gap-8 lg:px-16">
        <div className="md:max-w-[50%] md:flex-[1_1_0%]">
          <WebchatCard />
        </div>
        <div className="md:max-w-[50%] md:flex-[1_1_0%]">
          <IntegrationsCard />
        </div>
      </div>
    </div>
  )
}
