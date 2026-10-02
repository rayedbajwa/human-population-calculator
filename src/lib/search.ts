import type { Country } from '../types'

/**
 * Accent-folded, ranked country search (FR-006).
 * Matches common name, official/local name and aliases.
 */

export function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

interface Scored {
  country: Country
  rank: number
}

function rankField(field: string, query: string, alias: boolean): number | null {
  const value = normalize(field)
  if (!value) return null
  if (value === query) return alias ? 1 : 0
  if (value.startsWith(query)) return alias ? 2 : 1
  if (value.includes(query)) return alias ? 3 : 2
  return null
}

function scoreCountry(country: Country, query: string): number | null {
  const fields: Array<[string | undefined, boolean]> = [
    [country.commonName, false],
    [country.name, false],
    ...(country.aliases ?? []).map((a): [string, boolean] => [a, true]),
  ]
  let best: number | null = null
  for (const [field, alias] of fields) {
    if (!field) continue
    const rank = rankField(field, query, alias)
    if (rank != null && (best == null || rank < best)) best = rank
  }
  return best
}

export function searchCountries(countries: Country[], query: string, limit = 8): Country[] {
  const normalized = normalize(query)
  if (normalized.length < 2) return []

  const matches: Scored[] = []
  for (const country of countries) {
    const rank = scoreCountry(country, normalized)
    if (rank != null) matches.push({ country, rank })
  }

  matches.sort((a, b) => {
    if (a.rank !== b.rank) return a.rank - b.rank
    return a.country.commonName.localeCompare(b.country.commonName)
  })

  return matches.slice(0, limit).map((m) => m.country)
}
