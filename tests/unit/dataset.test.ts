import { describe, expect, it, vi } from 'vitest'
import {
  DatasetError,
  countryByCode,
  loadSnapshot,
  parseSnapshot,
  sourceById,
} from '../../src/lib/dataset'
import fixture from '../fixtures/snapshot.fixture.json'

/** Deep clone so each case mutates an independent snapshot. */
function valid(): Record<string, unknown> {
  return structuredClone(fixture) as unknown as Record<string, unknown>
}

function countriesOf(data: Record<string, unknown>): Array<Record<string, unknown>> {
  return data.countries as Array<Record<string, unknown>>
}

function expectRejected(mutate: (data: Record<string, unknown>) => void): void {
  const data = valid()
  mutate(data)
  expect(() => parseSnapshot(data)).toThrow(DatasetError)
}

describe('parseSnapshot — valid input', () => {
  it('accepts the fixture and preserves its sources and countries', () => {
    const snapshot = parseSnapshot(valid())
    expect(snapshot.version).toBe('1.0.0')
    expect(snapshot.sources.map((source) => source.id)).toEqual([
      'fixture-population',
      'fixture-diversity',
    ])
    expect(snapshot.countries).toHaveLength(countriesOf(valid()).length)
    expect(snapshot.countries.map((country) => country.code)).toContain('USA')
  })

  it('keeps an explicit null population (never coerces to zero)', () => {
    const snapshot = parseSnapshot(valid())
    const vatican = countryByCode(snapshot, 'VAT')
    expect(vatican?.totalPopulation).toBeNull()
  })
})

describe('parseSnapshot — rejection branches', () => {
  it('rejects a non-object payload', () => {
    expect(() => parseSnapshot('not a snapshot')).toThrow(DatasetError)
  })

  it('rejects an unsupported version', () => {
    expectRejected((data) => {
      data.version = 'one'
    })
  })

  it('rejects a missing retrieval date', () => {
    expectRejected((data) => {
      delete data.retrievedDate
    })
  })

  it('rejects an empty source list', () => {
    expectRejected((data) => {
      data.sources = []
    })
  })

  it('rejects duplicate source ids', () => {
    expectRejected((data) => {
      const sources = data.sources as Array<Record<string, unknown>>
      sources.push(structuredClone(sources[0]!))
    })
  })

  it('rejects an invalid source record', () => {
    expectRejected((data) => {
      const sources = data.sources as Array<Record<string, unknown>>
      delete sources[0]!.name
    })
  })

  it('rejects a snapshot without countries', () => {
    expectRejected((data) => {
      data.countries = []
    })
  })

  it('rejects an invalid country code', () => {
    expectRejected((data) => {
      countriesOf(data)[0]!.code = 'us'
    })
  })

  it('rejects duplicate country codes', () => {
    expectRejected((data) => {
      const countries = countriesOf(data)
      countries.push(structuredClone(countries[0]!))
    })
  })

  it('rejects a negative population', () => {
    expectRejected((data) => {
      countriesOf(data)[0]!.totalPopulation = -1
    })
  })

  it('rejects a population without a source', () => {
    expectRejected((data) => {
      delete countriesOf(data)[0]!.populationSourceId
    })
  })

  it('rejects a population without a reference year', () => {
    expectRejected((data) => {
      delete countriesOf(data)[0]!.populationReferenceYear
    })
  })

  it('rejects a dangling population source id', () => {
    expectRejected((data) => {
      countriesOf(data)[0]!.populationSourceId = 'missing-source'
    })
  })

  it('rejects an unknown diversity dimension', () => {
    expectRejected((data) => {
      const rows = countriesOf(data)[0]!.diversityBreakdown as Array<Record<string, unknown>>
      rows[0]!.dimension = 'height'
    })
  })

  it('rejects an out-of-range diversity share', () => {
    expectRejected((data) => {
      const rows = countriesOf(data)[0]!.diversityBreakdown as Array<Record<string, unknown>>
      rows[0]!.share = 180
    })
  })

  it('rejects a dangling diversity source id', () => {
    expectRejected((data) => {
      const rows = countriesOf(data)[0]!.diversityBreakdown as Array<Record<string, unknown>>
      rows[0]!.sourceId = 'missing-source'
    })
  })

  it('rejects a diversity row without a reference year', () => {
    expectRejected((data) => {
      const rows = countriesOf(data)[0]!.diversityBreakdown as Array<Record<string, unknown>>
      delete rows[0]!.referenceYear
    })
  })

  it('rejects an indicator outside its scale', () => {
    expectRejected((data) => {
      const indicator = countriesOf(data)[0]!.diversityIndicator as Record<string, unknown>
      indicator.value = 2
    })
  })

  it('rejects a degenerate indicator scale', () => {
    expectRejected((data) => {
      const indicator = countriesOf(data)[0]!.diversityIndicator as Record<string, unknown>
      indicator.scaleMax = indicator.scaleMin
    })
  })

  it('rejects a dangling indicator source id', () => {
    expectRejected((data) => {
      const indicator = countriesOf(data)[0]!.diversityIndicator as Record<string, unknown>
      indicator.sourceId = 'missing-source'
    })
  })
})

describe('dataset selectors', () => {
  const snapshot = parseSnapshot(valid())

  it('countryByCode returns the matching country', () => {
    expect(countryByCode(snapshot, 'JPN')?.commonName).toBe('Japan')
  })

  it('countryByCode returns undefined for an unknown code', () => {
    expect(countryByCode(snapshot, 'ZZZ')).toBeUndefined()
  })

  it('sourceById returns the matching source', () => {
    expect(sourceById(snapshot, 'fixture-population')?.license).toBe('public-domain')
  })

  it('sourceById returns undefined for an unknown id', () => {
    expect(sourceById(snapshot, 'nope')).toBeUndefined()
  })
})

describe('loadSnapshot', () => {
  it('loads and validates through an injected fetch', async () => {
    const fetchImpl = vi.fn(
      async () => new Response(JSON.stringify(valid()), { status: 200 }),
    )
    const snapshot = await loadSnapshot(fetchImpl as unknown as typeof fetch)
    expect(snapshot.countries.map((country) => country.code)).toContain('USA')
    expect(fetchImpl).toHaveBeenCalledOnce()
  })

  it('rejects a non-2xx response with a user-safe error', async () => {
    const fetchImpl = vi.fn(async () => new Response('nope', { status: 500 }))
    await expect(loadSnapshot(fetchImpl as unknown as typeof fetch)).rejects.toThrow(DatasetError)
  })

  it('rejects a network failure with a user-safe error', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error('offline')
    })
    await expect(loadSnapshot(fetchImpl as unknown as typeof fetch)).rejects.toThrow(
      'Could not reach the population dataset.',
    )
  })

  it('rejects unparseable JSON with a user-safe error', async () => {
    const fetchImpl = vi.fn(async () => new Response('<html>not json</html>', { status: 200 }))
    await expect(loadSnapshot(fetchImpl as unknown as typeof fetch)).rejects.toThrow(DatasetError)
  })

  it('rejects a schema violation with a user-safe error', async () => {
    const broken = valid()
    broken.version = 'bad'
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify(broken), { status: 200 }))
    await expect(loadSnapshot(fetchImpl as unknown as typeof fetch)).rejects.toThrow(DatasetError)
  })
})
