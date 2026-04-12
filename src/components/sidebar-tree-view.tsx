import { useState } from 'react'
import type { SidebarNode, SidebarCategoryNode, SidebarArticleNode } from '../lib/sidebar-types'
import { isPathActive, hasActiveChild } from '../lib/sidebar-types'

const SIDEBAR_METHOD_COLORS: Record<string, string> = {
  GET: 'text-emerald-600 dark:text-emerald-400',
  POST: 'text-blue-600 dark:text-blue-400',
  PUT: 'text-amber-600 dark:text-amber-400',
  PATCH: 'text-orange-600 dark:text-orange-400',
  DELETE: 'text-red-600 dark:text-red-400',
}

function SidebarMethodBadge({ method }: { method: string }) {
  return (
    <span
      className={`ml-auto shrink-0 font-mono text-[10px] font-semibold leading-none ${SIDEBAR_METHOD_COLORS[method] || 'text-stone-400'}`}
    >
      {method}
    </span>
  )
}

interface Props {
  nodes: SidebarNode[]
  currentPath: string
  textSize?: 'sm' | 'base'
}

function NestedCategory({
  node,
  currentPath,
  textSize = 'sm',
  nested = false,
}: {
  node: SidebarCategoryNode
  currentPath: string
  textSize?: 'sm' | 'base'
  nested?: boolean
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

  const labelClass = `flex w-full items-center justify-between rounded-md ${nested ? 'pl-3' : 'pl-2'} pr-2 py-1.5 ${textSize === 'base' ? 'text-base' : 'text-sm'} transition-colors`

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
          <span>{node.label}</span>
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
          <span>{node.label}</span>
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
          <ul className="relative space-y-0.5 before:absolute before:left-2.5 before:top-0.5 before:bottom-1 before:w-px before:bg-stone-300 dark:before:bg-stone-700">
            {node.children.map((child) => (
              <ChildNode
                key={child.type === 'article' ? child.href : child.path}
                node={child}
                currentPath={currentPath}
                textSize={textSize}
                nested
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
  nested = false,
}: {
  node: SidebarNode
  currentPath: string
  textSize?: 'sm' | 'base'
  nested?: boolean
}) {
  if (node.type === 'category') {
    return <NestedCategory node={node} currentPath={currentPath} textSize={textSize} nested={nested} />
  }

  const active = isPathActive(node.href, currentPath)

  return (
    <li>
      <a
        href={node.href}
        className={`flex items-center rounded-md ${nested ? 'pl-5' : 'pl-2'} pr-2 py-1.5 ${textSize === 'base' ? 'text-base' : 'text-sm'} transition-colors ${
          active
            ? `text-primary bg-primary/10 dark:bg-primary/15 font-medium${nested ? ' relative before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-px before:bg-primary' : ''}`
            : 'text-stone-600 hover:bg-black/5 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-white/5 dark:hover:text-stone-100'
        }`}
      >
        <span className="min-w-0 truncate">{node.title}</span>
        {node.method && <SidebarMethodBadge method={node.method} />}
      </a>
    </li>
  )
}

export default function SidebarTreeView({ nodes, currentPath, textSize = 'sm' }: Props) {
  return (
    <>
      {nodes.map((node, index) => {
        if (node.type === 'category') {
          return (
            <div key={node.path} className="mb-8">
              <h3
                className={`mb-[.625rem] pl-2 pr-2 ${textSize === 'base' ? 'text-base' : 'text-sm'} font-semibold text-[rgb(22,27,30)] dark:text-[rgb(222,226,230)]`}
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

        return (
          <a
            key={node.href}
            href={node.href}
            className={`flex items-center rounded-md pl-4 pr-2 py-1.5 ${textSize === 'base' ? 'text-base' : 'text-sm'} transition-colors ${
              active
                ? 'text-primary bg-primary/10 dark:bg-primary/15 font-medium'
                : 'text-stone-600 hover:bg-black/5 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-white/5 dark:hover:text-stone-100'
            }`}
          >
            <span className="min-w-0 truncate">{node.title}</span>
            {node.method && <SidebarMethodBadge method={node.method} />}
          </a>
        )
      })}
    </>
  )
}
