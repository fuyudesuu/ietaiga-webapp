# Encore

A personal concert and travel planner prototype: concerts, ticket application rounds, trips, hotel stays and deadlines, with a mobile photo Wallet. All records are fictional demo data stored in the browser (`localStorage`). There is no login, backend or real reminder delivery yet.

Live test build: https://fuyudesuu.github.io/ietaiga-webapp/ (the Wallet appears below 768px wide).

## Run

Requires Node 22.13+ and pnpm (version pinned in `package.json`).

```sh
pnpm install --frozen-lockfile
pnpm dev            # local dev server
pnpm check          # types, lint, format, import boundaries, tests, build
```

| Command                 | Purpose                                                                                    |
| ----------------------- | ------------------------------------------------------------------------------------------ |
| `pnpm build`            | Cloudflare Workers build (Vinext)                                                          |
| `pnpm build:pages`      | Static GitHub Pages build in `dist/pages`; set `ENCORE_BASE_PATH` (e.g. `/ietaiga-webapp`) |
| `pnpm test`             | Domain, storage and boundary-rule tests (`tests/*.test.mjs`)                               |
| `pnpm check:boundaries` | Import-boundary rules (`.dependency-cruiser.cjs`)                                          |

GitHub Pages deploys from `main` via `.github/workflows/pages.yml`.

## Layout

```
app/                 routes (thin pages), layout and global styles (app/styles/)
features/<name>/     one folder per product area; import it only via its index.ts
  concerts/  trips/  overview/  settings/  wallet/
  editors/           record editors for every feature (split per feature in stage B)
components/
  shell/             app shell: navigation, editor host, browser tools
  encore-ui/         small shared product UI (headings, pills, empty states)
  ui/                shadcn/Radix primitives in use
lib/encore/          domain model, demo data, browser store, dates/money, paths
tests/               node:test suites; boundaries/fixtures prove the import rules
patches/             pnpm patch for vinext (static export base path)
scripts/             GitHub Pages packaging
docs/                product, design, engineering and history
```

The import rules in `.dependency-cruiser.cjs` enforce this: features use each other only through `index.ts`, shared code never imports features, pure domain code never imports React or the database, and there are no import cycles.

## Documentation

- `docs/product/`: MVP scope (`MVP.md`) and product context.
- `docs/design/`: design direction.
- `docs/engineering/`: architecture, workflow, quality gates, refactor plan and `PROGRESS.md`.
- `docs/history/`: records from the original prototype and handoff.
- `CLAUDE.md` and `.claude/rules/`: instructions for Claude Code.
