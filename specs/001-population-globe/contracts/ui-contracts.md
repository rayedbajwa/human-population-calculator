# UI & Module Contracts: Population Globe

The app exposes no network API and no CLI. The contracts below are the interfaces that the
implementation and its tests share: the dataset asset (see
[`dataset.schema.json`](./dataset.schema.json)) and the component/module boundaries.

## Component contracts

### `<App />`
Top-level state owner. `AppState`:

```ts
type AppState = {
  snapshot: DatasetSnapshot | null;
  status: "loading" | "ready" | "error";
  selectedCode: string | null;
  query: string;
  hintDismissed: boolean;
  error: string | null;
};
```

- On mount: load snapshot → `ready` or `error`; restore `{ selectedCode, query }` from `sessionStorage`.
- On any selection/query change: persist to `sessionStorage`.
- Renders: `GlobeView`, `SearchBox`, `Legend`, `DetailPanel` (when selected), `InteractionHint` (until dismissed), `ErrorState` (when `error`).

### `<GlobeView />`
```ts
type GlobeViewProps = {
  countries: Country[];
  selectedCode: string | null;
  onSelect: (code: string) => void;
  onHover: (code: string | null) => void;
  reducedMotion: boolean;
};
```
- Countries with `totalPopulation == null` still render (outline only, no shading) and are selectable.
- Polygon colour is `diversityPalette(populationBucket(c.totalPopulation))`; `null` → `tokens.noData`.
- Rotation/zoom via OrbitControls; touch pinch zoom; `onHover(null)` on pointer exit.
- On `selectedCode` change → `pointOfView({ lat, lng, altitude }, transitionMs)`, `transitionMs = 0` when `reducedMotion`.
- Auto-rotation only when `!reducedMotion && selectedCode == null`; stops on first interaction.

### `<SearchBox />`
```ts
type SearchBoxProps = {
  countries: Country[];
  query: string;
  onQueryChange: (q: string) => void;
  onChoose: (code: string) => void;
};
```
- `< 2` chars → no suggestions, no "no results" message.
- `≥ 2` chars and no match → renders `"no countries found"`; does not call `onChoose`.
- Match ranking (see `search.ts`): exact `commonName`/`name` > prefix > substring > alias match; accent-folded.
- Choosing a suggestion calls `onChoose(code)`; parent focuses globe and opens the panel.

### `<DetailPanel />`
```ts
type DetailPanelProps = { country: Country; sources: Source[]; onClose: () => void };
```
- Always shows `commonName`, provenance for every figure.
- `totalPopulation == null` → population block shows `"Population data not available"` (never `0`).
- `diversityBreakdown` empty **and** `diversityIndicator == null` → single `"Diversity data not available"` block; population block still shown.
- Breakdown grouped by `dimension`; each group shows `groupName` + `share`%; indicator shows name, value, scale and reference year.
- Provides an accessible close button (keyboard/touch).

### `<Legend />`
```ts
type LegendProps = { buckets: PopulationBucket[]; noDataLabel: string };
type PopulationBucket = { min: number; max: number | null; color: string; label: string };
```
- Ranges derive from the population distribution in `snapshot.json`; a separate "no data" swatch is shown.

### `<InteractionHint />`
- Text covers rotate, zoom, select; dismissible; auto-hides after first interaction; re-shown only if `hintDismissed` is false.

### `<ErrorState />`
```ts
type ErrorStateProps = { message: string; onRetry: () => void };
```
- Rendered instead of a blank page when the snapshot fails to load/parse; `onRetry` re-runs the load.

## Module contracts

```ts
// src/lib/format.ts
formatPopulation(n: number): { exact: string; short: string | null } // "1,234,567" + "1.2M" when > 1e6
formatShare(p: number): string                                        // "42.5%"

// src/lib/search.ts
normalize(s: string): string                                          // NFD + strip diacritics + lower + trim
searchCountries(countries: Country[], query: string, limit?: number): Country[]

// src/lib/diversity.ts
populationBucket(pop: number | null, buckets: PopulationBucket[]): PopulationBucket | null
indicatorPosition(v: DiversityIndicator): number                       // 0..1 within [scaleMin, scaleMax]

// src/lib/dataset.ts
loadSnapshot(fetchImpl?: typeof fetch): Promise<DatasetSnapshot>       // validates schema, throws typed error
countryByCode(snapshot: DatasetSnapshot, code: string): Country | undefined
sourceById(snapshot: DatasetSnapshot, id: string): Source | undefined

// src/lib/persistence.ts
loadSelection(): { selectedCode: string | null; query: string }
saveSelection(s: { selectedCode: string | null; query: string }): void
```

## Error contract

`loadSnapshot` rejects with an `Error` whose message is user-safe (no stack traces, no URLs
with credentials). It is raised for: non-2xx response, JSON parse failure, and schema
validation failure. `App` maps it to `ErrorState`; retry calls `loadSnapshot` again.

## Provenance contract

Any rendered figure is accompanied, within the same view, by its source `name` and
`referenceYear` (FR-007, SC-007). Components must not accept raw numbers without a
corresponding `Source`; the dataset schema enforces the pairing at the data layer.
