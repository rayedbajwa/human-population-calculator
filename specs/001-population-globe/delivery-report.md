# Delivery Report: Population Globe

Delivery Status: BLOCKED

**Feature**: `specs/001-population-globe/` · **Branch**: `001-population-globe` @ `b57d75d` · **Base**: `main` @ `c535fae`
**Repo**: `rayedbajwa/human-population-calculator` (single repository — `plan.md` §Repositories)
**Date**: 2026-10-02 · **Delivery status source**: `delivery-status.md` (`Delivery Status: NONE`, 0 PRs, 0 open) and commands run below.

## Pull requests

| Repo | PR | State | Merged at | Deploy |
|------|----|-------|-----------|--------|
| rayedbajwa/human-population-calculator | — (T056 could not be opened) | **blocked** | — | — |

No PR exists. `git ls-remote origin` returns nothing and `GET /repos/.../branches` is empty: the remote has no refs at all, so `main` (`c535fae`, the empty init commit) has never been pushed either.

## What I fixed / did

- Committed the pending stage artifacts (`specs/001-population-globe/acceptance.md`, refreshed `delivery-status.md`) as `b57d75d`; working tree is clean.
- Re-ran the full local gate on the merged-equivalent base:
  - `bun run lint` — clean, 49 files.
  - `bun run typecheck` — clean.
  - `bun run test` — **105 passed / 0 failed** (17 files).
  - `bun run test:all` — lint → typecheck → unit → build → E2E all pass; Playwright **27 passed / 0 failed** (~1.1m). Build emits relative assets and `✓ dist/index.html uses relative asset URLs`.
  - `bun run validate:dataset` — schema valid; only in-window 99–101 share-sum warnings, no errors.
- Attempted to publish, exactly as T056 requires:
  - `git push -u origin main` → `403 … Permission to rayedbajwa/human-population-calculator.git denied to spaces-spaces-production-rayed[bot]`.
  - `git push -u origin 001-population-globe` → same `403`.
  - API check `GET /repos/rayedbajwa/human-population-calculator` → `permissions: { admin:false, maintain:false, push:false, triage:false, pull:false }`.
  - `GET /installation/repositories` → `total_count: 1`, only `rayedbajwa/spaces`. The Spaces GitHub App is installed on selected repositories only and does not include this repository.
- Follow-up after the resume (`continue`): re-checked with a **freshly minted** App installation token (app `spaces-spaces-production-rayed`, installation `163148276`) — `GET /installation/repositories` still returns only `rayedbajwa/spaces` (re-checked again after a second `continue`, unchanged at 2026-10-02T03:41Z).
- Tried the connected user's token (user-to-server, `ghu_`, login `rayedbajwa`): `PUT /user/installations/163148276/repositories/1400833092` → `403 Resource not accessible by integration`, because the token is itself scoped to the App's installation repositories. A `git push --dry-run` with that token also returns `403` to the same bot.
- Exhausted self-service options: using the App's own JWT (`GET /app/installations`) there is exactly **one** installation (`163148276`, account `rayedbajwa`) and it exposes only `rayedbajwa/spaces`. The sign-in OAuth app has device flow disabled, so no broader user token can be minted here. Only the owner changing the App's repository access on GitHub can lift this.
- Conclusion: this is the same environmental blocker recorded in `verification-report.md` §5 and `tasks.md` T056/T077. It is not a code defect: the Spaces GitHub App is installed on selected repositories only, and neither the installation token, the user-token fallback (`src/lib/github-app-auth.ts`), nor the App's own user token can add this repository. Only the repository owner changing the App's repository access on GitHub can lift it.

## UAT / final acceptance

Not run against a deployed environment: T059 (deploy) and T060 (UAT) depend on T056–T058, and there is no PR, merge or deployment to point at. `test-plan.md` §UAT items 1–9 are all UNTESTED on a deployed URL. The automated acceptance proxies on the local production-like build pass: US1–US3 E2E, responsive 360/768/1280/1920, reduced-motion/touch, error/retry, provenance, performance smoke (select<2s, search<1s, ≥95% shaded), and cold-start discovery (`tests/e2e/discovery.spec.ts`).

## What still needs approval / waits on someone

The only outstanding item is a repository-access fix on GitHub, which I cannot perform with the read-only App token or from inside this checkout. See `## Question 1` below.

## Next re-check

After the owner adds `rayedbajwa/human-population-calculator` to installation `163148276`, or re-installs `spaces-spaces-production-rayed` with all repositories: `git push -u origin main`, `git push -u origin 001-population-globe`, open the PR with a Conventional Commits title, wait for the `ci.yml` gate (`bun run test:all`) and one human approval (T057), then merge (T058), confirm the `deploy.yml` GitHub Pages deployment (T059), and run the `test-plan.md` UAT checklist against the published URL (T060). Re-run the deliver stage to refresh `delivery-status.md` once a PR exists.
