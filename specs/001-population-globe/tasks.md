# Tasks: Population Globe

**Input**: `specs/001-population-globe/` (plan.md, spec.md; data-model.md, contracts/, research.md, quickstart.md, test-plan.md)
**Tests**: included — the spec, plan Test Strategy and `test-plan.md` require unit, component and E2E coverage.

## Phase 1: Setup

- [x] T001 Scaffold the Bun/Vite/React app manifest with all dev, build, test and dataset scripts in package.json
- [x] T002 [P] Add strict TypeScript compiler options for the SPA and scripts in tsconfig.json
- [x] T003 [P] Add the Vite React SPA build and dev-server config in vite.config.ts
- [x] T004 [P] Add the Vitest config with happy-dom and Testing Library setup in vitest.config.ts
- [x] T005 [P] Add the Playwright config using the pre-installed Chromium at /ms-playwright on port 3454 in playwright.config.ts
- [x] T006 [P] Add the app HTML shell with the React mount node and reduced-motion viewport meta in index.html
- [x] T007 [P] Add the React entry point that mounts `<App />` in src/main.tsx
- [x] T008 [P] Add the colour-blind-safe palette, spacing and typography tokens in src/styles/tokens.css
- [x] T009 [P] Add .env.example documenting that no runtime secrets are required in .env.example
- [x] T010 [P] Add .gitignore entries for node_modules, dist and Playwright artifacts in .gitignore
- [x] T011 Add the single CI workflow running typecheck, unit, build and E2E together in .github/workflows/ci.yml

## Phase 2: Foundational (blocks every story)

- [x] T012 Define the `DatasetSnapshot`, `Source`, `Country`, `DiversityBreakdown`, `DiversityIndicator` and `AppState` interfaces in src/types.ts
- [x] T013 Bundle Natural Earth 1:110m country boundaries keyed by ISO alpha-3 in data/countries-110m.topo.json
- [x] T014 Capture the versioned UN WPP population and CIA World Factbook diversity snapshot with per-figure provenance in data/snapshot.json
- [x] T015 Add the trimmed multi-case fixture snapshot (no-population, population-only, accent/duplicate name, territory) in tests/fixtures/snapshot.fixture.json
- [x] T016 Implement the build-time fetch/merge script that records source, reference year and license in scripts/fetch-dataset.ts
- [x] T017 Implement the offline schema validation script against the dataset contract in scripts/validate-dataset.ts
- [x] T018 Implement snapshot loading, schema validation and `countryByCode`/`sourceById` lookups in src/lib/dataset.ts
- [x] T019 Implement `populationBucket` and `indicatorPosition` helpers with range guards in src/lib/diversity.ts
- [x] T020 Implement selection and query persistence to sessionStorage in src/lib/persistence.ts
- [x] T021 Implement top-level App state with snapshot load, error mapping, retry and persistence restore in src/App.tsx
- [x] T022 Add responsive global layout styles covering 360–1920px with no horizontal scroll in src/styles/app.css
- [x] T023 Implement `ErrorState` with a user-safe message and retry action in src/components/ErrorState.tsx

## Phase 3: User Story 1 - Explore world population on an interactive globe (P1) 🎯 MVP

**Goal**: A rotatable, zoomable 3D globe shades every country by total population with a legend, first-use hint and a selectable detail panel. · **Independent test**: Open the page at desktop width; the globe renders, countries are shaded, a legend is visible, the hint is shown, and selecting a country opens a panel with name, exact + short population and reference year.

