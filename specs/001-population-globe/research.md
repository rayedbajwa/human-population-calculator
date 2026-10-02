# Research: Population Globe

Resolves the technology, dataset and integration choices behind [plan.md](./plan.md).

## 1. Runtime, package manager and build tool

**Decision**: Bun 1.4.2 as runtime and package manager; Vite 6 as dev server/bundler; TypeScript 5.6.
**Rationale**: Bun is the only JS runtime/package manager installed in the dev and test image (no npm/Node). Vite is the maintained standard build tool for React SPAs, produces a static bundle, and its dev server is enough for Playwright.
**Alternatives considered**: Node + npm (not installed); Bun's native HTML bundler (fewer plugins, less familiar review surface); Next.js (server features and routing are out of scope for a static dataset app).

## 2. UI framework

**Decision**: React 18 + TypeScript, function components and hooks, plain CSS tokens.
**Rationale**: Mature ecosystem and first-class support from the chosen globe library; component boundaries map cleanly to the three user stories; no state library needed.
**Alternatives considered**: Vanilla TS (more manual DOM/update code); Svelte/Vue (smaller ecosystem for this globe wrapper, no delivery benefit).

## 3. Globe rendering

**Decision**: `react-globe.gl` (Three.js) with `polygonsData` choropleth, arc-less, hover/click callbacks, `pointOfView` for focus, OrbitControls for rotate/zoom.
**Rationale**: Purpose-built for exactly this interaction set (country polygons, shading, hover/click, programmatic focus); maintained; handles touch/pinch; gives access to the Three.js renderer for reduced-motion and performance tuning.
**Alternatives considered**: raw Three.js + `d3-geo` (significant custom glue, violates "maintained libraries"); `globe.gl` vanilla (works, but React wrapper reduces lifecycle bugs); CesiumJS (heavy, overkill); 2D d3 orthographic SVG (loses the 3D requirement FR-001).

## 4. Country boundaries and the country list

**Decision**: Natural Earth 1:110m Admin-0, consumed as TopoJSON via the `world-atlas` npm package and decoded with `topojson-client`; ISO 3166-1 alpha-3 is the join key.
**Rationale**: Public domain (no attribution restrictions), stable, small enough to bundle, and the "single documented country list" required by the spec's edge case. The dataset README records the Natural Earth version and its treatment of territories/disputed areas.
**Alternatives considered**: Natural Earth 50m (larger, unnecessary for a globe at MVP zoom); GADM (licence restrictions); provider-specific GeoJSON (lock-in).

## 5. Population figures

**Decision**: United Nations World Population Prospects (WPP) latest revision, total population by country/area, most recent reference year in the snapshot.
**Rationale**: Authoritative, citable, consistently covers ~all countries; matches the spec's assumption of a UN/World Bank source and the "most recent year available" default (FR-012). Source name + reference year are stored per country (FR-007).
**Alternatives considered**: World Bank (good fallback, slightly different country coverage); CIA Factbook population (less authoritative for totals). The fetch script will allow a World Bank fallback if a WPP value is missing.

## 6. Diversity breakdown (named groups + shares)

**Decision**: CIA World Factbook per-country `ethnic groups`, `languages` and `religions` fields, captured as named groups with percentage shares; dimension stored per row.
**Rationale**: Public domain (US Government), provides named groups with shares for most countries across all three dimensions in one consistent source, which the spec's Diversity Breakdown entity requires; captured at build time, so no live calls (FR-004).
**Alternatives considered**: Ethnologue (languages only, licensing); World Religion Database (religion only, licensing); UN data (limited group-level shares). Countries the source omits get the explicit unavailable state (FR-008).

## 7. Diversity indicator

**Decision**: A fractionalisation index (ethnic, linguistic and/or religious) per country from the Quality of Government (QoG) Standard Dataset lineage (Alesina et al.; Fearon). The indicator row stores name, value, scale min/max (0–1) and reference year.
**Rationale**: An established, published index rather than an invented score, satisfying the spec assumption; single numeric value per country suits the globe's "how mixed is it" summary; provenance fields satisfy FR-005/FR-007.
**Alternatives considered**: computing an index ourselves from the Factbook shares (invents a metric and diverges from published figures); Pew indices (religion only).

## 8. Dataset capture, versioning and validation

**Decision**: `scripts/fetch-dataset.ts` fetches and merges the sources into `data/snapshot.json`; `scripts/validate-dataset.ts` validates it against `contracts/dataset.schema.json`; the snapshot embeds source, reference year, retrieval date and a version string. Committed to the repo; runtime reads only the bundled file.
**Rationale**: The spec requires a versioned snapshot and no live third-party calls; committing the file makes builds reproducible and testable offline (including E2E with the browser offline).
**Alternatives considered**: fetch-on-load at runtime (fails offline/error cases, non-reproducible); a database (unnecessary for ~250 static rows).

## 9. Search matching

**Decision**: In-memory matching over country name, common name and aliases using Unicode NFD accent folding, case folding and prefix/substring ranking; client-side only.
**Rationale**: ~250 records make a linear scan with `Intl`/normalisation well under the 1s budget; handles accented and duplicate names (spec edge case).
**Alternatives considered**: client-side fuzzy library (extra dependency for no MVP gain); server search endpoint (no backend).

## 10. Interaction-state persistence

**Decision**: Keep selection/search in React state; mirror to `sessionStorage` and restore on mount.
**Rationale**: Satisfies FR-013 (selection and search survive resize/rotation and accidental reloads) without accounts or server storage; avoids persisting personal data.
**Alternatives considered**: URL query params (also good; deferred — adds routing not required by MVP); `localStorage` (longer-lived than a session, unnecessary).

## 11. Testing stack

**Decision**: Vitest for unit and component tests (jsdom/happy-dom + `@testing-library/react`), Playwright for E2E against the Vite preview/build on port `3454`.
**Rationale**: Vitest shares the Vite transform pipeline; Playwright's headless Chromium is already installed at `/ms-playwright`, so E2E runs keyless. Org memory says run the whole suite together in CI rather than per feature; `ci.yml` runs typecheck → unit → build → E2E in one workflow.
**Alternatives considered**: `bun test` (fewer React/DOM helpers); Jest (extra transform config alongside Vite).

## 12. Accessibility and motion

**Decision**: Respect `prefers-reduced-motion` by disabling auto-rotation, keep controls reachable by keyboard/touch, document the colour-blind-safe palette in CSS tokens.
**Rationale**: Directly addresses the spec's reduced-motion, touch-only and responsive edge cases (FR-009/FR-010) and the org review principles.
**Alternatives considered**: always-on auto-rotation with a toggle (still violates reduced-motion); hover-only detail affordances (unusable on touch).

## Resolved unknowns

All `NEEDS CLARIFICATION` items (runtime, globe library, boundary source, population source, diversity source/indicator, storage, testing) are resolved above. No open clarifications remain for design.
