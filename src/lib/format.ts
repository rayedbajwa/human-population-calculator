/**
 * Population and share formatting (FR-011).
 * Pure functions — no DOM, no formatting locale surprises beyond en-US.
 */

export interface FormattedPopulation {
  exact: string
  short: string | null
}

const SHORT_UNITS: ReadonlyArray<readonly [number, string]> = [
  [1_000_000_000_000, 'T'],
  [1_000_000_000, 'B'],
  [1_000_000, 'M'],
]

function formatShort(n: number): string {
  for (const [value, suffix] of SHORT_UNITS) {
    if (n >= value) {
      const scaled = n / value
      const rendered = scaled.toFixed(1).replace(/\.0$/, '')
      return `${rendered}${suffix}`
    }
  }
  return String(n)
}

export function formatPopulation(n: number): FormattedPopulation {
  if (!Number.isFinite(n) || n < 0) {
    throw new RangeError('Population must be a finite, non-negative number')
  }
  const exact = Math.round(n).toLocaleString('en-US')
  return { exact, short: n > 1_000_000 ? formatShort(n) : null }
}

export function formatShare(share: number): string {
  if (!Number.isFinite(share) || share < 0 || share > 100) {
    throw new RangeError('Share must be a finite number between 0 and 100')
  }
  const rounded = Math.round(share * 10) / 10
  return `${String(rounded)}%`
}
