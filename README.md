# Encore — UI prototype

A personal concert and travel planner prototype (Japan concert trips: lottery rounds, payments, hotels).
This is a **static front-end prototype** for testing the UI on GitHub Pages. It uses fictional demo data
stored only in the visitor's browser (`localStorage`). There is no login, backend or real reminder delivery.

Product scope: [`docs/product/MVP.md`](docs/product/MVP.md) · Engineering rules: [`CLAUDE.md`](CLAUDE.md)

## What you can try

- **Overview** — attention list (applications closing, results to check, payments due, hotel free-cancellation cutoffs), next trip, upcoming concerts. Deadlines show the event zone (Asia/Tokyo) plus your device zone.
- **Wallet** — Tickets/Trips tabs with stacked cards; tap a card to expand its details.
- **Concerts** — search, filters (upcoming / needs attention / archived), add a concert (unknown date allowed), archive.
- **Concert detail** — application rounds with independent application / result / payment / collection statuses. Changing a status updates the attention list.
- **Trip detail** — attached concerts, hotels, committed vs paid totals per currency (no conversion; unknown prices are counted separately, not as zero).
- **Settings** — export demo data as JSON, reset demo data.

## Develop

Requires Node 20+ and pnpm (version pinned in `package.json`).

```sh
pnpm install
pnpm dev          # http://localhost:5173
pnpm check        # typecheck + tests + build
```

| Command | What it does |
|---|---|
| `pnpm typecheck` | Strict TypeScript (`tsc --noEmit`) |
| `pnpm test` | Vitest domain tests (`src/**/*.test.ts`) |
| `pnpm build` | Production build to `dist/` |
| `BASE_PATH=/ietaiga-webapp/ pnpm build && BASE_PATH=/ietaiga-webapp/ pnpm preview` | Preview the build under the Pages sub-path |

## Deploy to GitHub Pages

`.github/workflows/pages.yml` builds and deploys on every push to `main` (or manually via *Run workflow*).
One-time setup: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
The site is then served at `https://<owner>.github.io/ietaiga-webapp/`. Routing uses URL hashes
(`#/wallet`, `#/concerts/<id>`), so deep links work without a 404 fallback.

## Layout

```
src/
  app/            shell, hash router, prototype store (localStorage), overview page
  components/     shared visual primitives and CSS modules (no domain logic)
  demo/           fictional seed data, generated relative to the current date
  lib/            dates (UTC instants vs date-only) and money (integer minor units)
  features/
    concerts/     domain types, list/detail/add UI
    trips/        domain types, cost summary rule, detail UI
    stays/        hotel stay types
    reminders/    attention-list rule and UI
    wallet/       mobile Wallet UI
    settings/     export/reset UI
```
