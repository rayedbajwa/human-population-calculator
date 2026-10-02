/**
 * Build-time dataset capture for the Population Globe.
 *
 * Sources merged into `data/snapshot.json`:
 *  - Population: World Bank indicator SP.POP.TOTL (Population, total), public, no key.
 *  - Boundaries: Natural Earth 1:110m via the `world-atlas` package (public domain).
 *  - Diversity: CIA World Factbook "People and Society" ethnic/linguistic/religious
 *    shares (US Government, public domain), captured from factbook/factbook.json.
 *  - Indicator: ethnic fractionalisation computed from the Factbook ethnic shares
 *    (1 - Σ share²); named explicitly as derived, not a published figure.
 *
 * The committed snapshot is what the app and tests read; this script only runs when
 * the dataset is refreshed (`bun run fetch:dataset`). It needs network access.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import worldCountries from 'world-countries'
import type { Country, DatasetSnapshot, Dimension, DiversityBreakdown } from '../src/types'

const ROOT = process.cwd()
const DATA_DIR = path.join(ROOT, 'data')
const WB_URL =
  'https://api.worldbank.org/v2/country/all/indicator/SP.POP.TOTL?format=json&per_page=20000&date=2000:2025'
const FACTBOOK_TREE = 'https://api.github.com/repos/factbook/factbook.json/git/trees/master?recursive=1'
const FACTBOOK_RAW = 'https://raw.githubusercontent.com/factbook/factbook.json/master'
const FACTBOOK_REFERENCE_YEAR = 2020

const POPULATION_SOURCE_ID = 'worldbank-population'
const DIVERSITY_SOURCE_ID = 'cia-factbook'

interface FactbookRecord {
  Government?: { 'Country name'?: Record<string, { text?: string }> }
  'People and Society'?: Record<string, unknown>
}

function sortKey(value: string): string {
  return normalize(value).split(' ').sort().join(' ')
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function fieldText(section: Record<string, unknown>, key: string): string | undefined {
  const entry = section[key]
  if (entry == null) return undefined
  if (typeof entry === 'string') return entry
  if (typeof entry === 'object') {
    const record = entry as Record<string, unknown>
    if (typeof record.text === 'string') return record.text
    const languages = record.Languages
    if (languages && typeof languages === 'object' && typeof (languages as { text?: unknown }).text === 'string') {
      return (languages as { text: string }).text
    }
  }
  return undefined
}

function referenceYearFrom(text: string): number {
  const match = /(19|20)\d{2}/.exec(text)
  return match ? Number(match[0]) : FACTBOOK_REFERENCE_YEAR
}

function parseShares(text: string): Array<{ groupName: string; share: number }> {
  const clean = stripHtml(text).replace(/\([^)]*\)/g, '')
  const rows: Array<{ groupName: string; share: number }> = []
  for (const segment of clean.split(/[;,]/)) {
    const match = /^(.*?)\s+([\d.]+)\s*%/.exec(segment.trim())
    if (!match) continue
    const groupName = match[1]!.replace(/^(less than|about|over|approximately)\s+/i, '').trim()
    const share = Number(match[2])
    if (!groupName || !Number.isFinite(share) || /less than|more than|over|under/i.test(match[1]!)) continue
    if (share <= 0 || share > 100) continue
    rows.push({ groupName, share: Math.round(share * 10) / 10 })
  }
  return rows
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let cursor = 0
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++
      results[index] = await fn(items[index]!)
    }
  })
  await Promise.all(workers)
  return results
}

async function fetchPopulation(): Promise<Map<string, { value: number; year: number }>> {
  const response = await fetch(WB_URL)
  if (!response.ok) throw new Error(`World Bank request failed: ${response.status}`)
  const body = (await response.json()) as [unknown, Array<{ countryiso3code: string; date: string; value: number | null }>]
  const rows = body[1] ?? []
  const byCode = new Map<string, { value: number; year: number }>()
  for (const row of rows) {
    if (!/^[A-Z]{3}$/.test(row.countryiso3code) || row.value == null) continue
    const year = Number(row.date)
    const existing = byCode.get(row.countryiso3code)
    if (!existing || year > existing.year) {
      byCode.set(row.countryiso3code, { value: Math.round(row.value), year })
    }
  }
  return byCode
}

async function fetchFactbook(): Promise<FactbookRecord[]> {
  const treeResponse = await fetch(FACTBOOK_TREE)
  if (!treeResponse.ok) throw new Error(`Factbook tree request failed: ${treeResponse.status}`)
  const tree = (await treeResponse.json()) as { tree: Array<{ path: string; type: string }> }
  const paths = tree.tree
    .filter((entry) => entry.type === 'blob' && /^[a-z-]+\/[a-z]+\.json$/.test(entry.path))
    .map((entry) => entry.path)
  return mapLimit(paths, 16, async (filePath) => {
    try {
      const response = await fetch(`${FACTBOOK_RAW}/${filePath}`)
      if (!response.ok) return {}
      return (await response.json()) as FactbookRecord
    } catch {
      return {}
    }
  })
}

function shortName(record: FactbookRecord): string | undefined {
  return record.Government?.['Country name']?.['conventional short form']?.text
}

async function main(): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true })

  const topoSource = path.join(ROOT, 'node_modules', 'world-atlas', 'countries-110m.json')
  await writeFile(
    path.join(DATA_DIR, 'countries-110m.topo.json'),
    await readFile(topoSource, 'utf8'),
    'utf8',
  )

  const population = await fetchPopulation()
  const factbook = await fetchFactbook()

  const byName = new Map<string, FactbookRecord>()
  for (const record of factbook) {
    const name = shortName(record)
    if (name) {
      byName.set(normalize(name), record)
      byName.set(sortKey(name), record)
    }
  }

  const countries: Country[] = []
  for (const entry of worldCountries) {
    const code = entry.cca3
    if (!/^[A-Z]{3}$/.test(code)) continue
    const pop = population.get(code)
    const names = [
      entry.name.common,
      entry.name.official,
      ...entry.altSpellings,
      ...Object.values(entry.name.native).map((native) => native.common),
    ]
    let record: FactbookRecord | undefined
    for (const name of names) {
      const found = byName.get(normalize(name)) ?? byName.get(sortKey(name))
      if (found) {
        record = found
        break
      }
    }

    const breakdown: DiversityBreakdown[] = []
    let indicator: Country['diversityIndicator'] = null
    if (record) {
      const section = record['People and Society'] ?? {}
      const dimensions: Array<[Dimension, string | undefined]> = [
        ['ethnic', fieldText(section, 'Ethnic groups')],
        ['religious', fieldText(section, 'Religions')],
        ['linguistic', fieldText(section, 'Languages')],
      ]
      for (const [dimension, text] of dimensions) {
        if (!text) continue
        const year = referenceYearFrom(text)
        for (const row of parseShares(text)) {
          breakdown.push({
            dimension,
            groupName: row.groupName,
            share: row.share,
            sourceId: DIVERSITY_SOURCE_ID,
            referenceYear: year,
          })
        }
      }
      const ethnic = breakdown.filter((row) => row.dimension === 'ethnic')
      if (ethnic.length >= 2) {
        const sumSquares = ethnic.reduce((acc, row) => acc + (row.share / 100) ** 2, 0)
        indicator = {
          name: 'Ethnic fractionalisation (derived from CIA World Factbook shares)',
          value: Math.round((1 - sumSquares) * 1000) / 1000,
          scaleMin: 0,
          scaleMax: 1,
          sourceId: DIVERSITY_SOURCE_ID,
          referenceYear: ethnic[0]!.referenceYear,
        }
      }
    }

    const aliases = Array.from(
      new Set(
        [
          entry.name.official,
          ...entry.altSpellings.filter((spelling) => spelling.length <= 40),
          ...Object.values(entry.name.native).map((native) => native.common),
        ].filter((alias): alias is string => typeof alias === 'string' && alias.length > 0 && alias !== entry.name.common),
      ),
    ).slice(0, 8)

    countries.push({
      code,
      name: entry.name.official,
      commonName: entry.name.common,
      ...(aliases.length > 0 ? { aliases } : {}),
      region: entry.region || entry.subregion || 'Unassigned',
      ...(entry.ccn3 ? { boundaryId: entry.ccn3 } : {}),
      totalPopulation: pop?.value ?? null,
      ...(pop ? { populationSourceId: POPULATION_SOURCE_ID, populationReferenceYear: pop.year } : {}),
      diversityBreakdown: breakdown,
      diversityIndicator: indicator,
    })
  }

  countries.sort((a, b) => a.commonName.localeCompare(b.commonName))

  const maxPopYear = Math.max(...[...population.values()].map((p) => p.year), FACTBOOK_REFERENCE_YEAR)
  const snapshot: DatasetSnapshot = {
    version: '1.0.0',
    retrievedDate: new Date().toISOString().slice(0, 10),
    sources: [
      {
        id: POPULATION_SOURCE_ID,
        name: 'World Bank — Population, total (SP.POP.TOTL)',
        url: 'https://data.worldbank.org/indicator/SP.POP.TOTL',
        license: 'CC-BY-4.0',
        referenceYear: maxPopYear,
      },
      {
        id: DIVERSITY_SOURCE_ID,
        name: 'CIA World Factbook — People and Society',
        url: 'https://www.cia.gov/the-world-factbook/',
        license: 'public-domain',
        referenceYear: FACTBOOK_REFERENCE_YEAR,
      },
    ],
    countries,
  }

  await writeFile(path.join(DATA_DIR, 'snapshot.json'), `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8')

  const withPopulation = countries.filter((c) => c.totalPopulation != null).length
  const withDiversity = countries.filter((c) => c.diversityBreakdown.length > 0).length
  console.log(
    `Wrote snapshot: ${countries.length} countries, ${withPopulation} with population, ${withDiversity} with diversity, ${snapshot.sources.length} sources.`,
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
