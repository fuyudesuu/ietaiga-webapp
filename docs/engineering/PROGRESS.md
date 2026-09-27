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
