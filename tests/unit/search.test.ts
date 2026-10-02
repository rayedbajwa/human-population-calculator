import { describe, expect, it } from 'vitest'
import { normalize, searchCountries } from '../../src/lib/search'
import type { Country, DatasetSnapshot } from '../../src/types'
import fixture from '../fixtures/snapshot.fixture.json'

const countries = (fixture as unknown as DatasetSnapshot).countries
const codes = (query: string, limit?: number): string[] =>
  searchCountries(countries, query, limit).map((country: Country) => country.code)

describe('normalize', () => {
  it('folds accents, case, apostrophes and whitespace', () => {
    expect(normalize("Côte d'Ivoire")).toBe('cote divoire')
    expect(normalize('  UNITED   States ')).toBe('united states')
  })
})

describe('searchCountries', () => {
  it('returns nothing for fewer than two characters', () => {
    expect(searchCountries(countries, '')).toEqual([])
    expect(searchCountries(countries, 'u')).toEqual([])
  })

  it('matches the common name case-insensitively', () => {
    expect(codes('japan')[0]).toBe('JPN')
  })

  it('matches accent-folded names', () => {
    expect(codes('cote')).toContain('CIV')
  })

  it('matches aliases and exonyms', () => {
    expect(codes('ivory coast')).toContain('CIV')
    expect(codes('america')).toContain('USA')
  })

  it('ranks an exact common-name match first', () => {
    expect(codes('china')[0]).toBe('CHN')
  })

  it('respects the result limit', () => {
    expect(searchCountries(countries, 'a', 3)).toEqual([])
    expect(codes('an', 2).length).toBeLessThanOrEqual(2)
  })

  it('returns an empty list for nonsense input', () => {
    expect(searchCountries(countries, 'zzzzzz')).toEqual([])
  })
})
