export type Dimension = 'ethnic' | 'linguistic' | 'religious'

export interface Source {
  id: string
  name: string
  url: string
  license: string
  referenceYear: number
}

export interface DiversityBreakdown {
  dimension: Dimension
  groupName: string
  /** Percentage share, 0–100. */
  share: number
  sourceId: string
  referenceYear: number
}

export interface DiversityIndicator {
  name: string
  value: number
  scaleMin: number
  scaleMax: number
  sourceId: string
  referenceYear: number
}

export interface Country {
  /** ISO 3166-1 alpha-3 code; unique join key. */
  code: string
  /** Official / local long name. */
  name: string
  /** Searchable common display name. */
  commonName: string
  aliases?: string[]
  region: string
  /** TopoJSON feature id when it differs from `code` (world-atlas uses ISO numeric). */
  boundaryId?: string
  totalPopulation: number | null
  populationSourceId?: string
  populationReferenceYear?: number
  diversityBreakdown: DiversityBreakdown[]
  diversityIndicator: DiversityIndicator | null
}

export interface DatasetSnapshot {
  version: string
  retrievedDate: string
  sources: Source[]
  countries: Country[]
}

export type LoadStatus = 'loading' | 'ready' | 'error'

export interface AppState {
  snapshot: DatasetSnapshot | null
  status: LoadStatus
  selectedCode: string | null
  query: string
  hintDismissed: boolean
  error: string | null
}

export interface PopulationBucket {
  min: number
  max: number | null
  color: string
  label: string
}
