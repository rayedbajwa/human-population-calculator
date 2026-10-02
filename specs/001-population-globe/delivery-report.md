Delivery Status: PARTIAL
# Delivery Report: Population Globe

**Feature**: `specs/001-population-globe/` · **Branch**: `001-population-globe` @ `acaf0fb` · **Base**: `main` @ `c535fae`
**Repo**: `rayedbajwa/human-population-calculator` (single repository — `plan.md` §Repositories)
**Date**: 2026-10-02 · **PR**: [#1](https://github.com/rayedbajwa/human-population-calculator/pull/1)
**Delivery status source**: `delivery-status.md` plus the commands run below.

## Pull requests

| Repo | PR | State | CI | Merged at | Deploy |
|------|----|-------|----|-----------|--------|
| rayedbajwa/human-population-calculator | [#1](https://github.com/rayedbajwa/human-population-calculator/pull/1) | open, mergeable `clean`, review requested from `rayedbajwa` | `CI` run #2 — **success** (lint, typecheck, unit, build, e2e) | — | — |

`main` and `001-population-globe` are pushed. The PR is the only delivery artifact and is waiting on the T057 human review approval before merge.

## What I fixed / did

- **Repository access was granted** by the owner: a freshly minted App installation token (app `spaces-spaces-production-rayed`, installation `163148276`) now lists `rayedbajwa/human-population-calculator`.
- Pushed `main` (`c535fae`) and `001-population-globe`, then discovered the branch shared **no common ancestor** with `main` (orphan root `062cfa7`). Opened the PR is impossible in that state, so I merged `main` into the branch (`97519ad`, `--allow-unrelated-histories`), preserving all existing commit hashes; merge-base is now `c535fae`.
- Opened PR #1 into `main` with a Conventional Commits title and a body linking `spec.md`/`plan.md`/`tasks.md`/`test-plan.md`/`verification-report.md`.
- **Fixed the first CI failure** (run #1): the E2E test `globe.spec.ts` › "rotates the camera when dragged" timed out on `mouse.move` because software WebGL on the runner renders each pointer step slowly. Reduced the drag to 4 steps, raised the per-test timeout to 90s and added explicit 30s expects (`tests/e2e/globe.spec.ts`, commit `acaf0fb`). Re-ran locally: `bun run lint` clean, `bun run typecheck` clean, `bun run test:e2e tests/e2e/globe.spec.ts` **5/5 passed**.
- Pushed `acaf0fb`; CI run #2 is **green** and the PR is `mergeable_state: clean`. Requested review from `rayedbajwa`.

## UAT / final acceptance

Not run against a deployed environment: T059 (deploy) and T060 (UAT) depend on T058 (merge), and PR #1 is still open. Every `test-plan.md` §UAT item is therefore **NOT RUN** on a deployed URL; the automated acceptance proxies pass locally and in CI.

| `test-plan.md` §UAT item | Result | Automated proxy (local and CI) |
|--------------------------|--------|-------------------------------|
| 1. Viewports 360/768/1280/1920, no horizontal scroll, controls reachable | NOT RUN (no deployed env) | `tests/e2e/responsive.spec.ts` — PASS |
| 2. Globe shaded + legend + hint; rotate/zoom/select | NOT RUN (no deployed env) | `globe.spec.ts`, `globe-hint.spec.ts` — PASS |
| 3. Diversity country vs population-only country | NOT RUN (no deployed env) | `diversity.spec.ts` — PASS |
| 4. Search <2 chars / valid / nonsense | NOT RUN (no deployed env) | `search.spec.ts` — PASS |
| 5. Selection and query restored across reload/rotate | NOT RUN (no deployed env) | `globe.spec.ts` (reload), `responsive.spec.ts` — PASS |
| 6. Blocked `snapshot.json` → error state + retry recovers | NOT RUN (no deployed env) | `error-retry.spec.ts` — PASS |
| 7. Reduced motion disables auto-rotation, manual rotation works | NOT RUN (no deployed env) | `reduced-motion-touch.spec.ts` — PASS |
| 8. Every figure shows source name and reference year (SC-007) | NOT RUN (no deployed env) | `provenance.spec.ts` — PASS |
| 9. Record pass/fail per item with deployed URL and timestamp | NOT RUN (no deployed env) | n/a |

## What still needs approval / waits on someone

- **T057** — a human review approval on PR #1 (review requested from `rayedbajwa`; no reviews recorded yet).
- **T058** — merge PR #1 into `main` (irreversible; needs explicit approval).
- **T059** — confirm the `deploy.yml` GitHub Pages deployment after merge.
- **T060** — run the `test-plan.md` §UAT checklist against the published URL.

## Question 1: Merge PR #1 into `main`

Concrete action: `gh pr merge 1 --repo rayedbajwa/human-population-calculator --merge` (equivalently `PUT /repos/rayedbajwa/human-population-calculator/pulls/1/merge` with `merge_method: merge`) on head `acaf0fb`, whose CI run #2 is green and whose merge state is `clean`.
Effect: merges the feature into `main`, which triggers the `deploy.yml` GitHub Pages deployment (T059). I will then confirm the deployment reached `github-pages` and run the UAT checklist (T060). Nothing is deleted or migrated.

## Next re-check

On approval: merge PR #1 (T058), wait for the `deploy.yml` run on `main` and record its `github-pages` environment URL (T059), run the nine UAT items against that URL and record pass/fail with timestamps (T060), then re-run the deliver stage so `delivery-status.md` reflects the merged/deployed state.
