import { useEffect, useMemo, useRef, useState } from 'react'
import Globe, { type GlobeMethods } from 'react-globe.gl'
import { feature } from 'topojson-client'
import type { Country } from '../types'
import { NO_DATA_COLOR, populationBucket } from '../lib/diversity'
import { BOUNDARIES_URL } from '../lib/dataset'
import { centroidLatLng } from '../lib/geo'

export interface GlobeViewProps {
  countries: Country[]
  selectedCode: string | null
  onSelect: (code: string) => void
  onHover: (code: string | null) => void
  reducedMotion: boolean
}

interface PolygonDatum {
  id: string
  geometry: unknown
  properties: Record<string, unknown>
  country?: Country
}

function decodeFeatures(topo: unknown): Array<{ id: string; geometry: unknown; properties: Record<string, unknown> }> {
  const collection = feature(topo as never, (topo as { objects: { countries: never } }).objects.countries) as unknown as {
    features: Array<{ id?: string | number; geometry: unknown; properties?: Record<string, unknown> }>
  }
  return collection.features.map((f) => ({
    id: String(f.id),
    geometry: f.geometry,
    properties: f.properties ?? {},
  }))
}

/** Interactive 3D choropleth globe (FR-001/002/003). */
export function GlobeView({ countries, selectedCode, onSelect, onHover, reducedMotion }: GlobeViewProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const globeRef = useRef<GlobeMethods>()
  const [size, setSize] = useState({ width: 800, height: 600 })
  const [rawFeatures, setRawFeatures] = useState<Array<{ id: string; geometry: unknown; properties: Record<string, unknown> }>>([])
  const [interacted, setInteracted] = useState(false)
  const [boundaryError, setBoundaryError] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [camera, setCamera] = useState<{ lat: number; lng: number } | null>(null)
  const [focusCode, setFocusCode] = useState<string | null>(null)

  // biome-ignore lint/correctness/useExhaustiveDependencies: reloadKey intentionally re-runs the boundary fetch on retry.
  useEffect(() => {
    let cancelled = false
    setBoundaryError(false)
    fetch(BOUNDARIES_URL)
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error('boundaries'))))
      .then((topo: unknown) => {
        if (!cancelled) setRawFeatures(decodeFeatures(topo))
      })
      .catch(() => {
        // FR-014: a boundary load/render failure must be visible with a retry,
        // not a silently unshaded globe.
        if (!cancelled) setBoundaryError(true)
      })
    return () => {
      cancelled = true
    }
  }, [reloadKey])

  const byBoundary = useMemo(() => {
    const map = new Map<string, Country>()
    for (const country of countries) map.set(country.boundaryId ?? country.code, country)
    return map
  }, [countries])

  const polygons: PolygonDatum[] = useMemo(
    () => rawFeatures.map((f) => ({ ...f, country: byBoundary.get(f.id) })),
    [rawFeatures, byBoundary],
  )

  const shading = useMemo(() => {
    let shaded = 0
    for (const featureRecord of rawFeatures) {
      if (byBoundary.get(featureRecord.id)?.totalPopulation != null) shaded += 1
    }
    return { shaded, total: rawFeatures.length }
  }, [rawFeatures, byBoundary])

  useEffect(() => {
    const element = wrapRef.current
    if (!element) return
    const update = () => {
      setSize({ width: element.clientWidth || 800, height: element.clientHeight || 600 })
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  // biome-ignore lint/correctness/useExhaustiveDependencies: size.width re-applies control settings after the globe resizes.
  useEffect(() => {
    const controls = globeRef.current?.controls?.()
    if (!controls) return
    controls.autoRotate = !reducedMotion && selectedCode == null && !interacted
    controls.autoRotateSpeed = 0.4
    controls.enableDamping = true
  }, [reducedMotion, selectedCode, interacted, size.width])

  useEffect(() => {
    if (!selectedCode) return
    const polygon = polygons.find((p) => p.country?.code === selectedCode)
    if (!polygon) return
    const centre = centroidLatLng(polygon.geometry)
    if (!centre) return
    setFocusCode(selectedCode)
    globeRef.current?.pointOfView?.({ lat: centre.lat, lng: centre.lng, altitude: 1.3 }, reducedMotion ? 0 : 800)
  }, [selectedCode, polygons, reducedMotion])

  const capColor = (obj: object): string => {
    const population = (obj as PolygonDatum).country?.totalPopulation
    if (population == null) return NO_DATA_COLOR
    return populationBucket(population)?.color ?? NO_DATA_COLOR
  }

  const strokeColor = (obj: object): string =>
    (obj as PolygonDatum).country?.code === selectedCode ? '#ffffff' : 'rgba(0,0,0,0.35)'

  const altitude = (obj: object): number =>
    (obj as PolygonDatum).country?.code === selectedCode ? 0.02 : 0.006

  return (
    <div
      className="pg-globe-wrap"
      ref={wrapRef}
      data-testid="globe-view"
      data-camera-lat={camera ? camera.lat.toFixed(2) : ''}
      data-camera-lng={camera ? camera.lng.toFixed(2) : ''}
      data-focus-code={focusCode ?? ''}
      onPointerDown={() => setInteracted(true)}
    >
      <span
        hidden
        data-testid="shading-stats"
        data-shaded={shading.shaded}
        data-total={shading.total}
      />
      {boundaryError && (
        <div className="pg-error pg-card pg-globe-error" role="alert" data-testid="boundary-error">
          <h2>Map boundaries could not be loaded</h2>
          <p className="pg-muted">The country shapes failed to load, so the map cannot be shaded.</p>
          <button
            type="button"
            className="pg-button"
            onClick={() => setReloadKey((key) => key + 1)}
          >
            Retry
          </button>
        </div>
      )}
      <Globe
        ref={globeRef}
        width={size.width}
        height={size.height}
        backgroundColor="rgba(0,0,0,0)"
        showAtmosphere
        showGraticules={false}
        polygonsData={polygons}
        polygonCapColor={capColor}
        polygonSideColor={() => 'rgba(0,0,0,0.15)'}
        polygonStrokeColor={strokeColor}
        polygonAltitude={altitude}
        polygonsTransitionDuration={reducedMotion ? 0 : 300}
        onPolygonHover={(obj: object | null) => onHover((obj as PolygonDatum | null)?.country?.code ?? null)}
        onPolygonClick={(obj: object) => {
          const country = (obj as PolygonDatum).country
          if (country) onSelect(country.code)
        }}
        onZoom={(pov: { lat: number; lng: number }) => setCamera({ lat: pov.lat, lng: pov.lng })}
      />
    </div>
  )
}
