import { describe, expect, it } from 'vitest'
import { formatPopulation, formatShare } from '../../src/lib/format'

describe('formatPopulation', () => {
  it('formats the exact value with thousands separators', () => {
    expect(formatPopulation(1_234_567).exact).toBe('1,234,567')
    expect(formatPopulation(999).exact).toBe('999')
  })

  it('rounds the exact value to a whole number', () => {
    expect(formatPopulation(1234.6).exact).toBe('1,235')
  })

  it('omits the short form at or below one million', () => {
    expect(formatPopulation(999_999).short).toBeNull()
    expect(formatPopulation(1_000_000).short).toBeNull()
  })

  it('adds a short form above one million', () => {
    expect(formatPopulation(1_234_567).short).toBe('1.2M')
    expect(formatPopulation(2_500_000_000).short).toBe('2.5B')
    expect(formatPopulation(3_000_000_000_000).short).toBe('3T')
  })

  it('rejects negative and non-finite values', () => {
    expect(() => formatPopulation(-1)).toThrow(RangeError)
    expect(() => formatPopulation(Number.NaN)).toThrow(RangeError)
    expect(() => formatPopulation(Number.POSITIVE_INFINITY)).toThrow(RangeError)
  })
})

describe('formatShare', () => {
  it('formats one decimal place', () => {
    expect(formatShare(42.5)).toBe('42.5%')
    expect(formatShare(1.25)).toBe('1.3%')
  })

  it('drops a trailing .0', () => {
    expect(formatShare(96)).toBe('96%')
  })

  it('rejects values outside 0–100', () => {
    expect(() => formatShare(-1)).toThrow(RangeError)
    expect(() => formatShare(101)).toThrow(RangeError)
  })
})
