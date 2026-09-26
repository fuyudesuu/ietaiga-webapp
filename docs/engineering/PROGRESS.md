# Engineering progress

## Starting checkpoint — 27 September 2026 Sydney

- Product: frontend prototype and MVP specification exist.
- Application revision inspected: `56249a1ca17a2248a5bf3023cda8ad032532c8a4`.
- This kit adds instructions/templates only; no refactoring or production backend has been performed by the kit.
- CI/boundary enforcement specified in `QUALITY-GATES.md` is not installed yet.
- First task: stage A in `REFACTOR-PLAN.md` using `START-HERE.md`.
- Known historical limitation: browser preview was unavailable. Re-evaluate available tooling; do not assume current availability or claim previous visual verification.
- Scope recommendation pending review: channel-first Discord delivery; bot DMs later.

## Update at each task boundary

### Task and revision
Name the bounded task and current source revision/branch when available.

### Completed
List actual outcomes and key files, not intentions.

### Verification
Record exact commands and results. Distinguish passed, failed and not run, including whether tests used actual DB policies or mocks.

### Remaining risks/blockers
Record only actionable facts, without secrets or private user data.

### Next action
Write the single next concrete step and its exit condition.

---

## 26 September 2026 — Static UI prototype for GitHub Pages

### Task and revision
Build a runnable, testable UI prototype that deploys to GitHub Pages. Branch `claude/optimistic-ritchie-x37nds` of `ietaiga-webapp`.
The original mobile prototype source (Vinext/Sites, HEAD `56249a1`) was **not** available in this repository, and its live URL was unreachable from the build environment, so this is a new Vite + React + TypeScript implementation. It does not reproduce the original visual design; the stage A–F plan in `REFACTOR-PLAN.md` still refers to the original source.

### Completed
- Vite 5 + React 18 + strict TypeScript app, pnpm lockfile, hash routing for Pages.
- Screens: overview/attention, Wallet (Tickets/Trips), concerts list/search/filter/add/archive, concert detail with independent status selects, trip detail with per-currency cost totals, settings (export/reset).
- Pure domain rules: `features/reminders/domain/attention.ts`, `features/trips/domain/costs.ts`, `lib/dates.ts`, `lib/money.ts`.
- Workflows: `.github/workflows/ci.yml` (typecheck/test/build on every push/PR), `.github/workflows/pages.yml` (deploy on `main`).

### Verification
- `pnpm typecheck` — pass.
- `pnpm test` — 4 files, 14 tests pass (attention rules, cost rules, dates, router).
- `BASE_PATH=/ietaiga-webapp/ pnpm build` — pass.
- Headless Chromium smoke run against the built site served under `/ietaiga-webapp/` at 390×844 and 1280×860, light colour scheme: overview, wallet expand, status change, trip, add-concert validation, save and reload persistence; no console errors.
- Not run: dark mode, reduced-motion, real devices, keyboard-only pass, lint/format (no ESLint configured yet), import-boundary checks, CI on GitHub (runs on push).

### Remaining risks/blockers
- GitHub Pages must be enabled with source "GitHub Actions" by a repository admin; the deploy workflow only runs on `main`.
- Demo persistence only; no auth, backend, images or reminders (MVP-01, -09, -10, -11 not started).
- No lint/boundary gates yet (QUALITY-GATES.md).

### Next action
Add ESLint + import-boundary rules (domain may not import React/app; features may not deep-import each other) with failing fixtures, wired into `pnpm check` and CI. Exit: `pnpm check` fails on a fixture violation and passes on the clean tree.
