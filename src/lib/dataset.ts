import type {
  Country,
  DatasetSnapshot,
  DiversityBreakdown,
  DiversityIndicator,
  Source,
} from '../types'

export const SNAPSHOT_URL = 'data/snapshot.json'
export const BOUNDARIES_URL = 'data/countries-110m.topo.json'

/** User-safe error raised for non-2xx, parse failure or schema violation. */
export class DatasetError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DatasetError'
  }
}

const DIMENSIONS = new Set(['ethnic', 'linguistic', 'religious'])
const SEMVER = /^\d+\.\d+\.\d+$/

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value)
}

function parseSource(value: unknown): Source {
  if (!isObject(value)) throw new DatasetError('The dataset contains an invalid source.')
  const { id, name, url, license, referenceYear } = value
  if (
    !isNonEmptyString(id) ||
    !isNonEmptyString(name) ||
    !isNonEmptyString(url) ||
    !isNonEmptyString(license) ||
    !isInteger(referenceYear)
  ) {
    throw new DatasetError('The dataset contains an invalid source.')
  }
  return { id, name, url, license, referenceYear }
}

function parseBreakdown(value: unknown, sourceIds: Set<string>): DiversityBreakdown {
  if (!isObject(value)) throw new DatasetError('The dataset contains an invalid diversity row.')
  const { dimension, groupName, share, sourceId, referenceYear } = value
  if (
    typeof dimension !== 'string' ||
    !DIMENSIONS.has(dimension) ||
    !isNonEmptyString(groupName) ||
    typeof share !== 'number' ||
    !Number.isFinite(share) ||
    share < 0 ||
    share > 100 ||
    !isNonEmptyString(sourceId) ||
    !sourceIds.has(sourceId) ||
    !isInteger(referenceYear)
  ) {
    throw new DatasetError('The dataset contains an invalid diversity row.')
  }
  return { dimension: dimension as DiversityBreakdown['dimension'], groupName, share, sourceId, referenceYear }
}

function parseIndicator(value: unknown, sourceIds: Set<string>): DiversityIndicator {
  if (!isObject(value)) throw new DatasetError('The dataset contains an invalid diversity indicator.')
  const { name, value: indicatorValue, scaleMin, scaleMax, sourceId, referenceYear } = value
  if (
    !isNonEmptyString(name) ||
    typeof indicatorValue !== 'number' ||
    !Number.isFinite(indicatorValue) ||
    typeof scaleMin !== 'number' ||
    !Number.isFinite(scaleMin) ||
    typeof scaleMax !== 'number' ||
    !Number.isFinite(scaleMax) ||
    scaleMin >= scaleMax ||
    indicatorValue < scaleMin ||
    indicatorValue > scaleMax ||
    !isNonEmptyString(sourceId) ||
    !sourceIds.has(sourceId) ||
    !isInteger(referenceYear)
  ) {
    throw new DatasetError('The dataset contains an invalid diversity indicator.')
  }
  return { name, value: indicatorValue, scaleMin, scaleMax, sourceId, referenceYear }
}

