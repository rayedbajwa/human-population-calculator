import { describe, expect, it } from 'vitest'
import { indicatorPosition } from '../../src/lib/diversity'
import type { DiversityIndicator } from '../../src/types'

const base: DiversityIndicator = {
  name: 'Ethnic fractionalisation',
  value: 0.5,
  scaleMin: 0,
  scaleMax: 1,
  sourceId: 'fixture-diversity',
  referenceYear: 2020,
}

describe('indicatorPosition', () => {
  it('is 0 at the scale minimum', () => {
    expect(indicatorPosition({ ...base, value: 0 })).toBe(0)
  })

  it('is 1 at the scale maximum', () => {
    expect(indicatorPosition({ ...base, value: 1 })).toBe(1)
  })

  it('maps an interior value proportionally', () => {
    expect(indicatorPosition({ ...base, value: 0.25 })).toBe(0.25)
    expect(indicatorPosition({ ...base, value: 0.75 })).toBe(0.75)
  })

  it('clamps values outside the scale', () => {
    expect(indicatorPosition({ ...base, value: -1 })).toBe(0)
    expect(indicatorPosition({ ...base, value: 2 })).toBe(1)
  })

  it('handles a degenerate scale without dividing by zero', () => {
    expect(indicatorPosition({ ...base, scaleMin: 1, scaleMax: 1, value: 1 })).toBe(0)
  })
})