- [x] T024 [P] [US1] Add unit tests for population exact/short formatting and share formatting in tests/unit/format.test.ts
- [x] T025 [P] [US1] Add unit tests for population bucketing and null/no-data guards in tests/unit/diversity.test.ts
- [x] T026 [P] [US1] Add component tests for legend ranges and the no-data swatch in tests/component/Legend.test.tsx
- [x] T027 [P] [US1] Add component tests for the population detail block, thousands separators, short form and provenance in tests/component/DetailPanel.population.test.tsx
- [x] T028 [P] [US1] Add E2E acceptance tests for load, shading, legend, rotate/zoom and country selection in tests/e2e/globe.spec.ts
- [x] T029 [P] [US1] Add E2E test for the dismissible first-use interaction hint in tests/e2e/globe-hint.spec.ts
- [x] T030 [US1] Implement `formatPopulation` and `formatShare` in src/lib/format.ts
- [x] T031 [P] [US1] Implement `GlobeView` choropleth with rotate, zoom, hover, select and `pointOfView` focus in src/components/GlobeView.tsx
- [x] T032 [P] [US1] Implement `DetailPanel` with the population block, provenance and accessible close button in src/components/DetailPanel.tsx
- [x] T033 [P] [US1] Implement `Legend` population ranges and no-data swatch in src/components/Legend.tsx
- [x] T034 [P] [US1] Implement the dismissible `InteractionHint` covering rotate, zoom and select in src/components/InteractionHint.tsx
- [x] T035 [P] [US1] Implement the reusable `DataUnavailable` explicit state block in src/components/DataUnavailable.tsx
- [x] T036 [US1] Wire `GlobeView`, `Legend`, `DetailPanel` and `InteractionHint` into App selection state in src/App.tsx

## Phase 4: User Story 2 - Understand population diversity per country (P1)

**Goal**: Selecting a country shows its ethnic/linguistic/religious breakdown shares and a single diversity indicator with scale, year and source, or an explicit unavailable state. · **Independent test**: Select a fixture country with diversity data and confirm grouped shares, the indicator and provenance; select a population-only country and confirm the explicit unavailable state.

- [x] T037 [P] [US2] Add unit tests for `indicatorPosition` scaling at and outside the scale bounds in tests/unit/diversity.indicator.test.ts
- [x] T038 [P] [US2] Add component tests for dimension-grouped breakdown, indicator, unavailable state and provenance in tests/component/DetailPanel.diversity.test.tsx
- [x] T039 [P] [US2] Add E2E acceptance tests for complete and missing diversity data in tests/e2e/diversity.spec.ts
- [x] T040 [US2] Extend `DetailPanel` with dimension-grouped breakdown rows, the indicator block and the unavailable fallback in src/components/DetailPanel.tsx

## Phase 5: User Story 3 - Find a specific country quickly (P1)

**Goal**: Typing at least two characters suggests matching countries and choosing one focuses the globe and opens its detail panel. · **Independent test**: Type a country name, choose a suggestion, and confirm the globe centres on it with the panel open; type nonsense and confirm the no-match message with the globe unchanged.

- [x] T041 [P] [US3] Add unit tests for accent folding, local/common/alias matching and ranking in tests/unit/search.test.ts
- [x] T042 [P] [US3] Add component tests for suggestions, the no-result message and the under-two-character state in tests/component/SearchBox.test.tsx
- [x] T043 [P] [US3] Add E2E acceptance tests for suggestion, globe focus and no-match behaviour in tests/e2e/search.spec.ts
- [x] T044 [US3] Implement accent-folded, ranked `searchCountries` in src/lib/search.ts
- [x] T045 [P] [US3] Implement `SearchBox` suggestions and the "no countries found" message in src/components/SearchBox.tsx
- [x] T046 [US3] Wire `SearchBox` choice to globe focus and detail panel in src/App.tsx

## Phase 6: Polish & Cross-Cutting

- [x] T047 [P] Add the E2E error-state and retry test with a blocked snapshot request in tests/e2e/error-retry.spec.ts
- [x] T048 [P] Add the E2E responsive viewport tests at 360/768/1280/1920 in tests/e2e/responsive.spec.ts
- [x] T049 [P] Add the E2E reduced-motion and touch-emulation tests in tests/e2e/reduced-motion-touch.spec.ts
- [x] T050 [P] Add the E2E performance smoke tests for select-to-detail, search and shading coverage in tests/e2e/performance.spec.ts
- [x] T051 [P] Add the E2E provenance visibility check for every displayed figure in tests/e2e/provenance.spec.ts
- [x] T052 [P] Add the README with run/test commands and dataset provenance summary in README.md
- [x] T053 [P] Add the dataset provenance, version and license notes in data/README.md
- [x] T054 Run typecheck, unit, build and the full E2E suite together via `test:all` and fix all failures in package.json

## Delivery

- [x] T055 Add the static deployment workflow that publishes `dist` from `main` in .github/workflows/deploy.yml
- [ ] T056 Open a pull request from `001-population-globe` into `main` in rayedbajwa/human-population-calculator
- [ ] T057 Get CI green and a human review approval on the pull request in rayedbajwa/human-population-calculator
- [ ] T058 Merge the pull request into `main` after CI and review pass in rayedbajwa/human-population-calculator
- [ ] T059 Confirm the deployment workflow published the static build from `main` in rayedbajwa/human-population-calculator
- [ ] T060 Run the UAT and final acceptance checks from test-plan.md against the deployed environment in rayedbajwa/human-population-calculator

