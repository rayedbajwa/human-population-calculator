Code Review Status: APPROVED

## Summary

The change delivers the Population Globe as a static Vite/React SPA — a lazy-loaded `react-globe.gl` choropleth over a committed, validated snapshot, with search, legend, first-use hint, and a detail panel showing population plus an ethnic/linguistic/religious breakdown, a derived diversity indicator and provenance. Every finding from the three prior reviews is now resolved in the code: Factbook ranges/qualifiers/entities are parsed, implausible dimensions are dropped, out-of-window share totals are validator errors, the committed snapshot has 0/485 groups outside 90–110% and 0 malformed labels, assets are relative (with a committed build guard), and the reduced-motion/short-form E2E gaps are closed. Local gates are green (lint, `tsc`, 101/101 Vitest, `validate:dataset` exit 0, build + relative-asset guard) and the fixes are covered by new committed tests; the review approves the code. The one caveat is environmental: the branch has never been pushed (no PR, no CI) because the checkout's credential is read-only, so the full E2E suite and the deployed UAT have not run in this pipeline.

## Findings

- [MINOR] specs/001-population-globe/delivery-status.md:2 — `Delivery Status: NONE` (0 pull requests); `origin` has no refs and both push attempts returned `403 — denied to spaces-spaces-production-rayed[bot]` (GitHub API `permissions: {push:false, pull:false}`). There are no failing CI checks, so this does not gate the code review, but T056–T060 (PR, CI, merge, deploy, UAT) cannot complete here. — A write-capable credential or the deliver stage must push `001-population-globe` + an initial `main` (ready locally at `bf05aa5` / `c535fae`) and open the PR so CI runs the full suite and the deployed UAT can be performed.
- [NIT] tests/unit/dataset.quality.test.ts:64 — the label-hygiene assertion rejects conjunction prefixes and trailing `~.)`/whitespace but not a residual HTML entity, which is now possible because `decodeEntities` deliberately leaves unknown entities intact (`scripts/factbook-shares.ts:65`). No committed name currently contains one (reviewer scan: 0/…), so it is future-proofing. — Extend the regex with `&[a-z]+;` or assert the generator logged no unmapped entities.

## Tests & checks

Environment: checkout `/data/aidlc/workspaces/rayedbajwa/human-population-calculator`, branch `001-population-globe` (`bf05aa5`); base `main` (`c535fae`, empty initial commit, no remote refs). Static SPA: no database or keys used. E2E skipped per stage rules.

| Check | Command | Result |
|-------|---------|--------|
| Lint | `bun run lint` | pass — 46 files, no findings |
| Typecheck | `bun run typecheck` | pass (`tsc --noEmit`, no output) |
| Unit + component | `bun run test` | pass — 15 files, 101/101 tests (incl. 15 `factbook-shares`, 4 `dataset.quality`) |
| Dataset contract + data model | `bun run validate:dataset` | exit 0 — both files schema-valid, 0 errors; in-window 99–101 rounding warnings only |
| Data quality (reviewer check) | scan of `data/snapshot.json` | 485/485 dimension groups in 90–110%; 0 leading-conjunction / trailing `~.)` / double-space labels; `BRA/religious` = 101.6% with "Indigenous religions" 0.1% (leading-dot fix) |
| Build + committed guard | `bun run build` | pass; `✓ dist/index.html uses relative asset URLs`. Negative test: injecting `src="/assets/…"` makes the guard exit 1 (verified, then restored) |
| Label/entity coverage | `bun run test` (changed files) | parser label-cleaning, leading-dot and unknown-entity tests pass |
| CI / PR state | `delivery-status.md` | `Delivery Status: NONE` — 0 PRs, no checks to read |

## Spec coverage

Implemented and tested: FR-001/002/003 (globe, shading, selection detail), FR-004/005/007/008 (breakdown — now with clean labels, indicator, provenance, explicit unavailable), FR-006 (search), FR-009/012 (hint, whole-world default), FR-010/013 (responsive, persistence), FR-011 (formatting incl. E2E short form), FR-014 (retryable snapshot **and** boundary errors), SC-002/003/004/006/007. Prior-review resolutions verified: dataset unit tests exist; boundary fetch failure surfaces a retry; camera/focus asserted in E2E; SC-003 proven by `tests/unit/dataset.coverage.test.ts` (174 matched / 169 shaded = 95.5%); ranges/qualifiers parsed with no partial compositions shipped; relative-base bug guarded by `scripts/check-relative-assets.ts`.

Gaps: the deployed UAT (SC-006 and the `test-plan.md` UAT list) and the full E2E suite are not re-run in this stage and cannot run in CI until T056 is executed; the residual-entity label guard is a NIT.
