import { atom, map } from 'nanostores'

export interface ContextItem {
  title: string
  path: string
}

export interface PageInfo {
  path: string
  title: string
}

const PANEL_OPEN_KEY = 'docs-assistant-panel-open'
const PANEL_WIDTH_KEY = 'docs-assistant-panel-width'

export const DEFAULT_PANEL_WIDTH = 30
export const MIN_PANEL_WIDTH = 25
export const MAX_PANEL_WIDTH = 40

// Always start `false` so the first client render matches SSR. The actual
// stored value is hydrated from localStorage inside a `useEffect` (see
// `hydratePanelFromStorage`) which runs after hydration finishes.
export const panelOpen = atom<boolean>(false)

export const hydratePanelFromStorage = () => {
  if (typeof window === 'undefined') return
  try {
    if (window.localStorage.getItem(PANEL_OPEN_KEY) === '1') panelOpen.set(true)
  } catch {}
}

panelOpen.listen((value) => {
  if (typeof window === 'undefined') return
  try {
    if (value) window.localStorage.setItem(PANEL_OPEN_KEY, '1')
    else window.localStorage.removeItem(PANEL_OPEN_KEY)
  } catch {}
})

export function getPanelWidth(): number {
  if (typeof window === 'undefined') return DEFAULT_PANEL_WIDTH
  try {
    const raw = window.localStorage.getItem(PANEL_WIDTH_KEY)
    if (raw === null) return DEFAULT_PANEL_WIDTH
    const parsed = parseFloat(raw)
    if (isNaN(parsed)) return DEFAULT_PANEL_WIDTH
    if (parsed > 100) return DEFAULT_PANEL_WIDTH
    return Math.max(MIN_PANEL_WIDTH, Math.min(MAX_PANEL_WIDTH, parsed))
  } catch {
    return DEFAULT_PANEL_WIDTH
  }
}

export function setPanelWidth(width: number): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(PANEL_WIDTH_KEY, String(Math.max(MIN_PANEL_WIDTH, Math.min(MAX_PANEL_WIDTH, width))))
  } catch {}
}

export const currentPage = map<PageInfo>({ path: '', title: '' })

export const pendingMessage = atom<string | null>(null)

export const pendingContext = atom<ContextItem | null>(null)

export const composerRef: { current: HTMLTextAreaElement | null } = {
  current: null,
}

export const focusComposer = () => {
  setTimeout(() => composerRef.current?.focus(), 50)
}

export const openPanel = () => {
  panelOpen.set(true)
}

export const closePanel = () => {
  panelOpen.set(false)
}

export const togglePanel = () => {
  panelOpen.set(!panelOpen.get())
}

export const askAI = (page: PageInfo) => {
  pendingContext.set(page)
  openPanel()
  focusComposer()
}
