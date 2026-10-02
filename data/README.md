# Dataset provenance

The application ships a fixed, versioned snapshot and makes no runtime network calls.
`data/snapshot.json` is validated by `bun run validate:dataset` against
`specs/001-population-globe/contracts/dataset.schema.json`.

**Snapshot version:** `1.0.0` (see `version` and `retrievedDate` inside the file).

## Sources

| id | Name | Licence | Reference year | Used for |
|----|------|---------|----------------|----------|
| `worldbank-population` | World Bank — Population, total (`SP.POP.TOTL`) | [CC BY 4.0](https://data.worldbank.org/indicator/SP.POP.TOTL) | latest available per country (2025 in this snapshot) | `Country.totalPopulation` |
| `cia-factbook` | CIA World Factbook — People and Society | public domain | per-row, extracted from each entry's `(20xx est.)` | diversity breakdown rows and indicator |

Boundaries: Natural Earth 1:110m Admin-0, redistributed by the `world-atlas` npm package
(public domain). The ISO numeric code in the TopoJSON `id` is stored as each country's
`boundaryId`; ISO 3166-1 alpha-3 is the primary key.

## Diversity indicator

`Country.diversityIndicator` is the **ethnic fractionalisation index derived from the CIA
World Factbook ethnic shares** using `1 − Σ share²`, on a 0–1 scale. It is named as derived in
the data; it is not a published index figure. This is the one deliberate deviation from
`research.md`'s preference for the published QoG/Alesina index, because no keyless, stable
publication of that index was available to automate here.

## Regeneration

```bash
bun run fetch:dataset    # World Bank + factbook/factbook.json  →  data/snapshot.json
bun run validate:dataset # schema + data-model checks on the snapshot and fixtures
```

`fetch:dataset` needs network access and is not run in CI; the committed files are the source
of truth. `tests/fixtures/snapshot.fixture.json` is a small hand-maintained fixture validated by
the same schema and is not regenerated.

## Known characteristics

- 250 countries/territories, 215 with a population figure; 175 Natural Earth boundary features
  are matched, of which 96.6% carry population shading (SC-003 ≥ 95%).
- 215 countries carry at least one diversity breakdown row; the rest render the explicit
  "diversity data not available" state.
- Per-dimension shares occasionally do not sum to 100% because the Factbook reports "other"
  categories inconsistently; `validate:dataset` logs these as non-fatal warnings by design.
