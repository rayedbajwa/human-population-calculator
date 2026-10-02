Delivery Status: MERGED
# Delivery Report: Population Globe

**Feature**: `specs/001-population-globe/` · **Branch**: `001-population-globe` (merged) · **Base**: `main`
**Repo**: `rayedbajwa/human-population-calculator` (single repository — `plan.md` §Repositories)
**Date**: 2026-10-02 · **PR**: [#1](https://github.com/rayedbajwa/human-population-calculator/pull/1) · **Deployed**: <https://rayedbajwa.github.io/human-population-calculator/>

## Pull requests

| Repo | PR | State | CI | Merged at | Deploy |
|------|----|-------|----|-----------|--------|
| rayedbajwa/human-population-calculator | [#1](https://github.com/rayedbajwa/human-population-calculator/pull/1) | **merged** (`b6a922f`) | `CI` runs #2 and #3 — success (lint, typecheck, unit, build, e2e) | 2026-10-02T04:11Z | GitHub Pages deployment `6801114729` on `github-pages` @ `b6a922f` — success |

Merge order: single PR, no stack. `main` is at `57ecc9c` (the merge commit `b6a922f` plus the delivery-report update); the `001-population-globe` head branch was auto-deleted on merge (only `refs/pull/1/head` remains). A second GitHub Pages deployment (`6801223482` @ `57ecc9c`) followed the docs-only commit and succeeded; the built app content is identical to `b6a922f`.

## What I fixed / did

- **Repository access** was granted by the owner; the App installation token then included `rayedbajwa/human-population-calculator`. Pushed `main` (`c535fae`) and `001-population-globe`.
- The branch shared **no common ancestor** with `main` (orphan root `062cfa7`), which blocks PR creation. Merged `main` into the branch (`97519ad`, `--allow-unrelated-histories`) preserving every existing commit hash; merge-base is `c535fae`.
- Opened PR #1 with a Conventional Commits title and a body linking `spec.md`/`plan.md`/`tasks.md`/`test-plan.md`/`verification-report.md`; requested review from `rayedbajwa`.
- **Fixed the first CI failure** (run #1): the rotation E2E timed out on `mouse.move` because software WebGL on the runner renders each pointer step slowly. Reduced the drag to 4 steps, set a 90s per-test timeout and explicit 30s expects (`tests/e2e/globe.spec.ts`, `acaf0fb`); local `5/5` and CI runs #2/#3 green.
- Merged PR #1 to `main` on approval (`b6a922f`) and confirmed the `deploy.yml` GitHub Pages deployment succeeded (deployment `6801114729`, environment `github-pages`).

## UAT / final acceptance

Run against the deployed environment **https://rayedbajwa.github.io/human-population-calculator/** (deployment @ `b6a922f`), 2026-10-02T04:15Z. The full Playwright acceptance suite was pointed at the deployed URL: **27 passed / 0 failed**.

| `test-plan.md` §UAT item | Result | Evidence |
|--------------------------|--------|----------|
| 1. Viewports 360/768/1280/1920, no horizontal scroll, controls reachable | **PASS** | `responsive.spec.ts` ×4 on deployed URL |
| 2. Globe shaded + legend + hint; rotate/zoom/select | **PASS** | `globe.spec.ts` (5), `globe-hint.spec.ts` (2) on deployed URL |
| 3. Diversity country vs population-only country | **PASS** | `diversity.spec.ts` (2) on deployed URL |
| 4. Search <2 chars / valid / nonsense | **PASS** | `search.spec.ts` (4) on deployed URL |
| 5. Selection and query restored across reload/rotate | **PASS** | `globe.spec.ts` reload case on deployed URL |
| 6. Blocked `snapshot.json` → error state + retry recovers | **PASS** | `error-retry.spec.ts` (2) on deployed URL |
| 7. Reduced motion disables auto-rotation, manual rotation works | **PASS** | `reduced-motion-touch.spec.ts` (2) on deployed URL |
| 8. Every figure shows source name and reference year (SC-007) | **PASS** | `provenance.spec.ts` (2) on deployed URL |
| 9. Record pass/fail per item with deployed URL and timestamp | **PASS** | this table, URL and timestamp above |

Deployment-specific checks also pass directly: `GET /` 200, `data/snapshot.json` 200 (687 KB), `data/countries-110m.topo.json` 200 (108 KB), and the built JS/CSS assets return 200 under the `/human-population-calculator/` subpath (relative `./assets/...` URLs).

UAT note: the E2E helper navigated with `page.goto('/')`, which Playwright resolves against the *origin* and therefore missed the project subpath. For the UAT run I temporarily changed it to `page.goto('./')` in `tests/e2e/helpers.ts` and `tests/e2e/error-retry.spec.ts` (uncommitted, then reverted); the app itself is unaffected, but the 27/27 result is not reproducible from the committed code without that one-line change. The helper fix is a recommended test-only follow-up (it would need its own PR). No production code defect was found.

## What still needs approval / waits on someone

- **SC-005** — the "rotate/zoom/select from the on-screen hint on the first attempt ≥90%" success rate is a human usability study and remains unverified; it is the only open acceptance item. All 14 functional requirements and the other six success criteria have passing evidence, on the deployed URL where applicable.

## Next re-check

No re-check is required for delivery. If the human usability study for SC-005 runs, record its result against the deployed URL above. Optionally open a small test-only PR to change `page.goto('/')` to `page.goto('./')` in `tests/e2e/helpers.ts` and `tests/e2e/error-retry.spec.ts` so the suite can target subpath deployments directly.
