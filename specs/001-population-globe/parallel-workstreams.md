# Parallel Workstreams: Population Globe

**Feature**: `specs/001-population-globe/` · **Plan**: [plan.md](./plan.md) · **Tasks**: [tasks.md](./tasks.md)
**Version**: 1.0 · **Created**: 2026-10-01
**Repository scope**: all workstreams run in the single registered repository `rayedbajwa/human-population-calculator` (repository map label: `human-population-calculator`). No workstream spans two repositories.

## How to read this

- Every `[P]` task from `tasks.md` is placed in exactly one workstream.
- A workstream owns a disjoint set of files. Two workstreams must never edit the same file; shared hot files (`src/App.tsx`, `src/components/DetailPanel.tsx`) are owned by a single workstream and integrated sequentially.
- Workstreams that can start immediately after Setup/Foundational are marked **parallel-start: yes**; the rest only merge at the stated checkpoint.
- `### Repository` always names the registered repo (`human-population-calculator`).

## Parallelization map at a glance

| Workstream | Task range | Parallel-start | Blocks on |
|-----------|-----------|----------------|-----------|
| 1. Scaffolding, Tooling & CI | T001–T011 | yes (T002–T010 after T001) | — |
| 2. Dataset Pipeline & Contracts | T012–T018 | yes | — |
| 3. Core Logic Libraries | T019, T020, T030, T044 (+ T024, T025, T037, T041) | after T012 | T012 |
| 4. Presentational Components & Layout | T022, T023, T031, T033, T034, T035, T045 (+ T026, T042) | after WS3 | T012, T019, T030, T044 |
| 5. DetailPanel & App Integration | T021, T032, T036, T040, T046 (+ T027, T038) | partly | T021/T032 start early; T036/T040/T046 await WS4 merge |
| 6. E2E Acceptance Suite | T028, T029, T039, T043, T047–T051 | yes (authoring) | execution only, after WS5 merge |
| 7. Documentation & Polish | T052, T053 | yes | T053 after WS2 |

---

## Workstream 1: Scaffolding, Tooling & CI

### Repository
human-population-calculator

### Tasks
- T001 Scaffold the Bun/Vite/React app manifest in `package.json`
- T002 [P] Strict TypeScript options in `tsconfig.json`
- T003 [P] Vite SPA config in `vite.config.ts`
- T004 [P] Vitest config (happy-dom + Testing Library) in `vitest.config.ts`
- T005 [P] Playwright config (Chromium at `/ms-playwright`, port `3454`) in `playwright.config.ts`
- T006 [P] App HTML shell in `index.html`
- T007 [P] React entry point in `src/main.tsx`
- T008 [P] Design tokens in `src/styles/tokens.css`
- T009 [P] `.env.example` (documents no runtime secrets)
- T010 [P] `.gitignore` (node_modules, dist, Playwright artifacts)
- T011 Single CI workflow (`typecheck → unit → build → E2E`) in `.github/workflows/ci.yml`

### Inputs
- `plan.md` Project Structure and Technical Context (Bun, Vite 6, React 18, `react-globe.gl`).
- `test-plan.md` Environments table (port `3454`, `/ms-playwright`, `bun run test:all`).

### Outputs
- Runnable `bun run dev`, `build`, `test`, `test:all`, `typecheck`, dataset scripts wired in `package.json`.
- Green baseline CI workflow.

### Dependencies
- None. T001 first, then T002–T010 run in parallel (distinct files). T011 after T001–T010 so the CI script references real scripts.

### Scoped Files
`package.json`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, `playwright.config.ts`, `index.html`, `src/main.tsx`, `src/styles/tokens.css`, `.env.example`, `.gitignore`, `.github/workflows/ci.yml`, `bun.lock`

### QA Focus
- One CI workflow runs typecheck, unit, component, build and E2E **together** (org memory: do not split tests by feature); E2E must target `http://127.0.0.1:3454` and never port 3000.
- Confirm `test:all` is the single gate used by T054.

---

## Workstream 2: Dataset Pipeline & Contracts

### Repository
human-population-calculator

### Tasks
- T012 Define `DatasetSnapshot`, `Source`, `Country`, `DiversityBreakdown`, `DiversityIndicator`, `AppState` in `src/types.ts`
- T013 Bundle Natural Earth 1:110m boundaries keyed by ISO alpha-3 in `data/countries-110m.topo.json`
- T014 Capture versioned UN WPP population + CIA World Factbook diversity snapshot in `data/snapshot.json`
- T015 Add trimmed multi-case fixture in `tests/fixtures/snapshot.fixture.json`
- T016 Build-time fetch/merge script in `scripts/fetch-dataset.ts`
- T017 Offline schema validation script in `scripts/validate-dataset.ts`
- T018 Snapshot loading, schema validation and `countryByCode`/`sourceById` lookups in `src/lib/dataset.ts`

