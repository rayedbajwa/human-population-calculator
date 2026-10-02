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
the data; it is not a published index figure. This is a deliberate deviation from
`research.md`'s preference for the published QoG/Alesina index, because no keyless, stable
publication of that index was available to automate here.

## Factbook share parsing and the completeness guard

Factbook share strings are messy (`15-20%` ranges, `more than 95%`, `approximately 15%`,
`other <1%`, HTML entities and at least one slash-as-decimal like `93/1%`).
`scripts/factbook-shares.ts` parses ranges as their midpoint and qualifiers as their bound
instead of dropping those rows.

Because a partially reported field (for example Russia's religions, which cover only
"practicing worshipers" and sum to 32%) would otherwise render as if it were a whole
composition, a dimension whose parsed shares fall outside **90–110%** is dropped from the
snapshot entirely: the UI shows the explicit "diversity data not available" state rather than
a wrong breakdown. `validate:dataset` treats any such dimension that still reaches the file as
a hard **error**, and `tests/unit/dataset.quality.test.ts` proves the committed snapshot has
none.

## Population source deviation

The second deliberate deviation is the population source: `research.md` named UN WPP as the
primary source with the World Bank only as a fallback, but `scripts/fetch-dataset.ts` uses the
World Bank `SP.POP.TOTL` indicator exclusively. This was chosen because it is keyless, stable
and machine-readable end to end, so the snapshot can be regenerated without manual downloads.
The snapshot names the source and reference year per figure, so the provenance is explicit.

## Regeneration

```bash
bun run fetch:dataset    # World Bank + factbook/factbook.json  →  data/snapshot.json
bun run validate:dataset # schema + data-model checks on the snapshot and fixtures
```

`fetch:dataset` needs network access and is not run in CI; the committed files are the source
of truth. `tests/fixtures/snapshot.fixture.json` is a small hand-maintained fixture validated by
the same schema and is not regenerated.

## Known characteristics

- 250 countries/territories, 215 with a population figure (86.0% dataset coverage).
- 174 of the 177 Natural Earth 1:110m boundary features resolve to a snapshot entry; 169 of
  them (95.5%) carry population shading, so the globe meets SC-003 (≥95% of rendered
  boundary features shaded). The dataset-wide coverage is tracked separately as a regression
  floor in `tests/unit/dataset.coverage.test.ts`.
- 215 countries carry at least one diversity breakdown row; the rest render the explicit
  "diversity data not available" state. Dimension groups whose parsed shares fall outside
  90–110% are omitted entirely (never shown partial); see the completeness guard above.
- Per-dimension shares within the 90–110% window may still differ from 100% (rounding, and
  Factbook "other" categories reported inconsistently); `validate:dataset` logs those as
  non-fatal warnings, while anything outside the window is a hard error.
