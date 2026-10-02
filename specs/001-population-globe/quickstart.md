# Quickstart: Population Globe

Greenfield repo — no source exists yet; these are the commands the implementation adds and a
reviewer can run end to end.

## Prerequisites

- Bun 1.4.2 (only JS runtime available in the dev/test image).
- No credentials, no database, no `.env` required. The dataset is bundled and validation is offline.
- E2E uses the pre-installed headless Chromium at `/ms-playwright`; port `3454` is free for it.

## Setup and run

```bash
bun install
bun run dev            # Vite dev server; open the printed localhost URL
# or a production-like preview:
bun run build
bun run preview --port 3454
```

## Verify end to end

1. **Globe (US1)** — page loads a rotatable 3D globe; countries are shaded and the Legend shows
   population ranges. Drag to rotate, scroll/pinch to zoom, select a country: the DetailPanel
   shows name, exact population with thousands separators plus short form, and the reference year.
   The InteractionHint explains rotate/zoom/select until first interaction.
2. **Diversity (US2)** — select a country with diversity data: named groups with shares and a
   single diversity indicator with scale and year appear, each with source name. Select a country
   without diversity data: an explicit "Diversity data not available" block appears and the
   population figure is still shown.
3. **Search (US3)** — type ≥2 characters, pick a suggestion; the globe focuses the country and
   opens its panel. Type nonsense: a "no countries found" message appears and the globe is unchanged.
4. **Edge states** — resize/rotate the device: selection and query persist. Block `data/snapshot.json`
   in devtools and reload: the ErrorState with retry appears. With OS reduced-motion on, auto-rotation
   is disabled but manual rotation works.

## Data regeneration (only when updating the snapshot)

```bash
bun run fetch:dataset      # merges sources into data/snapshot.json (records source/year/license)
bun run validate:dataset   # checks snapshot against contracts/dataset.schema.json
```

## Test suite

```bash
bun run typecheck          # tsc --noEmit
bun run test               # Vitest: unit + component
bun run test:e2e           # Playwright (Chromium, PORT=3454), all acceptance scenarios
bun run test:all           # typecheck + unit + build + e2e in one run (what CI runs)
```
