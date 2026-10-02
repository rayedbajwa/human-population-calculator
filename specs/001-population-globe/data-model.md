# Data Model: Population Globe

All data is read-only at runtime. Figures are bundled in a versioned snapshot; nothing is
created or mutated by the app. `source` + `referenceYear` are mandatory wherever a number is
present, so no figure can render without provenance (SC-007).

## Entities

### DatasetSnapshot
| Field | Type | Rules |
|-------|------|-------|
| `version` | string | required, semver-like; identifies the committed snapshot |
| `retrievedDate` | string (ISO date) | required |
| `sources` | Source[] | required, ≥1 |
| `countries` | Country[] | required, unique by `code` |

### Source
| Field | Type | Rules |
|-------|------|-------|
| `id` | string | required, unique; referenced by entities |
| `name` | string | required, human-readable, shown in UI |
| `url` | string (URL) | required |
| `license` | string | required; e.g. `public-domain`, `CC-BY-4.0` |
| `referenceYear` | integer | required |

### Country
| Field | Type | Rules |
|-------|------|-------|
| `code` | string | required, unique, ISO 3166-1 alpha-3; join key with boundaries |
| `name` | string | required, official/local name |
| `commonName` | string | required, searchable display name |
| `aliases` | string[] | optional, extra search terms (accented/exonym forms) |
| `region` | string | required |
| `boundaryId` | string | optional; TopoJSON feature id when it differs from `code` |
| `totalPopulation` | integer \| null | ≥0 when present; `null` = no data |
| `populationSourceId` | string | required iff `totalPopulation != null` |
| `populationReferenceYear` | integer | required iff `totalPopulation != null` |
| `diversityBreakdown` | DiversityBreakdown[] | may be empty → unavailable state |
| `diversityIndicator` | DiversityIndicator \| null | `null` = unavailable state |

### DiversityBreakdown
| Field | Type | Rules |
|-------|------|-------|
| `dimension` | `"ethnic" \| "linguistic" \| "religious"` | required |
| `groupName` | string | required, non-empty |
| `share` | number | required, 0–100 (percent); rows for one country+dimension should sum to ~100 |
| `sourceId` | string | required |
| `referenceYear` | integer | required |

### DiversityIndicator
| Field | Type | Rules |
|-------|------|-------|
| `name` | string | required, published index name (e.g. ethnic fractionalisation) |
| `value` | number | required, within `[scaleMin, scaleMax]` |
| `scaleMin` | number | required (0 for fractionalisation) |
| `scaleMax` | number | required (1 for fractionalisation) |
| `sourceId` | string | required |
| `referenceYear` | integer | required |

## Relationships

- `DatasetSnapshot.countries[]` → one `Country` per row (1:1 with boundary features by `code`/`boundaryId`).
- `Country.diversityBreakdown[]` → many rows, grouped at render time by `dimension`.
- `Country.diversityIndicator` → 0 or 1 row.
- `*SourceId` references resolve inside `DatasetSnapshot.sources`; dangling references are a validation error.

## Validation Rules

Enforced by `contracts/dataset.schema.json` and `scripts/validate-dataset.ts`:
1. `countries[].code` unique and well-formed; every boundary feature used has a matching country and vice versa (unmatched features render as "no data", still selectable/searchable).
2. `totalPopulation` present ⇒ both `populationSourceId` and `populationReferenceYear` present; `totalPopulation` is `null` rather than `0` when unknown.
3. `share` values within 0–100; per country+dimension set non-empty rows; flag (non-fatal warning) if a dimension sums outside 99–101.
4. `value` within `[scaleMin, scaleMax]`; `scaleMin < scaleMax`.
5. Every `sourceId` resolves; every referenced source's `referenceYear` matches the row's `referenceYear` unless the entity documents a different one.
6. No negative population, no `NaN`/`Infinity` anywhere.

## State Transitions

**Country data-availability state** (derived, never stored):

```text
loading ──snapshot OK──► ready
   │                       ├─ has population + diversity  → full detail
   │                       ├─ population only             → population + "diversity not available"
   │                       ├─ diversity only              → "population not available" + diversity
   │                       └─ neither                     → "no data"; excluded from shading legend
   └─snapshot/parse fails──► error (ErrorState with retry) ──retry──► loading
```

**Selection/search state** (session-scoped, persisted to `sessionStorage`):

```text
initial (world view, hint visible)
  ├─ hover country ──► transient highlight (no panel change)
  ├─ select country ──► selected(code) + focus globe + detail panel open
  ├─ search ≥2 chars ──► suggestions → choose ──► selected(code) + focus + panel
  ├─ search no match ──► "no countries found", selection unchanged
  └─ resize/rotate/reload ──► restore selected(code) + query from sessionStorage
```

Auto-rotation starts only when `prefers-reduced-motion` is not set and stops on first user interaction.
