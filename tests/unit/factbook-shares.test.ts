import { describe, expect, it } from 'vitest'
import {
  DIMENSION_TOTAL_MAX,
  DIMENSION_TOTAL_MIN,
  decodeEntities,
  dimensionTotal,
  isPlausibleDimension,
  parseShares,
} from '../../scripts/factbook-shares'

/**
 * Real CIA World Factbook strings that used to be mis-parsed: ranges and
 * "more/less than" were dropped, so compositions were rendered as complete.
 */
describe('parseShares', () => {
  it('parses a range as its midpoint', () => {
    const rows = parseShares('Russian Orthodox 15-20%, Muslim 10-15%, other Christian 2% (2006 est.)')
    expect(rows).toEqual([
      { groupName: 'Russian Orthodox', share: 17.5 },
      { groupName: 'Muslim', share: 12.5 },
      { groupName: 'other Christian', share: 2 },
    ])
  })

  it('keeps "more than" / "approximately" rows instead of dropping them', () => {
    const rows = parseShares(
      'Han Chinese (including Holo, who compose approximately 70% of Taiwan\'s population) more than 95%, indigenous Malayo-Polynesian peoples 2.3%',
    )
    expect(rows).toEqual([
      { groupName: 'Han Chinese', share: 95 },
      { groupName: 'indigenous Malayo-Polynesian peoples', share: 2.3 },
    ])
  })

  it('strips infix modifiers from the group name', () => {
    const rows = parseShares('Dinka (Jieng) approximately 35-40%, Nuer (Naath) approximately 15%')
    expect(rows).toEqual([
      { groupName: 'Dinka', share: 37.5 },
      { groupName: 'Nuer', share: 15 },
    ])
  })

  it('reads a slash used as a decimal point and decodes entities', () => {
    const rows = parseShares(
      'Christian 93/1% (Roman Catholic 29.9%, Protestant 26.7%, other Christian 36.5%), Kimbanguist 2.8%, Muslim 1.3%, other (includes syncretic sects) 1.2%, none 1.3%, unspecified 0.2% (2014 est.)',
    )
    expect(rows[0]).toEqual({ groupName: 'Christian', share: 93.1 })
    expect(dimensionTotal(rows)).toBeCloseTo(99.9, 1)
  })

  it('treats "other <1%" as its bound', () => {
    const rows = parseShares(
      'Christian 60.5%, folk religion 32.9%, Muslim 6.2%, other &lt;1%, unaffiliated &lt;1% (2020 est.)',
    )
    expect(rows.map((row) => row.groupName)).toEqual([
      'Christian',
      'folk religion',
      'Muslim',
      'other',
      'unaffiliated',
    ])
    expect(dimensionTotal(rows)).toBeCloseTo(101.6, 1)
  })

  it('returns nothing for a text-only field with no shares', () => {
    expect(parseShares('Greenlandic, Danish, English')).toEqual([])
  })
})

describe('decodeEntities', () => {
  it('decodes named, decimal and hex entities', () => {
    expect(decodeEntities('Esp&iacute;rita &lt; 0.1 &#37; &#x25;')).toBe('Espírita < 0.1 % %')
  })
})

describe('isPlausibleDimension', () => {
  it('accepts a composition that sums near 100', () => {
    expect(isPlausibleDimension(parseShares('Arab 75-80%, Kurdish 15-20%, other 5%'))).toBe(true)
  })

  it('rejects a partial field (practicing worshipers only)', () => {
    const rows = parseShares('Russian Orthodox 15-20%, Muslim 10-15%, other Christian 2%')
    expect(dimensionTotal(rows)).toBeCloseTo(32, 1)
    expect(isPlausibleDimension(rows)).toBe(false)
  })

  it('rejects a multi-response language census above the window', () => {
    const rows = parseShares('Tokelauan 88.1%, English 48.6%, Samoan 26.7%, Tuvaluan 11.2%')
    expect(dimensionTotal(rows)).toBeGreaterThan(DIMENSION_TOTAL_MAX)
    expect(isPlausibleDimension(rows)).toBe(false)
  })

  it('rejects an empty dimension', () => {
    expect(isPlausibleDimension([])).toBe(false)
  })

  it('exposes a 90–110 window', () => {
    expect(DIMENSION_TOTAL_MIN).toBe(90)
    expect(DIMENSION_TOTAL_MAX).toBe(110)
  })
})
