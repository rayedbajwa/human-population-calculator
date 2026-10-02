import { describe, expect, it } from 'vitest'
import { NO_DATA_COLOR, POPULATION_BUCKETS, populationBucket } from '../../src/lib/diversity'

describe('populationBucket', () => {
  it('returns null for missing or invalid populations (never zero)', () => {
    expect(populationBucket(null)).toBeNull()
    expect(populationBucket(Number.NaN)).toBeNull()
    expect(populationBucket(-5)).toBeNull()
  })

  it('maps population boundaries to the correct bucket', () => {
    expect(populationBucket(0)?.label).toBe('Under 1M')
    expect(populationBucket(999_999)?.label).toBe('Under 1M')
    expect(populationBucket(1_000_000)?.label).toBe('1M – 10M')
    expect(populationBucket(9_999_999)?.label).toBe('1M – 10M')
    expect(populationBucket(10_000_000)?.label).toBe('10M – 50M')
    expect(populationBucket(99_999_999)?.label).toBe('50M – 100M')
    expect(populationBucket(500_000_000)?.label).toBe('Over 500M')
    expect(populationBucket(1_600_000_000)?.label).toBe('Over 500M')
  })

  it('keeps the no-data colour distinct from every bucket colour', () => {
    const bucketColors = new Set(POPULATION_BUCKETS.map((bucket) => bucket.color))
    expect(bucketColors.has(NO_DATA_COLOR)).toBe(false)
    expect(bucketColors.size).toBe(POPULATION_BUCKETS.length)
  })
})
