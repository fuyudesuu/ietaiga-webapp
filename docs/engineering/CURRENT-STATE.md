# Verified starting state

> Paths below are from the original export. On 28 September 2026 `components/encore/*` moved to `features/<name>/ui/`, `components/shell/` and `components/encore-ui/`. See `README.md` (Layout) and `docs/engineering/PROGRESS.md`.

Snapshot: 27 September 2026 Sydney. Verify against the checkout before acting.

Mobile prototype HEAD when inspected: `56249a1ca17a2248a5bf3023cda8ad032532c8a4`.

The mobile prototype is a separate Site/source checkout from the original desktop prototype. Do not change the original Site, its identity or its production deployment as a side effect of modernization. This kit makes no application edits.

## Implemented

- React/TypeScript screens for overview, concerts, applications, trips, hotels and settings.
- Mobile Wallet with image-backed cards, Tickets/Trips tabs, selection, animation and linked details.
- Browser-local persistence, image compression, sample data and simulated Discord settings.
- Strict TypeScript, ESLint/Prettier configuration and six domain tests.
- Route files delegate to UI components. The current runtime is Vinext/Vite with a Sites/Cloudflare build wrapper, despite Next.js-compatible imports.
- `lib/encore/navigation.ts` flushes prototype updates before full-page navigation; preserve the behavior while replacing the storage mechanism.

## Not implemented

Production Discord account authentication, account-owned cloud records, private cloud images, real delivery, relational ownership policies, production CI gates and release-ready operations. Installed database packages and starter files do not prove a backend exists. Do not present simulated connections as working authentication.

## Existing organization and pressure points

| File | Approximate lines | Action when touching it |
|---|---:|---|
| `components/encore/forms.tsx` | 668 | Split individual editors from shared dialog lifecycle and persistence |
| `components/encore/trips.tsx` | 551 | Separate list/detail/itinerary/stays responsibilities incrementally |
| `components/encore/concerts.tsx` | 501 | Separate list/detail/application views as they change |
| `components/encore/settings.tsx` | 410 | Isolate preferences, identity and destination setup |
| `components/encore/overview.tsx` | 407 | Separate view selection and agenda/journey sections |
| `components/encore/wallet/mobile-wallet.tsx` | 373 | Separate only demonstrated selection/gesture/data-selection concerns |
| `components/encore/wallet/wallet-card.tsx` | 72 | Preserve as a focused rendering component |
| `components/encore/wallet/use-wallet-motion.ts` | 75 | Preserve the motion boundary; test interruption when changing it |
| `lib/encore/store.tsx` | 119 | Browser store; replace authoritative persistence feature by feature |
| `lib/encore/model.ts` | 166 | Types plus domain utilities; move by responsibility during feature work |
| `app/styles/features.css` | 1,435 | Several features share global selectors; do not keep appending here |
| `app/styles/responsive.css` | 847 | Both visual overrides and breakpoints; reconcile when migrating a component |
| `app/styles/wallet.css` | 565 | Wallet plus image picker; assign each to its component without redesign |

These are baseline observations, not reasons to perform a wholesale rewrite. New file names and line counts can change; use current source as authority.

## Commands and verification limits

Existing package manager: pnpm, version declared in `package.json`; Node requirement is also declared there. Install reproducibly from the lockfile in a fresh checkout. Do not carry over local dependency symlinks from the prior environment.

Current commands: `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm test`, `pnpm build`. The `test` command currently covers only `tests/model.test.mjs`. Adding test files does not make them execute automatically: update discovery deliberately and prove they ran.

Previous work passed TypeScript, domain tests, focused lint and an external React/JSDOM interaction harness. That harness is not a reproducible checked-in browser suite. Preview infrastructure was unavailable. Treat previous visual/touch behavior as unverified; do not invent screenshots or carry a "visual QA passed" status forward.

The MVP proposes Next.js/Supabase, but runtime/hosting selection remains an explicit milestone-0 decision. Preserve the current runtime for the initial refactor/quality task; document a migration separately if needed.
