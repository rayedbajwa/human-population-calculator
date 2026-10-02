import { describe, expect, it } from 'vitest'
import { centroidLatLng } from '../../src/lib/geo'

describe('centroidLatLng', () => {
  it('returns the plain mean for a geometry in one hemisphere', () => {
    const centre = centroidLatLng({ coordinates: [[[10, 20], [30, 40]]] })
    expect(centre).not.toBeNull()
    expect(centre!.lat).toBe(30)
    expect(centre!.lng).toBe(20)
  })

  it('unwraps longitudes for a country spanning the antimeridian', () => {
    // Fiji-like islands: 177°E and 178°W must not average to ≈0°.
    const centre = centroidLatLng({ coordinates: [[[177, -17], [-178, -17]]] })
    expect(centre).not.toBeNull()
    expect(centre!.lng).toBeCloseTo(179.5, 1)
    expect(centre!.lat).toBe(-17)
  })

  it('handles a single-point geometry', () => {
    const centre = centroidLatLng({ coordinates: [[[177, -17]]] })
    expect(centre).toEqual({ lat: -17, lng: 177 })
  })

  it('returns null when there are no coordinates', () => {
    expect(centroidLatLng({})).toBeNull()
    expect(centroidLatLng({ coordinates: [] })).toBeNull()
  })
})
