# Encore engineering instructions

## Start here
- This repository is a personal concert/travel planner. Preserve the existing visual direction and working flows.
- Read `docs/engineering/CURRENT-STATE.md` and the relevant acceptance criteria in `docs/product/MVP.md` before implementing a feature.
- Before changing architecture, read `docs/engineering/ARCHITECTURE.md`. Follow `docs/engineering/WORKFLOW.md` for every task.
- For the first modernization task, use `docs/engineering/REFACTOR-PLAN.md`; implement one bounded stage at a time.
- Follow existing higher-priority instructions and the user's current request. This file does not grant deployment, messaging, credential or destructive-operation permission.
- Inspect actual files and Git status. The snapshot documents are evidence, not permission to overwrite newer work.

## Product invariants
- Personal data is private per authenticated owner. Ownership is checked at the server and database boundaries.
- A trip has many concerts/stays; a concert has many application rounds and at most one trip initially.
- Application, result, payment and collection states are independent. Do not infer a lottery win from a passed result date.
- Monetary values use integer minor units plus currency. Unknown amounts are null; never merge currencies without an explicit conversion model.
- Exact deadlines use UTC instants plus their source timezone. Date-only values stay date-only. Production uses a real injectable clock.
- Changing a deadline/payment must invalidate obsolete reminders in the same transaction as the domain change.
- Payment recording does not charge money. Planner cards are not admission tickets.
- Preserve manual entry and unknown dates. No fanclub passwords, scraping or bot delivery without the relevant approved scope.

## Code boundaries
- Use one modular application with feature ownership: identity, concerts, trips, stays, reminders and assets.
- Pages and request handlers compose/delegate. Components render/interact. Services coordinate use cases. Repositories own database access.
- Pure domain rules must not import React, browser globals, Next.js, database clients, provider SDKs or environment secrets.
- Client modules never import server implementations, even through a shared barrel. Keep server-only modules explicitly guarded.
- Feature-to-feature calls use deliberate public contracts. Avoid circular imports and deep imports into another feature's implementation.
- Add layers only when they separate real responsibilities. Do not create generic base repositories, dependency-injection frameworks, or empty architecture folders.
- Keep third-party APIs behind narrow adapters. Do not spread Supabase/Discord response types throughout UI and domain code.

## Maintainability
- Implement the smallest complete, reviewable change that satisfies the task. Do not rewrite the app or add adjacent features opportunistically.
- Name values and operations for their domain meaning. Avoid single-letter domain variables in new/refactored business code.
- Prefer explicit types, discriminated states, named props and understandable control flow. Treat external data as unknown until validated.
- Do not use `any`, double casts, non-null assertions or lint suppressions to conceal a modeling error. Document genuinely necessary exceptions narrowly.
- No catch-and-ignore for saves, authentication, uploads or delivery. Distinguish expected domain failures from unexpected faults.
- Do not grow `features.css` with new feature responsibilities. Extract the touched responsibility and preserve behavior. Record editors live in their feature (`features/<name>/ui/*-editor.tsx`); `features/editors` only hosts the dialog.
- File size is a review signal: around 250 lines, check cohesion; beyond 400, explain why splitting would harm clarity or split by responsibility. These are not minification targets or blanket limits.
- Keep display models separate from persistence models where they differ. Never duplicate the same authoritative state across several stores.
- Use one source for design tokens. Feature styles use CSS Modules; keep responsive rules beside their component. Avoid global override chains.

## Verification and delivery
- Discover commands from `package.json`. `pnpm check` runs every gate: types, lint, format, import boundaries (`pnpm check:boundaries`), tests and build. `pnpm build:pages` builds the GitHub Pages export, and `pnpm test:e2e` then runs the browser tests against it (also in CI).
- Keep the existing lockfile/package manager and runtime (Vinext, with a Cloudflare Workers build and a GitHub Pages export) until an explicit migration decision recorded in `docs/engineering/DECISIONS.md`. Do not silently switch frameworks or hosts.
- Record pre-existing failures before editing. New code must not worsen them. Never disable checks, delete tests or weaken policies just to get green output.
- Test domain behavior, authorization and failure paths, not only the happy path. Cosmetic changes need focused visual verification, not artificial test cases.
- Database authorization tests must exercise actual policies with two users and an anonymous caller. Mocks alone do not prove account isolation.
- A refactor must preserve observable behavior; write focused characterization tests before changing risky existing behavior.
- Run relevant checks, inspect the final diff, and report exact results. Unavailable checks are marked not run, never passed.
- Keep implementation, dependency changes and migrations reviewable. Record migrations and rollback/forward-fix strategy when data is affected.
- Update relevant docs and `docs/engineering/PROGRESS.md`. Record the next concrete action and blockers without secrets.
- Do not claim the MVP is production-ready because it builds. Use the release criteria in the product spec.

## Task completion report
Report: outcome; files/responsibilities changed; verification commands and results; remaining risks or blockers; next task.
Explicitly distinguish implemented functionality, simulations, planned work and checks that could not run.