### Inputs
- `contracts/dataset.schema.json`, `data-model.md` (entities, validation rules 1–6).
- `research.md` for source licenses and reference years.

### Outputs
- `src/types.ts` contract consumed by every other workstream.
- Validated `data/snapshot.json` + fixture; `bun run validate:dataset` passing.

### Dependencies
- None for start. T012 must land before WS3/WS4/WS5 consume types. T016/T017 depend on the contracts, not on the app.

### Scoped Files
`src/types.ts`, `src/lib/dataset.ts`, `data/snapshot.json`, `data/countries-110m.topo.json`, `tests/fixtures/snapshot.fixture.json`, `scripts/fetch-dataset.ts`, `scripts/validate-dataset.ts`

### QA Focus
- T018 must expose the same validation rules used by `validate-dataset.ts`; WS3/WS4/WS5 consume its selectors and must not reimplement lookups.
- Run `validate-dataset.ts` against **both** the full snapshot and the fixture; dangling `sourceId`, negative/`NaN` population and missing provenance must fail.
- Probe data-shape edge cases (no-population, population-only, accent/duplicate name, territory) now so the fixture is stable for all test workstreams.

---

## Workstream 3: Core Logic Libraries

### Repository
human-population-calculator

### Tasks
- T019 Implement `populationBucket` and `indicatorPosition` in `src/lib/diversity.ts`
- T020 Implement sessionStorage selection/query persistence in `src/lib/persistence.ts`
- T030 Implement `formatPopulation` / `formatShare` in `src/lib/format.ts`
- T044 Implement accent-folded, ranked `searchCountries` in `src/lib/search.ts`
- T024 [P] Unit tests: population exact/short/share formatting in `tests/unit/format.test.ts`
- T025 [P] Unit tests: population bucketing and null/no-data guards in `tests/unit/diversity.test.ts`
- T037 [P] Unit tests: `indicatorPosition` at/outside scale bounds in `tests/unit/diversity.indicator.test.ts`
- T041 [P] Unit tests: accent folding, local/common/alias matching and ranking in `tests/unit/search.test.ts`

### Inputs
- `src/types.ts` (T012), `data-model.md` validation rules, `contracts/dataset.schema.json`.

### Outputs
- Pure, dependency-free helpers consumed by components and App state.
- Unit suites green and runnable without a browser.

### Dependencies
- T012 (types). T030/T044/T019 can be built in parallel; each test task is co-located with its implementation.

### Scoped Files
`src/lib/diversity.ts`, `src/lib/persistence.ts`, `src/lib/format.ts`, `src/lib/search.ts`, `tests/unit/format.test.ts`, `tests/unit/diversity.test.ts`, `tests/unit/diversity.indicator.test.ts`, `tests/unit/search.test.ts`

### QA Focus
- Unit tests exercise exact boundary values (scale min/max, `null` population, empty diversity) so component tests can stub helpers confidently.
- `persistence.ts` must degrade gracefully when `sessionStorage` is unavailable.

---

## Workstream 4: Presentational Components & Layout

### Repository
human-population-calculator

### Tasks
- T022 Responsive global layout styles (360–1920px, no horizontal scroll) in `src/styles/app.css`
- T023 `ErrorState` with safe message + retry in `src/components/ErrorState.tsx`
- T031 [P] `GlobeView` choropleth with rotate/zoom/hover/select/`pointOfView` in `src/components/GlobeView.tsx`
- T033 [P] `Legend` population ranges + no-data swatch in `src/components/Legend.tsx`
- T034 [P] Dismissible `InteractionHint` in `src/components/InteractionHint.tsx`
- T035 [P] Reusable `DataUnavailable` in `src/components/DataUnavailable.tsx`
- T045 [P] `SearchBox` suggestions + "no countries found" in `src/components/SearchBox.tsx`
- T026 [P] Component tests: legend ranges + no-data swatch in `tests/component/Legend.test.tsx`
- T042 [P] Component tests: suggestions, no-result, under-two-character state in `tests/component/SearchBox.test.tsx`

### Inputs
- `src/types.ts` (WS2), `src/lib/format.ts`, `src/lib/diversity.ts`, `src/lib/search.ts` (WS3).
- `contracts/ui-contracts.md` for prop/state contracts.

