export interface SelectionState {
  selectedCode: string | null
  query: string
}

const STORAGE_KEY = 'population-globe:selection'

const EMPTY: SelectionState = { selectedCode: null, query: '' }

/**
 * Session-scoped selection/query persistence (FR-013). Degrades gracefully when
 * `sessionStorage` is unavailable (private mode, SSR, tests).
 */
export function loadSelection(): SelectionState {
  try {
    const raw = globalThis.sessionStorage?.getItem(STORAGE_KEY)
    if (!raw) return { ...EMPTY }
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return { ...EMPTY }
    const record = parsed as Record<string, unknown>
    return {
      selectedCode: typeof record.selectedCode === 'string' ? record.selectedCode : null,
      query: typeof record.query === 'string' ? record.query : '',
    }
  } catch {
    return { ...EMPTY }
  }
}

export function saveSelection(state: SelectionState): void {
  try {
    globalThis.sessionStorage?.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* persistence is best-effort */
  }
}
