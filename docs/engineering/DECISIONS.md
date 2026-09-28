# Decisions

Short records of decisions that change hosting, runtime, authentication, persistence, caching or delivery guarantees. Newest first.

## 2026-09-28 — Hosting: GitHub Pages now, Cloudflare Workers build kept, Sites removed

**Context.** The prototype came from a ChatGPT Sites project with Sites-specific build tooling: a dev-server plugin faking ChatGPT sign-in headers, execution-profile and installer scripts, and `.openai/hosting.json`. It now runs as a static test build on GitHub Pages. The owner may later deploy to a host better suited to the MVP.

**Decision.**

- Remove the Sites-specific tooling and the unused Sites starter files (ChatGPT auth helper, D1/Drizzle setup, examples).
- Keep Vinext as the framework and keep its Cloudflare Workers server build (`pnpm build`, `pnpm start`). It is the only server-side deploy target in the repo and a plausible production candidate.
- Keep GitHub Pages (`pnpm build:pages`) as the current public test build.

**Alternatives.**

- Keep Sites: rejected. The prototype is no longer deployed there, and the tooling only served that environment.
- Remove Cloudflare as well: rejected for now. Nothing else could serve a server-rendered deploy.

**Impact.** No application behavior changes. `pnpm dev` and `pnpm build` call Vinext directly. The final production host, and with it authentication and persistence, remains the milestone-0 decision in `docs/product/MVP.md`. It should be recorded here when made.