### Outputs
- Standalone presentational components that accept props and emit callbacks; no direct App coupling.
- Component tests for `Legend` and `SearchBox`.

### Dependencies
- WS2 (types) and WS3 (helpers). Does **not** own `App.tsx` or `DetailPanel.tsx`.

### Scoped Files
`src/components/GlobeView.tsx`, `src/components/Legend.tsx`, `src/components/InteractionHint.tsx`, `src/components/DataUnavailable.tsx`, `src/components/ErrorState.tsx`, `src/components/SearchBox.tsx`, `src/styles/app.css`, `tests/component/Legend.test.tsx`, `tests/component/SearchBox.test.tsx`

### QA Focus
- Components must remain pure/presentational so WS5 can wire them without edits here.
- Verify reduced-motion handling in `GlobeView`/`InteractionHint` and touch reachability (no hover-only control).
- Freeze exported prop signatures at merge so WS5 wiring is a one-way dependency.

---

## Workstream 5: DetailPanel & App Integration

### Repository
human-population-calculator

### Tasks
- T021 Implement top-level App state (snapshot load, error mapping, retry, persistence restore) in `src/App.tsx`
- T032 [P] `DetailPanel` population block + provenance + accessible close in `src/components/DetailPanel.tsx`
- T036 Wire `GlobeView`, `Legend`, `DetailPanel`, `InteractionHint` into App selection state in `src/App.tsx`
- T040 Extend `DetailPanel` with dimension-grouped rows, indicator block and unavailable fallback in `src/components/DetailPanel.tsx`
- T046 Wire `SearchBox` choice to globe focus + detail panel in `src/App.tsx`
- T027 [P] Component tests: population detail block, separators, short form, provenance in `tests/component/DetailPanel.population.test.tsx`
- T038 [P] Component tests: grouped breakdown, indicator, unavailable state, provenance in `tests/component/DetailPanel.diversity.test.tsx`

### Inputs
- WS2 types and `src/lib/dataset.ts` selectors (both from WS2) and WS3 helpers.
- WS4 component prop contracts (frozen at WS4 merge).

### Outputs
- Integrated app: load → shade → select → detail → search → focus, with persistence and error states.
- `DetailPanel` and App component tests.

### Dependencies
- T021 can start once WS2's T018 (`src/lib/dataset.ts`) lands; T032 can start once T012 lands. T036, T040 and T046 require the WS4 merge checkpoint (component signatures frozen). This workstream is the **serialization point** for `src/App.tsx` and `src/components/DetailPanel.tsx`.

### Scoped Files
`src/App.tsx`, `src/components/DetailPanel.tsx`, `tests/component/DetailPanel.population.test.tsx`, `tests/component/DetailPanel.diversity.test.tsx`

### QA Focus
- Story order is enforced here: US1 wiring (T036) → US2 detail extension (T040) → US3 search wiring (T046). No other workstream may touch `App.tsx` or `DetailPanel.tsx`.
- Verify T036 does not regress the WS4 components; re-run WS4 component tests after wiring.
- Merge checkpoint: WS4 merged, WS5 tests + `typecheck` green before WS6 E2E execution.

---

## Workstream 6: E2E Acceptance Suite

### Repository
human-population-calculator

### Tasks
- T028 [P] E2E: load, shading, legend, rotate/zoom, country selection in `tests/e2e/globe.spec.ts`
- T029 [P] E2E: dismissible first-use hint in `tests/e2e/globe-hint.spec.ts`
- T039 [P] E2E: complete and missing diversity data in `tests/e2e/diversity.spec.ts`
- T043 [P] E2E: suggestion, globe focus, no-match in `tests/e2e/search.spec.ts`
- T047 [P] E2E: error state + retry with blocked snapshot request in `tests/e2e/error-retry.spec.ts`
- T048 [P] E2E: responsive viewports 360/768/1280/1920 in `tests/e2e/responsive.spec.ts`
- T049 [P] E2E: reduced-motion + touch emulation in `tests/e2e/reduced-motion-touch.spec.ts`
- T050 [P] E2E: performance smoke (select→detail, search, shading coverage) in `tests/e2e/performance.spec.ts`
- T051 [P] E2E: provenance visibility for every figure in `tests/e2e/provenance.spec.ts`

### Inputs
- `test-plan.md` acceptance-scenario + coverage tables (the authoritative spec-to-test map).
- Running production-like app (`bun run build && bun run preview --port 3454`).

### Outputs
- Full Playwright E2E suite covering US1–US3 plus responsive/error/reduced-motion/touch/performance/provenance.
- Runnable keyless and offline against the bundled snapshot.

