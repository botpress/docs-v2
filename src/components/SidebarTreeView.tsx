import { useState } from 'react'
import type { SidebarNode, SidebarCategoryNode } from '../lib/sidebar-types'
import { isPathActive } from '../lib/sidebar-types'

interface Props {
  nodes: SidebarNode[]
  currentPath: string
  textSize?: 'sm' | 'base'
}

function NestedCategory({
  node,
  currentPath,
  textSize = 'sm',
}: {
  node: SidebarCategoryNode
  currentPath: string
  textSize?: 'sm' | 'base'
}) {
  const [expanded, setExpanded] = useState(true)

  return (
    <li>
      <button
        onClick={() => setExpanded((v) => !v)}
        className={`flex w-full cursor-pointer items-center justify-between rounded-md pl-4 pr-2 py-1.5 ${textSize === 'base' ? 'text-base' : 'text-sm'} text-stone-600 transition-colors hover:bg-black/5 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-white/5 dark:hover:text-stone-100`}
      >
        <span>{node.label}</span>
        <svg
          className="h-3 w-3 shrink-0 transition-transform duration-200 ease-out"
          style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <div
        className="grid transition-[grid-template-rows,opacity] duration-200 ease-out"
        style={{
          gridTemplateRows: expanded ? '1fr' : '0fr',
          opacity: expanded ? 1 : 0,
        }}
      >
        <div className="overflow-hidden">
          <ul className="space-y-0.5 pl-3">
            {node.children.map((child) => (
              <ChildNode
                key={child.type === 'article' ? child.href : child.path}
                node={child}
                currentPath={currentPath}
                textSize={textSize}
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
}: {
  node: SidebarNode
  currentPath: string
  textSize?: 'sm' | 'base'
}) {
  if (node.type === 'category') {
    return <NestedCategory node={node} currentPath={currentPath} textSize={textSize} />
  }

  const active = isPathActive(node.href, currentPath)

  return (
    <li>
      <a
        href={node.href}
        className={`flex items-center rounded-md pl-4 pr-2 py-1.5 ${textSize === 'base' ? 'text-base' : 'text-sm'} transition-colors ${
          active
            ? 'hc-nav-active font-medium'
            : 'text-stone-600 hover:bg-black/5 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-white/5 dark:hover:text-stone-100'
        }`}
      >
        {node.title}
      </a>
    </li>
  )
}

export default function SidebarTreeView({ nodes, currentPath, textSize = 'sm' }: Props) {
  const firstCategoryMargin = textSize === 'base' ? 'mt-[1.5rem]' : 'mt-[2rem]'

  return (
    <>
      {nodes.map((node, index) => {
        if (node.type === 'category') {
          return (
            <div key={node.path} className="mb-3">
              <h3
                className={`mb-[.625rem] ${firstCategoryMargin} pl-4 pr-2 ${textSize === 'base' ? 'text-base' : 'text-sm'} font-semibold text-[rgb(22,27,30)] dark:text-[rgb(222,226,230)]`}
              >
                {node.label}
              </h3>
              <ul className="space-y-0.5">
                {node.children.map((child) => (
                  <ChildNode
                    key={child.type === 'article' ? child.href : child.path}
                    node={child}
                    currentPath={currentPath}
                    textSize={textSize}
                  />
                ))}
              </ul>
            </div>
          )
        }

        const active = isPathActive(node.href, currentPath)
        const isFirstNode = index === 0

        return (
          <a
            key={node.href}
            href={node.href}
            className={`flex items-center rounded-md pl-4 pr-2 py-1.5 ${textSize === 'base' ? 'text-base' : 'text-sm'} transition-colors ${isFirstNode ? firstCategoryMargin : ''} ${
              active
                ? 'hc-nav-active font-medium'
                : 'text-stone-600 hover:bg-black/5 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-white/5 dark:hover:text-stone-100'
            }`}
          >
            {node.title}
          </a>
        )
      })}
    </>
  )
}
