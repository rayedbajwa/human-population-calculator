Code Review Status: CHANGES_REQUESTED

## Summary

The change delivers the Population Globe as a static Vite/React SPA: a `react-globe.gl` choropleth over a committed snapshot plus search, legend, first-use hint, and a detail panel with population, an ethnic/linguistic/religious breakdown, a derived diversity indicator and provenance. All four findings from the prior review are fixed in the code: `scripts/factbook-shares.ts` now parses ranges/qualifiers/entities/slash-decimals and drops implausible dimensions, `validate-dataset.ts` escalates out-of-window share totals to errors, the committed snapshot has 0 of 485 dimension groups outside 90–110%, `vite.config.ts` emits relative assets, and the reduced-motion/short-form E2E gaps are closed. Local gates are green and the data-quality fix is proven by new committed tests; approval is withheld only because the pipeline has no pull request or CI run to review against, and because a handful of Factbook group labels still ship with cleaning artifacts.

## Findings

- [MAJOR] specs/001-population-globe/delivery-status.md:2 — `Delivery Status: NONE` (0 pull requests, 0 open): T056 was not executed, so there is no PR, no PR title to check and no CI (`lint → typecheck → unit → build → E2E`) to review. `origin` has no refs and both push attempts returned `403 — Permission to rayedbajwa/human-population-calculator denied to spaces-spaces-production-rayed[bot]`; the GitHub API reports `permissions: {push:false, pull:false}`. — The implement/deliver stage must push `001-population-globe` (and an initial `main`) with a write-capable credential and open the PR so CI can run; the local branch is ready at `46352a6`. This is the only blocking item and it is environmental, not a code defect.
- [MINOR] scripts/factbook-shares.ts:84-90 — `cleanGroupName` strips modifiers, `<>`, and a trailing dash but not the other artifacts Factbook text carries, so the committed snapshot ships malformed group labels (≈15 rows): leading conjunctions (`GRL/ethnic` "and other", `IND/ethnic` "and other", `ZAF/religious` "or other traditional African religions", `PRT/ethnic` "and South America and other foreign born"), a trailing tilde used as "approximately" (`SYR/ethnic` "Arab ~", "Alawite ~", "Kurd ~", "Levantine ~", "other ~"), unmatched `)` from parenthetical text (`DNK/linguistic` "Danish and Faroese)", `GNQ/linguistic` "Fa d'Ambo spoken in Annobon)", `MKD/religious` "other and Bosnian)"), and a trailing period (`BRA/religious` "Indigenous religions ."). The shares and totals are correct; only the displayed names are wrong, which weakens FR-004's "named groups". — Also strip a leading `(and|or|the|of|with|including)\b`, a trailing `~`, an unmatched trailing `)`, and trailing `.`; regenerate and extend `tests/unit/dataset.quality.test.ts` with a label-hygiene assertion so this cannot recur.
- [MINOR] vite.config.ts:49 — the `base: './'` fix is correct (verified by serving `dist/` under `/human-population-calculator/`: 169/177 features shaded, all `assets/` and `data/` requests resolved under the sub-path, no console errors) but nothing committed guards it: the E2E suite runs `vite preview` at the domain root, which passes with absolute `/assets/...` too, so the exact bug class the prior review found could silently return. — Add a cheap committed check (e.g. a unit/CI assertion that `dist/index.html` contains no `src="/assets` / `href="/assets`), or a Playwright spec served from a sub-path.
- [NIT] scripts/factbook-shares.ts:65 — the `&[a-z]+;` fallback resolves any unrecognised named entity to a single space, which silently corrupts a label rather than failing; the entity map is also ad hoc. — Prefer leaving unknown entities intact (or decoding via `node:util` / a maintained map) and note the trade-off.
- [NIT] test-plan.md:20 — the Static layer claims `contracts/ui-contracts.md` is covered, but no test references that file (`grep -rln "ui-contracts" tests/` is empty); the shape is only indirectly exercised through component props. — Either add a small contract test or correct the test-plan row.

## Tests & checks

Environment: checkout `/data/aidlc/workspaces/rayedbajwa/human-population-calculator`, branch `001-population-globe` (`46352a6`); base `main` (`c535fae`, empty initial commit, no remote refs). Static SPA: no database or keys used. E2E deliberately not re-run per this stage's instructions; the last recorded run on the previous iteration was 18/18 affected specs.

| Check | Command | Result |
|-------|---------|--------|
| Lint | `bun run lint` | pass — 45 files, no findings |
| Typecheck | `bun run typecheck` | pass (`tsc --noEmit`, no output) |
| Unit + component | `bun run test` | pass — 15 files, 97/97 tests (incl. 12 `factbook-shares`, 3 `dataset.quality`) |
| Dataset contract + data model | `bun run validate:dataset` | exit 0 — both files schema-valid, 0 errors; in-window 99–101 rounding warnings only |
| Data quality (reviewer check) | count over `data/snapshot.json` | 485/485 dimension groups sum within 90–110% (min 90.0, max 107.7); `RUS/religious`, `SSD/ethnic`, `TKL/linguistic` absent; `IRQ/ethnic` 100.0% from ranges |
| Build | `bun run build` | pass; `dist/index.html` uses `./assets/...`; `dist/data/` holds only `snapshot.json` + `countries-110m.topo.json` |
| Label hygiene (reviewer check) | scan of committed group names | ≈15 rows with leading conjunctions / trailing `~`, `)` or `.` (see MINOR finding) |
| CI / PR state | `delivery-status.md` | `Delivery Status: NONE` — 0 PRs, no checks to read |

## Spec coverage

Implemented and tested: FR-001/002/003 (globe, shading, selection detail), FR-004/005/007/008 (breakdown, indicator, provenance, explicit unavailable), FR-006 (search), FR-009/012 (hint, whole-world default), FR-010/013 (responsive, selection/query persistence), FR-011 (formatting incl. E2E short form), FR-014 (retryable snapshot **and** boundary errors), SC-002/003/004/006/007. The prior review's four findings are verified fixed: the dataset unit tests exist, boundary fetch failures surface a retry, camera/focus is asserted in E2E, SC-003 is proven by `tests/unit/dataset.coverage.test.ts` (174 matched / 169 shaded = 95.5%), and the generator no longer drops ranges/modifiers.

Remaining gaps: the deployed UAT (SC-006 and the `test-plan.md` UAT list) cannot be run because T056–T060 are unexecuted; label hygiene for FR-004 is unfixed (MINOR); the relative-base deploy path has no committed regression test (MINOR); `contracts/ui-contracts.md` coverage is claimed but absent (NIT).
