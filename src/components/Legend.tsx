import type { PopulationBucket } from '../types'

export interface LegendProps {
  buckets: PopulationBucket[]
  noDataLabel: string
  noDataColor?: string
}

/** Population shading legend with a distinct no-data swatch (FR-002). */
export function Legend({ buckets, noDataLabel, noDataColor = '#9aa4ad' }: LegendProps) {
  return (
    <section className="pg-card" aria-labelledby="pg-legend-title" data-testid="legend">
      <h2 id="pg-legend-title" style={{ fontSize: '1rem' }}>
        Population
      </h2>
      <div className="pg-legend-swatches">
        {buckets.map((bucket) => (
          <div className="pg-legend-item" key={bucket.label} data-testid="legend-item">
            <span
              className="pg-swatch"
              style={{ backgroundColor: bucket.color }}
              aria-hidden="true"
            />
            <span className="pg-small">{bucket.label}</span>
          </div>
        ))}
        <div className="pg-legend-item" data-testid="legend-no-data">
          <span
            className="pg-swatch"
            style={{ backgroundColor: noDataColor }}
            aria-hidden="true"
          />
          <span className="pg-small">{noDataLabel}</span>
        </div>
      </div>
    </section>
  )
}
