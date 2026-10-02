import { describe, expect, it } from 'vitest'
import snapshotJson from '../../data/snapshot.json'
import { parseSnapshot } from '../../src/lib/dataset'
import type { Dimension } from '../../src/types'
import { DIMENSION_TOTAL_MAX, DIMENSION_TOTAL_MIN } from '../../scripts/factbook-shares'

/**
 * Data-quality gate over the committed snapshot (review finding: gross
 * share-sum deviations were only warnings, so an incomplete composition could
 * ship silently). The generator now drops implausible dimensions, and this
 * test fails if one ever reaches the snapshot — including the cases the
 * code review named (RUS/religious = 2.0%, IRQ/ethnic = "other 5%").
 */
describe('committed snapshot share quality', () => {
  const snapshot = parseSnapshot(snapshotJson)
  const dimensions: Dimension[] = ['ethnic', 'religious', 'linguistic']

  const totals: Array<{ code: string; dimension: Dimension; total: number }> = []
  for (const country of snapshot.countries) {
    for (const dimension of dimensions) {
      const rows = country.diversityBreakdown.filter((row) => row.dimension === dimension)
      if (rows.length === 0) continue
      totals.push({
        code: country.code,
        dimension,
        total: rows.reduce((sum, row) => sum + row.share, 0),
      })
    }
  }

  it('ships only dimensions whose shares sum inside the plausible window', () => {
    const offenders = totals.filter(
      ({ total }) => total < DIMENSION_TOTAL_MIN || total > DIMENSION_TOTAL_MAX,
    )
    expect(offenders).toEqual([])
  })

  it('keeps the previously-poisoned dimensions either complete or absent, never partial', () => {
    const byCode = new Map<string, typeof totals>()
    for (const entry of totals) {
      const list = byCode.get(entry.code) ?? []
      list.push(entry)
      byCode.set(entry.code, list)
    }
    const totalFor = (code: string, dimension: Dimension): number | undefined =>
      byCode.get(code)?.find((entry) => entry.dimension === dimension)?.total

    // RUS religions list only practicing worshipers (32% after parsing): the
    // dimension must be absent rather than rendered as a 2% "composition".
    expect(totalFor('RUS', 'religious')).toBeUndefined()
    // IRQ ethnic groups are ranges; parsed they must be complete, not "other 5%".
    expect(totalFor('IRQ', 'ethnic')).toBeGreaterThanOrEqual(DIMENSION_TOTAL_MIN)
    expect(totalFor('IRQ', 'ethnic')).toBeLessThanOrEqual(DIMENSION_TOTAL_MAX)
  })

  it('keeps broad diversity coverage across the dataset', () => {
    const withDiversity = snapshot.countries.filter(
      (country) => country.diversityBreakdown.length > 0,
    ).length
    expect(withDiversity).toBeGreaterThanOrEqual(150)
  })
})
