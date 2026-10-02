# Implementation Plan: Population Globe

**Branch**: `001-population-globe` · **Date**: 2026-10-01 · **Spec**: [spec.md](./spec.md)

## Summary

Build a static, client-side single-page web app that renders an interactive 3D globe
choropleth of world population from a bundled, versioned dataset, and lets a visitor
inspect a country's population plus its diversity breakdown and a single diversity
indicator. The app is TypeScript + React built with Vite and run on Bun; the globe uses
`react-globe.gl`. There is no backend and no database: the dataset (country boundaries,
population and diversity figures with source/year provenance) ships as versioned JSON
assets in the repository. Test planning is a first-class part of this plan (see
**Test Strategy** and the generated `test-plan.md`).

## Technical Context

**Language/Version**: TypeScript 5.6, Bun 1.4.2 (runtime + package manager; currently the only runtime in the dev image — no npm/Node toolchain installed)
**Primary Dependencies**: React 18, Vite 6 (build/dev server), `react-globe.gl` (Three.js-based globe), `three`, `topojson-client`; build-time only: `world-atlas` (Natural Earth boundaries)
**Storage**: N/A — static bundled JSON/GeoJSON snapshot in `data/`; no server-side database and no `DATABASE_URL` (Postgres is available in the environment but not required by this feature)
**Testing**: Vitest (pure logic: formatting, search, diversity scaling, dataset selectors), `@testing-library/react` + `happy-dom` (component/integration), Playwright headless Chromium at `/ms-playwright` (end-to-end acceptance on port `3454`)
**Target Platform**: evergreen desktop and mobile browsers (Chromium/WebKit/Firefox baselines); viewports 360–1920px
**Project Type**: web-app (static SPA, no backend)
**Performance Goals / Constraints / Scale**: <2s from select to detail render; ≥95% of countries shaded on first load; <1s valid search suggestion; initial JS bundle kept small by lazy-loading the globe chunk; works with `prefers-reduced-motion`.

## Constitution Check

The project constitution at `.specify/memory/constitution.md` is still the unfilled template
(placeholder principles, version `[CONSTITUTION_VERSION]`), so this plan is checked against the
organization constitution and standards that govern this workspace.

- Spec-first delivery: ✅ plan and design artifacts derive from the reviewed `spec.md`; no requirement is invented.
- Small, reviewable increments / thin vertical slices: ✅ one phase per user story; each story is independently testable (US1 globe, US2 diversity, US3 search).
- Test planning inside implementation planning: ✅ Test Strategy below maps every acceptance scenario to a test layer; `test-plan.md` is generated in the tasks stage.
- Explicit human review gates: ✅ spec/plan/tasks/implement reviews remain required and unchanged.
- Prefer maintained libraries over custom glue: ✅ React, Vite, react-globe.gl, topojson-client, Playwright are maintained; no custom 3D or HTTP layer.
- Security baseline (no secrets, least privilege, no PII): ✅ no auth, no user data, no third-party network calls at runtime; dataset committed as public data with licenses recorded.
- Explicit system boundaries / cross-repo deps: ✅ single repo; dataset capture is a build-time dependency, documented in research.md.
- Reversible / YAGNI: ✅ static artifacts, no schema migrations, no data deletion; MVP excludes time series and accounts.

Re-check after design: ✅ holds — no new services, storage, or auth were introduced by data-model/contracts.

## Project Structure

```text
specs/001-population-globe/   plan.md, research.md, data-model.md, quickstart.md,
                              contracts/, test-plan.md (tasks stage), tasks.md (tasks stage)
```

```text
human-population-calculator/
├── index.html
├── package.json
├── bun.lock
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
├── playwright.config.ts
├── .env.example                     # documents that no runtime secrets are required
├── data/
│   ├── snapshot.json                # versioned dataset: countries + diversity + provenance
│   └── countries-110m.topo.json     # Natural Earth boundaries, keyed by ISO alpha-3
├── scripts/
│   ├── fetch-dataset.ts             # fetch/merge sources → data/snapshot.json
│   └── validate-dataset.ts          # validate snapshot against contracts/dataset.schema.json
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── types.ts
│   ├── components/
│   │   ├── GlobeView.tsx            # react-globe.gl choropleth + focus/rotation
│   │   ├── DetailPanel.tsx          # population, breakdown, indicator, provenance
│   │   ├── SearchBox.tsx            # suggestions after 2 chars
│   │   ├── Legend.tsx               # population shading ranges
│   │   ├── InteractionHint.tsx      # rotate / zoom / select hint, dismissible
│   │   ├── DataUnavailable.tsx      # explicit unavailable state
│   │   └── ErrorState.tsx           # load error + retry
│   ├── lib/
│   │   ├── dataset.ts               # load/validate snapshot, lookups by code
│   │   ├── format.ts                # thousands separators + short form
│   │   ├── search.ts                # accent-folding, local/common-name matching
│   │   ├── diversity.ts             # indicator scaling + palette buckets
│   │   └── persistence.ts           # sessionStorage for selection/search
│   └── styles/
│       ├── tokens.css               # colour-blind-safe palette, spacing
│       └── app.css
├── tests/
│   ├── unit/                        # Vitest: format, search, diversity, selectors
│   ├── component/                   # RTL: DetailPanel states, SearchBox, Legend
│   └── e2e/                         # Playwright: acceptance scenarios + responsive/error
└── .github/workflows/ci.yml         # install, typecheck, unit, build, e2e (single suite)
```

## Repositories

- primary — add the full application (Vite/React app, bundled dataset, tests, CI) to `rayedbajwa/human-population-calculator`.

## Test Strategy (feeds `test-plan.md`)

Layers and ownership; every layer is runnable without external keys (no live data APIs — dataset is bundled), so CI runs unit, component, build and E2E together on every change.

| Layer | Tool | Covers |
|-------|------|--------|
| Unit | Vitest | `format.ts` (FR-011), `search.ts` (FR-006, accent/duplicate names), `diversity.ts` (FR-005 scale/legend buckets), `dataset.ts` selectors and unavailable-value guards (FR-008, SC-003). |
| Component | Vitest + RTL | `DetailPanel` present/unavailable/error states (US2, FR-003/004/005/007/008/011), `SearchBox` suggestion/no-result states (US3, FR-006), `Legend` ranges (FR-002), `ErrorState` retry (FR-014). |
| E2E | Playwright (Chromium at `/ms-playwright`, `PORT=3454`) | US1–US3 acceptance scenarios end to end; loading/hint (FR-009/FR-012), rotate/zoom/select, resize state retention (FR-013), responsive viewports 360/768/1280/1920 (FR-010, SC-006), reduced-motion, touch emulation, forced data-load failure + retry (FR-014), provenance visible (SC-007). |
| Static checks | `tsc --noEmit` | Type contracts for entity/interface shapes. |
| Performance smoke | Playwright timing | Select→detail <2s (SC-002), search <1s (SC-004), first-load shading coverage ≥95% (SC-003). |

Test data: a trimmed fixture snapshot (≈10 countries including a no-population country, a
population-only country, an accent/duplicate name, and one territory) plus the full snapshot
for the shading-coverage check. Fixtures live under `tests/fixtures/` and are validated by the
same JSON schema as production data. Accessibility/responsive checks use Playwright viewport
sizing and `toHaveScreenshot`-free DOM assertions (no pixel snapshots in MVP).

## Complexity Tracking

No constitution violations identified.
