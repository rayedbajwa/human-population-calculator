export interface LatLng {
  lat: number
  lng: number
}

/**
 * Approximate visual centre of a GeoJSON geometry.
 *
 * Latitude is the plain mean. Longitude uses the "largest gap" method on the
 * 0–360 circle so countries that span the antimeridian (e.g. Fiji, whose
 * islands sit at ≈177°E and ≈−178°W) resolve to a point near their islands
 * instead of averaging to ≈0°.
 */
export function centroidLatLng(geometry: unknown): LatLng | null {
  const points: Array<[number, number]> = []
  const walk = (value: unknown): void => {
    if (!Array.isArray(value)) return
    if (typeof value[0] === 'number' && typeof value[1] === 'number') {
      points.push([value[0] as number, value[1] as number])
      return
    }
    for (const child of value) walk(child)
  }
  walk((geometry as { coordinates?: unknown })?.coordinates)
  if (points.length === 0) return null

  let lat = 0
  for (const [, y] of points) lat += y
  lat /= points.length

  const lngs = points.map(([x]) => (((x % 360) + 360) % 360)).sort((a, b) => a - b)
  let largest = 0
  let gapEnd = lngs[0]!
  for (let i = 0; i < lngs.length; i += 1) {
    const start = lngs[i]!
    const end = (i === lngs.length - 1 ? lngs[0]! + 360 : lngs[i + 1]!)
    const gap = end - start
    if (gap > largest) {
      largest = gap
      gapEnd = end
    }
  }
  const centre = (gapEnd + (360 - largest) / 2) % 360
  return { lat, lng: centre > 180 ? centre - 360 : centre }
}
