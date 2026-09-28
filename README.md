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

## Documentation

- `docs/product/`: MVP scope (`MVP.md`) and product context.
- `docs/design/`: design direction.
- `docs/engineering/`: architecture, workflow, quality gates, refactor plan and `PROGRESS.md`.
- `docs/history/`: records from the original prototype and handoff.
- `CLAUDE.md` and `.claude/rules/`: instructions for Claude Code.