function parseCountry(value: unknown, sourceIds: Set<string>): Country {
  if (!isObject(value)) throw new DatasetError('The dataset contains an invalid country.')
  const { code, name, commonName, aliases, region, boundaryId, totalPopulation } = value
  if (
    typeof code !== 'string' ||
    !/^[A-Z]{3}$/.test(code) ||
    !isNonEmptyString(name) ||
    !isNonEmptyString(commonName) ||
    !isNonEmptyString(region)
  ) {
    throw new DatasetError('The dataset contains an invalid country.')
  }

  if (totalPopulation !== null && totalPopulation !== undefined) {
    if (typeof totalPopulation !== 'number' || !Number.isInteger(totalPopulation) || totalPopulation < 0) {
      throw new DatasetError('The dataset contains an invalid population figure.')
    }
    const { populationSourceId, populationReferenceYear } = value
    if (
      !isNonEmptyString(populationSourceId) ||
      !sourceIds.has(populationSourceId) ||
      !isInteger(populationReferenceYear)
    ) {
      throw new DatasetError('A population figure is missing its source or reference year.')
    }
  }

  const breakdownRaw = value.diversityBreakdown
  const breakdown = Array.isArray(breakdownRaw)
    ? breakdownRaw.map((row) => parseBreakdown(row, sourceIds))
    : []

  const indicatorRaw = value.diversityIndicator
  const indicator =
    indicatorRaw == null ? null : parseIndicator(indicatorRaw, sourceIds)

  const normalizedAliases = Array.isArray(aliases)
    ? aliases.filter((a): a is string => typeof a === 'string' && a.length > 0)
    : undefined

  return {
    code,
    name,
    commonName,
    ...(normalizedAliases && normalizedAliases.length > 0 ? { aliases: normalizedAliases } : {}),
    region,
    ...(isNonEmptyString(boundaryId) ? { boundaryId } : {}),
    totalPopulation:
      totalPopulation === null || totalPopulation === undefined ? null : (totalPopulation as number),
    ...(typeof value.populationSourceId === 'string'
      ? { populationSourceId: value.populationSourceId }
      : {}),
    ...(isInteger(value.populationReferenceYear)
      ? { populationReferenceYear: value.populationReferenceYear }
      : {}),
    diversityBreakdown: breakdown,
    diversityIndicator: indicator,
  }
}

/** Validate an unknown value against the dataset contract, returning a typed snapshot. */
export function parseSnapshot(data: unknown): DatasetSnapshot {
  if (!isObject(data)) throw new DatasetError('The population dataset is malformed.')
  const { version, retrievedDate, sources, countries } = data
  if (!isNonEmptyString(version) || !SEMVER.test(version)) {
    throw new DatasetError('The population dataset has an unsupported version.')
  }
  if (!isNonEmptyString(retrievedDate)) {
    throw new DatasetError('The population dataset is missing its retrieval date.')
  }
  if (!Array.isArray(sources) || sources.length === 0) {
    throw new DatasetError('The population dataset defines no sources.')
  }
  const parsedSources = sources.map(parseSource)
  const sourceIds = new Set(parsedSources.map((s) => s.id))
  if (sourceIds.size !== parsedSources.length) {
    throw new DatasetError('The population dataset has duplicate source ids.')
  }

  if (!Array.isArray(countries) || countries.length === 0) {
    throw new DatasetError('The population dataset contains no countries.')
  }
  const parsedCountries = countries.map((c) => parseCountry(c, sourceIds))
  const codes = new Set<string>()
  for (const country of parsedCountries) {
    if (codes.has(country.code)) {
      throw new DatasetError(`The population dataset has a duplicate country: ${country.code}.`)
    }
    codes.add(country.code)
  }

  return { version, retrievedDate, sources: parsedSources, countries: parsedCountries }
}

/** Load and validate the bundled snapshot. Rejects with a user-safe `DatasetError`. */
export async function loadSnapshot(fetchImpl: typeof fetch = fetch): Promise<DatasetSnapshot> {
  let response: Response
  try {
    response = await fetchImpl(SNAPSHOT_URL)
  } catch {
    throw new DatasetError('Could not reach the population dataset.')
  }
  if (!response.ok) {
    throw new DatasetError('Could not load the population dataset.')
  }
  let data: unknown
  try {
    data = await response.json()
  } catch {
    throw new DatasetError('The population dataset could not be parsed.')
  }
  return parseSnapshot(data)
}

export function countryByCode(snapshot: DatasetSnapshot, code: string): Country | undefined {
  return snapshot.countries.find((c) => c.code === code)
}

export function sourceById(snapshot: DatasetSnapshot, id: string): Source | undefined {
  return snapshot.sources.find((s) => s.id === id)
}
