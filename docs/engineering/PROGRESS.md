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

## 27 September 2026 — Baseline import and GitHub Pages test build

### Task and revision
Replace the repository contents with the exported mobile prototype (source commit `56249a1`), then add a static GitHub Pages build for UI testing. Branch `claude/optimistic-ritchie-x37nds`. This is not stage A of `REFACTOR-PLAN.md`.

### Baseline (unmodified export, before any change)
- `sha256sum -c SOURCE-FILES.sha256` — all tracked source files match.
- `pnpm install --frozen-lockfile` (pnpm 11.25.0, Node 22.22) — pass.
- `pnpm exec tsc --noEmit` — pass.
- `pnpm test` — 6 pass, 0 fail.
- `pnpm lint` — **fail**: 26 problems (10 errors, 16 warnings). Errors: 7 × `@next/next/no-html-link-for-pages` (intentional native anchors), `react-hooks/refs` in `components/encore/web-tools.tsx`, 2 × `react-hooks/set-state-in-effect` in `lib/encore/store.tsx`.
- `pnpm build` (Vinext/Cloudflare) — pass.

### Completed
- `pnpm build:pages`: `ENCORE_STATIC_EXPORT=1` switches `next.config.ts` to `output: "export"` with `basePath` from `ENCORE_BASE_PATH`; `scripts/pages-artifact.mjs` assembles `dist/pages`. The default build and runtime are unchanged.
- `patches/vinext@1.0.0-beta.5.patch` (via `pnpm patch`): the static-export prerenderer requested routes without `basePath`, so every route returned 404. The patch prefixes the three prerender request URLs with `config.basePath`. Remove when upstream fixes it.
- `lib/encore/paths.ts` `withBasePath()` applied to root-absolute links, images and `commitAndNavigate`. Fixture image paths stay unchanged in stored data and are prefixed at render time.
- Records created in the browser have no exported page. `app/not-found.tsx` redirects unknown `/concerts/<id>` and `/trips/<id>` paths to the pre-rendered `/concerts/view?id=…` / `/trips/view?id=…`; `useRecordId()` reads that id. `generateStaticParams` exports seeded records plus `view`.
- `.github/workflows/ci.yml` (typecheck, tests, prettier, both builds) and `.github/workflows/pages.yml` (deploy on `main`).

### Verification
- `pnpm exec tsc --noEmit` — pass. `pnpm test` — 6 pass. Prettier check on `app components/encore lib/encore tests` — pass. `pnpm build` — pass. `ENCORE_BASE_PATH=/ietaiga-webapp pnpm build:pages` — 14 routes pre-rendered.
- `pnpm lint` — 19 problems (3 errors, 16 warnings). The 3 errors are the baseline ones above in untouched files. The 7 `no-html-link-for-pages` errors no longer appear only because hrefs are now `withBasePath(...)` calls the rule cannot read; the anchors themselves are unchanged. This is not a lint fix.
- Headless Chromium against `dist/pages` served under `/ietaiga-webapp/` by a local server mimicking Pages (`X` → `X.html`, missing → `404.html`), at 390×844 and 1280×900, light scheme: all six routes render with images; no root-relative link lacks the base path; creating a concert lands on its fallback page and survives reload; an unknown concert id shows "Concert not found".
- Not run: real GitHub Pages deploy, dark mode, reduced motion, keyboard pass, real devices.

### Remaining risks/blockers
- Pages must be enabled with source "GitHub Actions" by a repository admin; deploys only run from `main`.
- Links to browser-created records open via one 404 → redirect hop on Pages (expected, visible in devtools).
- Lint is not in CI until the 3 baseline errors are resolved.

### Next action
Stage A from `START-HERE.md`: make `pnpm lint` pass without suppressions (decide the native-anchor rule explicitly), add import-boundary checks with fixtures, and add lint to CI. Exit: `pnpm lint` and CI are green on a clean tree and fail on fixture violations.

---

## 27 September 2026 — Stage A: engineering baseline and quality gates

### Task and revision
Stage A of `REFACTOR-PLAN.md`, on `claude/optimistic-ritchie-x37nds` from `main` at `e4d6e54`. No UI, route or stored-data-format changes.