## Dependencies

- Story order: Setup (Phase 1) → Foundational (Phase 2) → US1 → US2 → US3 → Polish → Delivery. Foundational blocks every story because all three read the shared snapshot, dataset selectors and App state.
- US1 is the MVP: a first-time visitor can load the shaded globe and read a country's population. US2 depends on US1's `DetailPanel` mount point; US3 depends on US1's globe focus and selection state. There are no cross-story merge blockers beyond this order.
- Polish E2E tasks depend on the stories they exercise; T054 depends on all story and polish tasks.
- Delivery runs in the single repository `rayedbajwa/human-population-calculator`; no task waits on another repository's merge. T057–T060 depend in order on T056; T059/T060 depend on T058.

## Review fixes (2026-10-02, iteration 2)

Addresses every finding in `code-review.md` (`Code Review Status: CHANGES_REQUESTED`).

- [x] T061 [MAJOR] Clarify SC-003's denominator as the Natural Earth boundary features the globe renders, add the committed reproducible check over the real snapshot, and correct the README figures (`spec.md`, `plan.md`, `test-plan.md`, `data/README.md`, `tests/unit/dataset.coverage.test.ts`, `tests/e2e/performance.spec.ts`)
- [x] T062 [MAJOR] Add `tests/unit/dataset.test.ts` for `parseSnapshot`/`loadSnapshot` (valid input, every rejection branch, network/HTTP/parse failures) and the `countryByCode`/`sourceById` selectors
- [x] T063 [MAJOR] Surface a boundary-fetch failure with a retry and add the blocked-boundaries E2E case (`src/components/GlobeView.tsx`, `tests/e2e/error-retry.spec.ts`)
- [x] T064 [MAJOR] Add observable camera/focus signals and assert rotation (US1-2), zoom-with-selection (US1-4) and search focus (US3-2) (`src/components/GlobeView.tsx`, `tests/e2e/globe.spec.ts`, `tests/e2e/search.spec.ts`)
- [x] T065 [MINOR] Fix the antimeridian centroid with a largest-gap longitude unwrap and unit-test it (`src/lib/geo.ts`, `src/components/GlobeView.tsx`, `tests/unit/geo.test.ts`)
- [x] T066 [MINOR] Implement the hover readout instead of dead `onHover` plumbing (`src/App.tsx`, `src/components/GlobeView.tsx`, `src/styles/app.css`)
- [x] T067 [MINOR] Add `ErrorState` and `DataUnavailable` component tests (`tests/component/ErrorState.test.tsx`, `tests/component/DataUnavailable.test.tsx`)
- [x] T068 [MINOR] Add a Biome lint gate wired into `test:all` and CI (`biome.json`, `package.json`, `.github/workflows/ci.yml`, `src/components/SearchBox.tsx`, `src/components/GlobeView.tsx`)
- [x] T069 [MINOR] Implement the ARIA combobox keyboard pattern and document the population-source deviation (`src/components/SearchBox.tsx`, `tests/component/SearchBox.test.tsx`, `data/README.md`)

Re-run record (this iteration): `bun run lint` clean (42 files), `bun run typecheck` clean, `bun run test` **81 passed / 0 failed** (13 files), and the four affected E2E specs (`globe`, `search`, `error-retry`, `performance`) **14 passed / 0 failed**. The full `bun run test:all` gate is re-run below.

## Implementation Notes (2026-10-02)

- T001–T055 implemented in this repository (branch `001-population-globe`). Delivery T056–T060 remain open pending a push and human approval for merge, deploy and UAT.
- Dataset: real World Bank `SP.POP.TOTL` population (215/250 countries) and CIA World Factbook diversity (215/250) captured by `scripts/fetch-dataset.ts`; the diversity indicator is derived from the Factbook ethnic shares and is named as derived (see `data/README.md` for the documented deviation from `research.md`).
- Toolchain: Vitest 3 (Vite 6 compatibility), React dev build forced in `vitest.config.ts` because the host exports `NODE_ENV=production`, and E2E uses `PLAYWRIGHT_PORT` (default 3454) because the host reserves `PORT`.
- Baseline: `bun run validate:dataset` (2 files, non-fatal share-sum warnings), `bun run lint` clean, `bun run typecheck`, 81 unit/component tests, `bun run build`, and the Playwright E2E suite all pass via `bun run test:all`.

