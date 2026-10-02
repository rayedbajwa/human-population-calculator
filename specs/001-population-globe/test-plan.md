# Test Plan: Population Globe

**Feature**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md) · **Tasks**: [tasks.md](./tasks.md)
**Version**: 1.0 · **Created**: 2026-10-01

All tests run keyless and offline against the bundled snapshot. CI runs typecheck, unit,
component, build and E2E together in one workflow (`.github/workflows/ci.yml`).

## Environments

| Environment | Purpose | Command |
|-------------|---------|---------|
| Local dev | Manual exploration | `bun run dev` |
| Local production-like | E2E + smoke | `bun run build && bun run preview --port 3454` |
| CI | Gate on every change | `bun run test:all` (typecheck → unit → build → E2E) |
| Deployed (post-merge) | UAT / final acceptance | Deployed static URL from `.github/workflows/deploy.yml` |

E2E uses the pre-installed Chromium under `/ms-playwright` and serves on port `3454`.

## Test layers

| Layer | Tool | Scope |
|-------|------|-------|
| Static | `tsc --noEmit` | Entity and module contract shapes in `src/types.ts` and `contracts/ui-contracts.md` |
| Unit | Vitest | `format.ts`, `search.ts`, `diversity.ts`, `dataset.ts` selectors and no-data guards |
| Component | Vitest + Testing Library | `DetailPanel`, `SearchBox`, `Legend`, `ErrorState`, `DataUnavailable` states |
| E2E | Playwright Chromium | US1–US3 acceptance, responsive, reduced-motion/touch, error/retry, performance, provenance |
| Dataset | `scripts/validate-dataset.ts` | `data/snapshot.json` and `tests/fixtures/snapshot.fixture.json` against `contracts/dataset.schema.json` |

## Acceptance-scenario coverage

| Spec scenario | Layer | Test task |
|---------------|-------|-----------|
| US1-1 globe shaded + legend on load | E2E | T028 |
| US1-2 drag/swipe rotates | E2E | T028 |
| US1-3 select shows name, population, year | Component, E2E | T027, T028 |
| US1-4 zoom keeps selection | E2E | T028 |
| US1-5 on-screen interaction hint | E2E | T029 |
| US1-6 thousands separators + short form | Unit, Component, E2E | T024, T027, T028 |
| US2-1 groups, shares, indicator, year | Component, E2E | T038, T039 |
| US2-2 population-only shows unavailable | Component, E2E | T038, T039 |
| US2-3 source visible for both figures | Component, E2E | T038, T051 |
| US3-1 suggestions after 2 chars | Component, E2E | T042, T043 |
| US3-2 choose focuses globe + panel | Component, E2E | T042, T043 |
| US3-3 no match message, globe unchanged | Component, E2E | T042, T043 |
| Edge: no recorded population | Unit, E2E | T025, T028 |
| Edge: no diversity data | Component, E2E | T038, T039 |
| Edge: tiny country via search/focus | E2E | T043 |
| Edge: documented single country list | Dataset, README | T017, T053 |
| Edge: load failure + retry | Component, E2E | T023, T047 |
| Edge: reduced-motion disables auto-spin | E2E | T049 |
| Edge: touch tap/pinch, no hover-only control | E2E | T049 |
| Edge: accented/duplicate names | Unit, E2E | T041, T043 |
| Edge: resize/rotate reflow + state retention | E2E | T028, T048 |
| SC-002 select→detail <2s | E2E perf | T050 |
| SC-003 ≥95% of the globe's boundary features shaded on load | E2E perf + Unit (dataset) | T050, T061 |
| SC-004 valid search <1s | E2E perf | T050 |
| SC-006 usable at 360/768/1280/1920 | E2E | T048 |
| SC-007 no figure without provenance | Component, E2E | T038, T051 |

## Functional-requirement coverage

FR-001/002/003 → US1 (T028, T031–T033); FR-004/005/007/008 → US2 (T038–T040);
FR-006 → US3 (T041, T043, T044); FR-009/012 → US1 (T029, T034); FR-011 → US1 (T024, T030);
FR-010/013 → cross-cutting (T020, T022, T048); FR-014 → cross-cutting (T023, T047).

## Test data

- `tests/fixtures/snapshot.fixture.json` — ~10 countries covering a no-population country, a
  population-only country, an accented/duplicate name, and one territory; validated by the same
  schema as production data.
- `data/snapshot.json` — full snapshot used for the ≥95% shading-coverage check and provenance checks.

## UAT / final acceptance (deployed environment)

Run after the merge in `main` and a successful deploy:

1. Open the deployed URL at 360px, 768px, 1280px and 1920px; confirm no horizontal scroll and all controls reachable.
2. Confirm the globe loads shaded with the legend and the first-use hint; rotate, zoom and select a country.
3. Select a country with diversity data (groups, shares, indicator, source name and year) and a population-only country (explicit "Diversity data not available", population still shown).
4. Search a country with fewer than two characters (no list), a valid name (suggestions then focus) and nonsense ("no countries found", globe unchanged).
5. Resize/rotate the device or reload; confirm the selection and query are restored.
6. Deny `snapshot.json` in devtools and reload; confirm the error state and that retry recovers.
7. With OS reduced-motion on, confirm auto-rotation is disabled and manual rotation still works.
8. Spot-check that every displayed figure shows a named source and reference year (SC-007).
9. Record pass/fail per item with the deployed URL and timestamp.

## Exit criteria

- Typecheck, unit, component, build and all E2E suites pass together in CI.
- `validate-dataset.ts` passes for both the full snapshot and the fixture.
- Every row in the acceptance-scenario and UAT tables passes or has a documented, reviewed exemption.
- No figure renders without source and reference year.
