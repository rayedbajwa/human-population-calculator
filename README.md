# Population Globe

An interactive 3D globe that shades every country by total population and, on selection,
shows the country's population plus its ethnic, linguistic and religious composition and a
single diversity indicator. Static, client-side, offline — no backend, no keys, no database.

Feature docs live in [`specs/001-population-globe/`](specs/001-population-globe/) (spec, plan,
tasks, test plan, data model, contracts).

## Stack

- TypeScript 5.6, React 18, Vite 6, [Bun](https://bun.sh) 1.4 as runtime and package manager
- `react-globe.gl` (Three.js) for the globe, `topojson-client` + `world-atlas` boundaries
- Vitest + Testing Library (happy-dom) for unit/component tests, Playwright (Chromium) for E2E

## Install and run

```bash
bun install
bun run dev                 # Vite dev server
bun run build               # production bundle in dist/
bun run preview --port 3454 # production-like preview
```

## Test and checks

```bash
bun run typecheck      # tsc --noEmit
bun run test           # Vitest: unit + component
bun run test:e2e       # Playwright E2E (builds + serves on port 3454)
bun run validate:dataset
bun run test:all       # typecheck + unit + build + E2E in one run (the CI gate)
```

`test:e2e` starts the production preview on `127.0.0.1:3454` (override with
`PLAYWRIGHT_PORT`); do not use port 3000. No credentials or environment variables are
required — see [`.env.example`](.env.example).

## Dataset

The app reads a committed, versioned snapshot in [`data/`](data/):

- `data/snapshot.json` — countries with population, diversity breakdowns, indicators and
  per-figure provenance, validated against
  [`contracts/dataset.schema.json`](specs/001-population-globe/contracts/dataset.schema.json).
- `data/countries-110m.topo.json` — Natural Earth 1:110m boundaries (join key ISO alpha-3 via
  each country's `boundaryId`, the ISO numeric code used by `world-atlas`).

Sources, years and licences are documented in [`data/README.md`](data/README.md). Refresh the
snapshot with `bun run fetch:dataset` (needs network access; the committed snapshot is what
the app and tests use).

## Conventions

- Pure logic lives in `src/lib/`; components are presentational with props/callbacks.
- A population or diversity figure is never shown without its source name and reference year.
- Missing values render an explicit "not available" state, never `0` or blank.
- Commits follow Conventional Commits: `type(scope): subject`.
