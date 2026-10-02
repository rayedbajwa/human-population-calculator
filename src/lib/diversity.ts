import type { Country, DiversityIndicator, PopulationBucket } from '../types'

/** Colour-blind-safe sequential palette. Mirrors `src/styles/tokens.css`. */
export const NO_DATA_COLOR = '#9aa4ad'

export const POPULATION_BUCKETS: PopulationBucket[] = [
  { min: 0, max: 1_000_000, color: '#c7e9c0', label: 'Under 1M' },
  { min: 1_000_000, max: 10_000_000, color: '#a1d99b', label: '1M – 10M' },
  { min: 10_000_000, max: 50_000_000, color: '#74c476', label: '10M – 50M' },
  { min: 50_000_000, max: 100_000_000, color: '#41ab5d', label: '50M – 100M' },
  { min: 100_000_000, max: 500_000_000, color: '#238b45', label: '100M – 500M' },
  { min: 500_000_000, max: null, color: '#005a32', label: 'Over 500M' },
]

export const NO_DATA_LABEL = 'No data'

/**
 * Return the bucket a population falls into, or `null` when there is no data.
 * A `null` population is never coerced to zero (FR-008).
 */
export function populationBucket(
  population: number | null,
  buckets: PopulationBucket[] = POPULATION_BUCKETS,
): PopulationBucket | null {
  if (population == null || !Number.isFinite(population) || population < 0) return null
  for (const bucket of buckets) {
    if (population >= bucket.min && (bucket.max == null || population < bucket.max)) {
      return bucket
    }
  }
  return buckets.length > 0 ? buckets[buckets.length - 1]! : null
}

/**
 * Position of an indicator value within its published scale, clamped to 0..1.
 * Guards against a degenerate scale (`min === max`) instead of dividing by zero.
 */
export function indicatorPosition(indicator: DiversityIndicator): number {
  const span = indicator.scaleMax - indicator.scaleMin
  if (!Number.isFinite(span) || span <= 0) return 0
  const ratio = (indicator.value - indicator.scaleMin) / span
  return Math.min(1, Math.max(0, ratio))
}

/** Count of countries in the snapshot that have a population figure. */
export function countriesWithPopulation(countries: Country[]): number {
  return countries.filter((c) => c.totalPopulation != null).length
}
