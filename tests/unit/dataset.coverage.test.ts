import { describe, expect, it } from 'vitest'
import { feature } from 'topojson-client'
import type { Country } from '../../src/types'
import snapshotJson from '../../data/snapshot.json'
import topoJson from '../../data/countries-110m.topo.json'
import { parseSnapshot } from '../../src/lib/dataset'
import { countriesWithPopulation } from '../../src/lib/diversity'

/**
 * SC-003: ≥95% of the countries the globe renders (the Natural Earth 1:110m
 * boundary features that resolve to a snapshot entry) carry population shading.
 *
 * This is a committed, reproducible measurement over the real dataset so the
 * success criterion is proven by a test rather than an ad-hoc script. The
 * dataset intentionally contains more countries/territories than the boundary
 * set (250 vs 177); the globe only renders the boundary set, so that is the
 * denominator SC-003 is defined against. The dataset-wide coverage is also
 * asserted as a floor so a regression is visible.
 */
describe('SC-003 shading coverage over the real snapshot', () => {
  const snapshot = parseSnapshot(snapshotJson)
  const topo = topoJson as unknown as { objects: { countries: never } }
  const collection = feature(topo as never, topo.objects.countries) as unknown as {
    features: Array<{ id?: string | number }>
  }

  const boundaryIds = collection.features.map((f) => String(f.id))
  const byBoundary = new Map<string, Country>()
  for (const country of snapshot.countries) {
    if (country.boundaryId) byBoundary.set(country.boundaryId, country)
  }
  const matched = boundaryIds.filter((id) => byBoundary.has(id)).length
  const shaded = boundaryIds.filter((id) => byBoundary.get(id)?.totalPopulation != null).length

  it('renders at least 95% of boundary features shaded', () => {
    expect(boundaryIds.length).toBeGreaterThan(150)
    expect(matched).toBeGreaterThanOrEqual(170)
    expect(shaded / boundaryIds.length).toBeGreaterThanOrEqual(0.95)
  })

  it('keeps broad population coverage across the dataset as a regression floor', () => {
    const withPopulation = countriesWithPopulation(snapshot.countries)
    expect(withPopulation / snapshot.countries.length).toBeGreaterThanOrEqual(0.8)
  })
})
