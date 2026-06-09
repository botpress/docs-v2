import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { hasActiveChild, isPathActive } from '@/bach/nav'
import type { SidebarCategoryNode, SidebarNode } from '@/bach/types'
import { ReactIcon } from './ReactIcon'

function TreeIcon({ name }: { name: string }) {
  return <ReactIcon icon={name} className="h-4 w-4 shrink-0 text-primary" />
}

function SidebarIcon({ node }: { node: { icon?: string; iconUrl?: string } }) {
  if (node.iconUrl) {
    return <img src={node.iconUrl} alt="" className="h-4 w-4 shrink-0 rounded-sm object-contain" />
  }
  if (node.icon) {
    return <TreeIcon name={node.icon} />
  }
  return null
}

function SidebarMethodBadge({ method }: { method: string }) {
  return (
    <Badge
      variant={method.toLowerCase() as 'get' | 'post' | 'put' | 'patch' | 'delete'}
      className={cn('ml-auto shrink-0 rounded px-1.5 py-0.5 text-[10px] leading-none')}
    >
      {method}
    </Badge>
  )
}

/** Progressive indentation for nested sidebar items. */
const PAD = ['pl-2', 'pl-5', 'pl-8', 'pl-11'] as const

interface Props {
  nodes: SidebarNode[]
  currentPath: string
  textSize?: 'sm' | 'base'
}

function NestedCategory({
  node,
  currentPath,
  textSize = 'sm',
  depth = 0,
}: {
  node: SidebarCategoryNode
  currentPath: string
  textSize?: 'sm' | 'base'
  depth?: number
}) {
  const selfActive = !!node.href && isPathActive(node.href, currentPath)
  const childActive = hasActiveChild(node, currentPath)
  const [expanded, setExpanded] = useState(selfActive || childActive)

  const chevron = (
    <svg
      className="h-3 w-3 shrink-0 transition-transform duration-200 ease-out"
      style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
    </svg>
  )

  const pad = PAD[depth] ?? PAD[PAD.length - 1]
  const labelClass = `flex w-full items-center justify-between rounded-md ${pad} pr-2 py-1.5 ${textSize === 'base' ? 'text-base' : 'text-sm'} transition-colors`

  return (
    <li>
      {node.href ? (
        <a
          href={node.href}
          onClick={() => setExpanded(true)}
          className={`${labelClass} ${
            selfActive
              ? 'text-primary bg-primary/10 dark:bg-primary/15 font-medium'
              : 'text-stone-600 hover:bg-black/5 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-white/5 dark:hover:text-stone-100'
          }`}
        >
          <span className="flex items-center gap-2">
            {node.icon && <TreeIcon name={node.icon} />}
            {node.label}
          </span>
          <span
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setExpanded((v) => !v)
            }}
            className="cursor-pointer p-1 -m-1"
          >
            {chevron}
          </span>
        </a>
      ) : (
        <button
          onClick={() => setExpanded((v) => !v)}
          className={`${labelClass} cursor-pointer text-stone-600 hover:bg-black/5 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-white/5 dark:hover:text-stone-100`}
        >
          <span className="flex items-center gap-2">
            {node.icon && <TreeIcon name={node.icon} />}
            {node.label}
          </span>
          {chevron}
        </button>
      )}

      <div
        className="grid pt-0.5 transition-[grid-template-rows,opacity] duration-200 ease-out"
        style={{
          gridTemplateRows: expanded ? '1fr' : '0fr',
          opacity: expanded ? 1 : 0,
        }}
      >
        <div className="overflow-hidden">
          <ul className="space-y-0.5">
            {node.children.map((child) => (
              <ChildNode
                key={child.type === 'article' ? child.href : child.path}
                node={child}
                currentPath={currentPath}
                textSize={textSize}
                depth={depth + 1}
              />
            ))}
          </ul>
        </div>
      </div>
    </li>
  )
}

function ChildNode({
  node,
  currentPath,
  textSize = 'sm',
  depth = 0,
}: {
  node: SidebarNode
  currentPath: string
  textSize?: 'sm' | 'base'
  depth?: number
}) {
  if (node.type === 'category') {
    return <NestedCategory node={node} currentPath={currentPath} textSize={textSize} depth={depth} />
  }

  const active = isPathActive(node.href, currentPath)
  const pad = PAD[depth] ?? PAD[PAD.length - 1]
  const activeLine =
    depth >= 1
      ? ' relative before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-px before:bg-primary'
      : ''

  return (
    <li>
      <a
        href={node.href}
        className={`flex items-center gap-2 rounded-md ${pad} pr-2 py-1.5 ${textSize === 'base' ? 'text-base' : 'text-sm'} transition-colors ${
          active
            ? `text-primary bg-primary/10 dark:bg-primary/15 font-medium${activeLine}`
            : 'text-stone-600 hover:bg-black/5 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-white/5 dark:hover:text-stone-100'
        }`}
      >
        <SidebarIcon node={node} />
        <span className="min-w-0 truncate">{node.sidebarTitle ?? node.title}</span>
        {node.method && <SidebarMethodBadge method={node.method} />}
      </a>
    </li>
  )
}

export default function SidebarTreeView({ nodes, currentPath, textSize = 'sm' }: Props) {
  return (
    <>
      {nodes.map((node) => {
        if (node.type === 'category') {
          return (
            <div key={node.path} className="mb-8">
              <h3
                className={`mb-[.625rem] flex items-center gap-2 pl-2 pr-2 ${textSize === 'base' ? 'text-base' : 'text-sm'} font-semibold text-[rgb(22,27,30)] dark:text-[rgb(222,226,230)]`}
              >
                {node.icon && <TreeIcon name={node.icon} />}
                {node.label}
              </h3>
              <ul className="space-y-0.5">
                {node.children.map((child) => (
                  <ChildNode
                    key={child.type === 'article' ? child.href : child.path}
                    node={child}
                    currentPath={currentPath}
                    textSize={textSize}
                    depth={0}
                  />
                ))}
              </ul>
            </div>
          )
        }

        return (
          <ul key={node.href} className="mb-8 space-y-0.5">
            <ChildNode node={node} currentPath={currentPath} textSize={textSize} depth={0} />
          </ul>
        )
      })}
    </>
  )
}