### Dependencies
- Authoring can begin in parallel from `test-plan.md` once fixtures (T015) exist. **Execution** requires the WS5 merge checkpoint. T050 shading coverage requires `data/snapshot.json` (WS2).

### Scoped Files
`tests/e2e/*.spec.ts` (all files listed above)

### QA Focus
- Every test uses the fixture/full snapshot; no live data APIs and no keys (org memory: key-requiring E2E may be ignored, but none are expected here).
- Assert screenshots-free DOM behaviour; no pixel snapshots in MVP.
- T047 must simulate a failed `snapshot.json` request via route interception, then confirm retry recovers.
- T051 is the SC-007 guard: fail if any rendered figure lacks source name + reference year.

---

## Workstream 7: Documentation & Polish

### Repository
human-population-calculator

### Tasks
- T052 [P] `README.md` with run/test commands and dataset provenance summary
- T053 [P] `data/README.md` with dataset provenance, version and license notes

### Inputs
- `plan.md`, `test-plan.md`, `research.md` (licenses/years), validated snapshot (WS2).

### Outputs
- Onboarding README and dataset provenance/license documentation.

### Dependencies
- T053 after WS2 validates the snapshot; T052 largely independent.

### Scoped Files
`README.md`, `data/README.md`

### QA Focus
- README test commands must match the CI `test:all` gate exactly.
- Data README must not contradict the mandatory source/year provenance enforced by the schema.

---

## Tasks that must stay sequential

- **T001 → T002–T010** — the manifest defines the scripts every config references.
- **T011** — CI after T001–T010 so the workflow calls real scripts.
- **T012 → everything** — `src/types.ts` is the shared contract; nothing downstream compiles without it.
- **Within WS5: T021 → T036 → T040 → T046** — all edit `src/App.tsx` and/or `src/components/DetailPanel.tsx`; one writer at a time.
- **Cross-workstream: WS4 merge → T036/T040/T046** — App wiring waits on frozen component prop signatures.
- **T015 fixture → WS6 test authoring** — E2E/component assertions need stable fixture cases.
- **T054** — after all story, polish and E2E tasks; single `test:all` run.
- **T055 → T056 → T057 → T058 → T059/T060** — delivery is strictly ordered (deploy workflow, PR, CI + human review, merge, verify deploy, UAT). T057 requires a human approval gate.

## QA coordination notes (avoiding integration conflicts)

1. **One writer per file.** The disjoint Scoped Files lists are the contract. If a change is needed in another workstream's file, request it through that workstream instead of editing it; never run two workstreams against `src/App.tsx` or `src/components/DetailPanel.tsx`.
2. **Types are frozen at T012.** Contract changes after WS2 starts require re-running `typecheck` in every active workstream before its next merge.
3. **Component signatures are frozen at the WS4 merge checkpoint.** WS5 wiring treats WS4 exports as read-only.
4. **Tests are co-owned with their layer, not centralized.** Unit tests live with WS3, component tests with WS4/WS5, E2E with WS6. This prevents two agents editing the same test file.
5. **Merge checkpoints**: (a) WS1+WS2 merged and `validate:dataset` green → WS3/WS4 unblock; (b) WS3+WS4 merged and component/unit suites green → WS5 wiring; (c) WS5 merged and `typecheck` + unit + component green → WS6 execution; (d) WS6 green → T054 full `test:all`.
6. **Run the full suite before every merge**, not per-feature subsets (org memory). CI must run typecheck, unit, component, build and E2E together.
7. **E2E port discipline**: only `3454`; never `3000` (reserved by the agent host).
8. **Security/privacy**: no secrets, no runtime network calls; `.env.example` documents this. Do not add credentials to fixtures or workflows.
9. **QA owns acceptance**: the final `test-plan.md` UAT table (T060) runs post-deploy and is the release gate; workstream tests do not substitute for it.

## Recommendation

Start with **3 concurrent workstreams** — WS1 (Scaffolding & CI), WS2 (Dataset & Contracts) and WS3 (Core Logic) — since their files are fully disjoint and only WS3 depends on T012. Once WS1/WS2 merge, fan out to **3–4** (WS3, WS4, WS6 authoring, WS7) but keep WS5 as a **single-writer lane**: it must not run concurrently with any other workstream that touches `App.tsx`/`DetailPanel.tsx`. Cap concurrent execution at **4**, and require a full `test:all` run at each checkpoint before opening the next lane. Sequential work (T001, T011, T018, T054–T060) should not be parallelized.