### Completed
- **Lint passes with no suppressions.** `lib/encore/demo-storage.ts` turns browser storage into an external store read with `useSyncExternalStore`. This replaces the load-then-setState effect and the save effect in `lib/encore/store.tsx`. Edits are now written to localStorage synchronously inside `update`, before listeners re-render, so save-before-navigation no longer depends on an effect running inside `flushSync`. A failed write still shows the existing storage notice. `web-tools.tsx` updates its ref in an effect instead of during render. Unused imports were removed.
- **Two Next.js rules disabled project-wide, with written reasons** in `eslint.config.mjs`:
  - `no-html-link-for-pages`: native anchors are intentional.
  - `no-img-element`: covers are data URLs, and the static export cannot optimize images.
- **Import boundaries** via `dependency-cruiser` 18.4.0 (`.dependency-cruiser.cjs`, `pnpm check:boundaries`). The rules are:
  - client code must not reach server-only modules, including through re-exports and the `@/` alias;
  - domain code must stay pure;
  - features may only use each other through `contracts/` or `index.ts`;
  - shared code must not import features;
  - no import cycles.
  The current source has no violations and no legacy exceptions. `tests/boundaries.test.mjs` runs the rules against `tests/boundaries/fixtures` and proves a direct, an alias and a re-export violation all fail, while a type-only contract import passes.
- **Scripts:** `pnpm test` now discovers `tests/*.test.mjs`. Added `format:check`, `check:boundaries`, and `check`, which runs every gate plus the default build.
- **CI:** `.github/workflows/ci.yml` now also runs lint, the format check and the boundary check.

### Verification
- `pnpm check` exits 0:
  - tsc passes;
  - lint shows 0 problems (baseline: 10 errors, 16 warnings);
  - Prettier passes;
  - the boundary check finds no violations across 106 modules;
  - `pnpm test`: 19 pass (6 model, 5 storage, 8 boundary);
  - `pnpm build` passes.
- `ENCORE_BASE_PATH=/ietaiga-webapp pnpm build:pages` pre-renders 14 routes. No fixture code appears in `dist`.
- Temporary violations injected into real files (`lib/encore/model.ts` importing React, `components/encore/ui.tsx` importing `app/chatgpt-auth.ts`, `components/ui/button.tsx` importing `components/encore/ui.tsx`) were all reported, including through indirect importers. They were then reverted.
- The headless Chromium Pages run at 390px and 1280px passes as before:
  - all routes render;
  - creating a concert persists across a reload;
  - there are no hydration errors.
- CI proof: commit `a273163` passed CI (run 8). Deliberate probe `1a30966` (`lib/encore/model.ts` importing React) failed CI at `pnpm check:boundaries` (run 9), with every earlier step passing. The probe was reverted in the following commit.
- Not run: dark mode, reduced motion, a keyboard-only pass, real devices, or a storage-full scenario in a real browser (covered by unit tests only).

### Behavior note
The first visit no longer writes the untouched seed to localStorage. Storage is written on the first edit. What is shown and exported is unchanged.

### Remaining risks/blockers
- Branch protection (requiring CI before merge) is not enabled, and I cannot verify or change it. A repo admin must set it under Settings → Branches.
- Domain purity is checked by imports only. Browser globals used without an import are not detected.

### Organization review (27 September 2026)
- 46 of 61 vendored `components/ui` files are unreachable from the app. About 13 dependencies are used only by them: recharts, react-hook-form, embla, cmdk, vaul, sonner, input-otp, react-day-picker, react-resizable-panels, next-themes, @base-ui, @shadcn/react. date-fns, zod and @hookform/resolvers are not used at all.
- Unused Sites starter scaffolding: `app/chatgpt-auth.ts`, `db/`, `drizzle/`, `drizzle.config.ts`, `examples/`. `SOURCE-EXPORT.md` asks to keep the hosting helper until a runtime decision, so remove these with that decision.
- The root holds 9 handoff/history documents: README-HANDOFF, START-HERE, SOURCE-EXPORT, SOURCE-FILES.sha256, WORK_LOG, PRODUCT, DESIGN, `.impeccable/`, and `.openai/`. Candidates to move under `docs/`.
- Code is organized by screen (`components/encore/*`), not by the planned `features/<name>/` layout. Largest files: `app/styles/features.css` (1,435 lines), `responsive.css` (847), `forms.tsx` (668), `trips.tsx` (555), `concerts.tsx` (509). This is the stage B/C work.

### Next action
Stage B: extract the concert editor from `components/encore/forms.tsx` into `features/concerts/` with characterization tests, keeping the store behind an explicit adapter. Exit: create/edit/cancel/validation/image flows behave as before, the new module passes the boundary rules, and `pnpm check` is green.
