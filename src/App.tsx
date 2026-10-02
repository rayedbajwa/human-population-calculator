import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import type { AppState } from './types'
import { countryByCode, loadSnapshot } from './lib/dataset'
import { POPULATION_BUCKETS, NO_DATA_LABEL } from './lib/diversity'
import { loadSelection, saveSelection } from './lib/persistence'
import { SearchBox } from './components/SearchBox'
import { Legend } from './components/Legend'
import { DetailPanel } from './components/DetailPanel'
import { InteractionHint } from './components/InteractionHint'
import { ErrorState } from './components/ErrorState'

function initialState(): AppState {
  const restored = loadSelection()
  return {
    snapshot: null,
    status: 'loading',
    selectedCode: restored.selectedCode,
    query: restored.query,
    hintDismissed: false,
    error: null,
  }
}

const GlobeView = lazy(() =>
  import('./components/GlobeView').then((module) => ({ default: module.GlobeView })),
)

export default function App() {
  const [state, setState] = useState<AppState>(initialState)
  const [reducedMotion, setReducedMotion] = useState(false)

  const load = useCallback(async () => {
    setState((prev) => ({ ...prev, status: 'loading', error: null }))
    try {
      const snapshot = await loadSnapshot()
      setState((prev) => ({ ...prev, snapshot, status: 'ready', error: null }))
    } catch (error) {
      setState((prev) => ({
        ...prev,
        status: 'error',
        error: error instanceof Error ? error.message : 'An unknown error occurred.',
      }))
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (state.status !== 'ready') return
    saveSelection({ selectedCode: state.selectedCode, query: state.query })
  }, [state.status, state.selectedCode, state.query])

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  const selectCountry = useCallback((code: string) => {
    setState((prev) => ({ ...prev, selectedCode: code, hintDismissed: true }))
  }, [])

  const chooseCountry = useCallback((code: string) => {
    setState((prev) => ({ ...prev, selectedCode: code, query: '', hintDismissed: true }))
  }, [])

  const closeDetail = useCallback(() => {
    setState((prev) => ({ ...prev, selectedCode: null }))
  }, [])

  if (state.status === 'loading' && !state.snapshot) {
    return (
      <main className="pg-loading" aria-live="polite">
        Loading population data…
      </main>
    )
  }

  if (state.status === 'error') {
    return (
      <main className="pg-app">
        <ErrorState message={state.error ?? 'Could not load data.'} onRetry={() => void load()} />
      </main>
    )
  }

  const snapshot = state.snapshot
  if (!snapshot) {
    return (
      <main className="pg-app">
        <ErrorState message="Could not load data." onRetry={() => void load()} />
      </main>
    )
  }

  const selected = state.selectedCode ? countryByCode(snapshot, state.selectedCode) : undefined

  return (
    <div className="pg-app">
      <header className="pg-header">
        <h1 className="pg-title">
          Population <span>Globe</span>
        </h1>
        <SearchBox
          countries={snapshot.countries}
          query={state.query}
          onQueryChange={(query) => setState((prev) => ({ ...prev, query }))}
          onChoose={chooseCountry}
        />
      </header>

      <main className="pg-main">
        <div style={{ position: 'relative', minWidth: 0 }}>
          <Suspense fallback={<div className="pg-loading">Loading globe…</div>}>
            <GlobeView
              countries={snapshot.countries}
              selectedCode={state.selectedCode}
              onSelect={selectCountry}
              onHover={() => undefined}
              reducedMotion={reducedMotion}
            />
          </Suspense>
          {!state.hintDismissed && (
            <InteractionHint
              onDismiss={() => setState((prev) => ({ ...prev, hintDismissed: true }))}
            />
          )}
        </div>

        <aside className="pg-sidebar">
          <Legend buckets={POPULATION_BUCKETS} noDataLabel={NO_DATA_LABEL} />
          {selected && (
            <DetailPanel country={selected} sources={snapshot.sources} onClose={closeDetail} />
          )}
        </aside>
      </main>
    </div>
  )
}