## Review fixes (2026-10-02, iteration 3)

Addresses the three new MAJOR findings, the MINORs and the NITs in `code-review.md` (`Code Review Status: CHANGES_REQUESTED`). MAJOR 4 (pull request + CI) is a delivery action still awaiting approval.

- [x] T070 [MAJOR] Rewrite Factbook share parsing so ranges (`15-20%` → midpoint), qualifiers (`more than` / `approximately` / `<1%`), HTML entities and the `93/1%` slash-decimal are captured instead of silently dropped; add a `90–110%` per-dimension completeness guard that marks implausible dimensions unavailable; regenerate `data/snapshot.json` (`scripts/factbook-shares.ts`, `scripts/fetch-dataset.ts`, `data/snapshot.json`)
- [x] T071 [MAJOR] Escalate out-of-window dimension totals from warnings to validator errors and prove the rule with committed tests over the real snapshot and the real Factbook strings (`scripts/validate-dataset.ts`, `tests/unit/factbook-shares.test.ts`, `tests/unit/dataset.quality.test.ts`, `tests/fixtures/snapshot.fixture.json`)
- [x] T072 [MAJOR] Emit relative asset URLs (`base: './'`) so the GitHub Pages project site renders, and copy only the two runtime dataset files into `dist/data` (`vite.config.ts`)
- [x] T073 [MINOR] Expose the globe controls' `autoRotate` state and assert it is off under reduced motion; assert the short population form in the E2E selection test (`src/components/GlobeView.tsx`, `tests/e2e/reduced-motion-touch.spec.ts`, `tests/e2e/globe.spec.ts`)
- [x] T074 [MINOR] Make `Enter` in the search combobox choose the first match when no option is highlighted, with a component test (`src/components/SearchBox.tsx`, `tests/component/SearchBox.test.tsx`)
- [x] T075 [NIT] Reword the two WIP commits to Conventional Commits with the `population-globe` scope; document the parsing guard and relative base (`data/README.md`, `README.md`)

### Iteration 3 test record

- `bun run lint` clean (45 files); `bun run typecheck` clean.
- `bun run test` **97 passed / 0 failed** (15 files; +16: 12 `factbook-shares`, 3 `dataset.quality`, 1 SearchBox Enter).
- `bun run validate:dataset` exit 0 — both files schema-valid; all 485 dimension groups inside 90–110% (only in-window 99–101 rounding warnings remain, no errors).
- `bun run build` OK; `dist/index.html` uses `./assets/...` and `dist/data/` contains only `snapshot.json` + `countries-110m.topo.json`.
- Affected Playwright specs (`globe`, `search`, `error-retry`, `reduced-motion-touch`, `diversity`, `performance`) **18 passed / 0 failed**.
- Sub-path check (manual, reproducible): `dist/` served under `/human-population-calculator/` loaded with Chromium, shaded 169/177 boundary features, all assets and both `data/*.json` requests resolved under the sub-path, no console errors.
- MAJOR 4 remains open: the remote `origin` has no refs, so T056 needs a push and PR (plus the T057 human review gate) before CI can be read.
  - Iteration 3 push attempt (approved): `git push -u origin main` / `001-population-globe` both failed with `403 — Permission to rayedbajwa/human-population-calculator denied to spaces-spaces-production-rayed[bot]`; the GitHub API reports `permissions: {push:false, pull:false}`. The branch and the empty `main` base commit (`c535fae`) are ready locally, but a credential with write access (or the delivery stage) must push them and open the PR.

### Iteration 3 implementation notes

- Factbook parsing/coverage now lives in `scripts/factbook-shares.ts` so it is unit-tested without network access; the generator imports it.
- The completeness guard drops a dimension whose parsed shares sum outside 90–110% (partial fields such as `RUS/religious` = 32% and multi-response language censuses such as `TKL/linguistic` = 182.5%). Confirmed after regeneration: 0 of 485 groups outside the window; `RUS/religious` is absent, `IRQ/ethnic` parses to 100.0% from its ranges.

## Review fixes (2026-10-02, verify-driven re-run)

