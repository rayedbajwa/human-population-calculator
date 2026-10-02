import type { Country, Dimension, Source } from '../types'
import { formatPopulation, formatShare } from '../lib/format'
import { indicatorPosition } from '../lib/diversity'
import { DataUnavailable } from './DataUnavailable'

export interface DetailPanelProps {
  country: Country
  sources: Source[]
  onClose: () => void
}

const DIMENSION_ORDER: Dimension[] = ['ethnic', 'linguistic', 'religious']

const DIMENSION_LABELS: Record<Dimension, string> = {
  ethnic: 'Ethnic groups',
  linguistic: 'Languages',
  religious: 'Religions',
}

/** Selected-country detail: population, diversity breakdown and indicator (US1/US2). */
export function DetailPanel({ country, sources, onClose }: DetailPanelProps) {
  const byId = (id: string): Source | undefined => sources.find((source) => source.id === id)
  const populationSource = country.populationSourceId
    ? byId(country.populationSourceId)
    : undefined
  const indicator = country.diversityIndicator
  const hasDiversity = country.diversityBreakdown.length > 0 || indicator != null

  return (
    <section className="pg-card" aria-labelledby="pg-detail-title" data-testid="detail-panel">
      <div className="pg-detail-header">
        <div>
          <h2 id="pg-detail-title" style={{ marginBottom: 0 }}>
            {country.commonName}
          </h2>
          <p className="pg-small pg-muted" style={{ marginTop: 0 }}>
            {country.region}
          </p>
        </div>
        <button
          type="button"
          className="pg-close"
          onClick={onClose}
          aria-label="Close detail panel"
          data-testid="detail-close"
        >
          Close
        </button>
      </div>

      <div data-testid="population-block">
        <h3>Population</h3>
        {country.totalPopulation == null ? (
          <DataUnavailable message="Population data not available" />
        ) : (
          (() => {
            const { exact, short } = formatPopulation(country.totalPopulation)
            return (
              <>
                <p className="pg-figure" data-testid="population-exact" style={{ margin: 0 }}>
                  {exact}
                </p>
                {short && (
                  <p className="pg-muted" data-testid="population-short" style={{ marginTop: 0 }}>
                    ≈ {short}
                  </p>
                )}
                <p className="pg-provenance" data-testid="population-provenance" style={{ marginBottom: 0 }}>
                  Source: {populationSource?.name ?? 'Unknown'} · {country.populationReferenceYear}
                </p>
              </>
            )
          })()
        )}
      </div>

      <div style={{ marginTop: '1rem' }} data-testid="diversity-block">
        <h3>Diversity</h3>
        {!hasDiversity ? (
          <DataUnavailable message="Diversity data not available" />
        ) : (
          <>
            {DIMENSION_ORDER.map((dimension) => {
              const rows = country.diversityBreakdown.filter((row) => row.dimension === dimension)
              if (rows.length === 0) return null
              const first = rows[0]!
              const source = byId(first.sourceId)
              return (
                <div
                  className="pg-breakdown-group"
                  key={dimension}
                  data-testid={`breakdown-${dimension}`}
                >
                  <h4>{DIMENSION_LABELS[dimension]}</h4>
                  <div className="pg-breakdown">
                    {rows.map((row) => (
                      <div className="pg-breakdown-row" key={row.groupName} data-testid="breakdown-row">
                        <span>{row.groupName}</span>
                        <span>{formatShare(row.share)}</span>
                        <span className="pg-bar" aria-hidden="true">
                          <span style={{ width: `${Math.min(100, row.share)}%` }} />
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="pg-provenance">
                    Source: {source?.name ?? 'Unknown'} · {first.referenceYear}
                  </p>
                </div>
              )
            })}

            {indicator && (
              <div className="pg-indicator" data-testid="diversity-indicator" style={{ marginTop: '1rem' }}>
                <h4 style={{ marginBottom: 0 }}>{indicator.name}</h4>
                <p data-testid="indicator-value" style={{ margin: 0 }}>
                  {indicator.value.toFixed(2)}{' '}
                  <span className="pg-muted">
                    (scale {indicator.scaleMin}–{indicator.scaleMax})
                  </span>
                </p>
                <div
                  className="pg-indicator-scale"
                  role="img"
                  aria-label={`Indicator value ${indicator.value} on a scale from ${indicator.scaleMin} to ${indicator.scaleMax}`}
                >
                  <span
                    className="pg-indicator-marker"
                    style={{ left: `${indicatorPosition(indicator) * 100}%` }}
                  />
                </div>
                <p className="pg-provenance" style={{ marginBottom: 0 }}>
                  Source: {byId(indicator.sourceId)?.name ?? 'Unknown'} · {indicator.referenceYear}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}