Addresses the MINORs and NITs left in `code-review.md` (`Code Review Status: CHANGES_REQUESTED`). The single MAJOR (no PR/CI) is still externally blocked — see T056.

- [x] T076 [MINOR] `cleanGroupName` now strips leading conjunctions (`and`/`or`/`the`/`of`/`with`/`including`), a trailing `~`, unmatched trailing `)`, trailing `.` and stray whitespace; regenerated `data/snapshot.json` and added a label-hygiene assertion to `tests/unit/dataset.quality.test.ts` (`scripts/factbook-shares.ts`, `data/snapshot.json`, `tests/unit/dataset.quality.test.ts`)
- [x] T077 [MAJOR, found while fixing T076] The Factbook number token now accepts a leading-dot decimal (`.06%`), which the previous regex read as `6%` and inflated `BRA/religious` from 100.5% to 107.5%; covered by `tests/unit/factbook-shares.test.ts` and the regenerated snapshot (`scripts/factbook-shares.ts`, `data/snapshot.json`)
- [x] T078 [MINOR] Added `scripts/check-relative-assets.ts`, wired into `bun run build`, so CI and the deploy workflow fail if `dist/index.html` emits root-absolute `/assets/...` URLs (the E2E suite cannot catch it because `vite preview` serves from the domain root) (`scripts/check-relative-assets.ts`, `package.json`)
- [x] T079 [NIT] `decodeEntities` leaves an unrecognised named entity intact instead of collapsing it to a space, with a test (`scripts/factbook-shares.ts`, `tests/unit/factbook-shares.test.ts`)
- [x] T080 [NIT] Corrected the `test-plan.md` Static-layer row so the `contracts/ui-contracts.md` coverage claim matches reality (component tests exercise the shapes; no dedicated contract test) (`specs/001-population-globe/test-plan.md`)

### Verify re-run test record

- `bun run lint` clean (46 files); `bun run typecheck` clean.
- `bun run test` **101 passed / 0 failed** (15 files; +4: 3 parser/label, 1 label hygiene). Targeted run of the changed files: 21/21.
- `bun run validate:dataset` exit 0 — 0 errors; all 485 dimension groups inside 90–110% (min/max 90.0–107.7 before, re-checked after regeneration).
- Regenerated snapshot scan: 0/485 groups out of window, 0 artifact group names; `BRA/religious` "Indigenous religions" is 0.1% (was misread as 6%).
- `bun run build` OK and now runs the relative-asset guard: `✓ dist/index.html uses relative asset URLs`.
- E2E not run in this stage (review/verify run it); the E2E-relevant countries are unchanged (USA ethnic+indicator, CIV no diversity, NGA with data).

## Verification-driven tests (2026-10-02, iteration 3)

Closes the automatable gaps in `verification-report.md`; the human-usability parts of SC-001/SC-005 and the deployed UAT (T060) remain manual.

- [x] T081 [SC-001] Add `tests/e2e/discovery.spec.ts`: from a cold start and using only on-screen controls, reach the most populous country (computed from the served snapshot) and assert its exact population is shown. The 60-second human measurement stays a UAT item.
- [x] T082 [SC-005] Add `tests/component/InteractionHint.test.tsx` asserting the hint documents rotate, zoom and select and is dismissible; the gesture mechanics remain covered by `tests/e2e/globe.spec.ts`.
- [x] T083 [security] Add `tests/component/DetailPanel.security.test.tsx`: a markup-like country name and group name render as text (no `<script>`/`<img>` element is created).
- [x] T084 [FR-012 + review NIT] Assert the snapshot's population source year equals the maximum per-country reference year, and extend the label-hygiene regex to reject a residual `&…;` entity (`tests/unit/dataset.quality.test.ts`).
- [x] T085 Map the new tests in `test-plan.md` (SC-001, SC-005 rows) and record this iteration.

### Iteration 3 test record

- `bun run lint` clean (49 files); `bun run typecheck` clean.
- Changed unit/component tests: `dataset.quality.test.ts` 5/5, `InteractionHint.test.tsx` 2/2, `DetailPanel.security.test.tsx` 1/1.
- New E2E `discovery.spec.ts` 1/1.
- No production code changed in this iteration.
- Still open: SC-001/SC-005 human-usability validation and the deployed UAT (T060), both blocked on T056–T059 (no PR/CI/deploy).
