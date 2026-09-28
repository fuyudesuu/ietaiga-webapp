# Encore

A frontend prototype for a personal concert and travel planner. All event schedules, outcomes, hotels, provider associations, and account details are fictional. The demo clock is fixed at 1 October 2026, 12:00 JST for repeatable deadline scenarios.

## Run and verify

Use the repository's declared pnpm version and lockfile. The Sites starter uses React, TypeScript, and Vinext (a Next.js App Router compatible framework); this is a prototype runtime choice, not a change to the proposed production stack.

- `pnpm dev`: start locally in a supported development environment.
- `pnpm build`: compile the application.
- `pnpm exec tsc --noEmit`: check TypeScript.
- `node --test tests/model.test.mjs`: verify the actual time/money/domain functions.
- `pnpm exec prettier --write app components/encore lib/encore tests README.md`: format authored code.

Managed Sites environments use the provided Sites build and preview scripts instead of a manually started development server. Full browser review is currently blocked by the unavailable supervised preview service. Direct production requests confirm that Trips, Concerts, and Settings return their own pages successfully. WebMCP registration testing was likewise unavailable; its integration is feature-detected and optional.

## GitHub Pages test build

`pnpm build:pages` produces a static export in `dist/pages` for GitHub Pages; `.github/workflows/pages.yml` deploys it from `main`. Set `ENCORE_BASE_PATH` (for example `/ietaiga-webapp`) for a project site. Concerts and trips created in the browser open through the pre-rendered `/concerts/view?id=…` and `/trips/view?id=…` pages. The default `pnpm build` and Sites/Cloudflare runtime are unchanged. Details: `docs/engineering/PROGRESS.md`.

## Navigation

Section and detail links use native anchors so private hosting does not depend on client-side RSC navigation. Creating a concert/trip and deleting a trip use `commitAndNavigate`, which commits the state update and local-storage effect before document navigation. Preserve native link behavior for keyboard activation, modified clicks, browser history, and opening new tabs.

## Modules

- `lib/encore/model.ts`: shared domain types and pure presentation/summary rules.
- `lib/encore/fixtures.ts`: synthetic seeds only.
- `lib/encore/store.tsx`: local state adapter, preferences, editor state, and notices.
- `components/encore/overview.tsx`: derived attention items and upcoming events.
- `components/encore/concerts.tsx`: performance and ticket application workflows.
- `components/encore/trips.tsx`: trip lists, chronological itinerary, hotels, and costs.
- `components/encore/settings.tsx`: theme, time zone, currency, simulated Discord destinations, export/reset.
- `components/encore/forms.tsx`: accessible record editors and client validation.
- `components/encore/ui.tsx`: small product UI compositions using bundled accessible primitives.
- `components/encore/shell.tsx`: responsive navigation, shared page shell, and modal host.
- `app/globals.css`: semantic themes, material treatment, and responsive layouts.

UI actions use the same store, so recording payment updates all derived summaries. No direct provider requests, OAuth, bots, databases, or scheduled jobs are implemented. This prototype intentionally opens at the useful Overview surface with a demo identity. Preferences and synthetic record edits persist in `encore-demo-v1` local storage; Settings offers reset and JSON export. Browser storage is not suitable for production credentials or private travel records.

## Useful review paths

1. Open the first payment deadline. Record payment and return to Overview; it disappears from attention and the paid total increases.
2. Open Love Live!, record a result, and edit its payment deadline.
3. Open the Tokyo trip, switch between itinerary, stays, and expenses, edit a hotel, or attach a wishlist concert.
4. Search/filter concerts and create or edit a performance/application/trip.
5. Choose DM or channel in Settings, inspect the privacy-safe preview, simulate success or a blocked delivery, change theme/time zone, and reset sample data.

The current editors use JST for source event/deadline entry, explicitly labeled. Display conversion supports Tokyo, Singapore, Sydney, and Los Angeles. More source time zones, custom reminder timing, transport-note editing, authentication/onboarding, record deletion beyond trips, date-only deadline precision, live backends, and real Discord prerequisites remain production integration/expansion work. The source is modular enough to replace the local adapter, but future servers must independently validate and authorize all operations. Frontend checks are not security boundaries.

## Visual direction and image credit

Encore now uses cool neutral surfaces, cobalt actions, selective frosted navigation, and date-led concert lists. The overview pairs an actionable deadline agenda with a unified journey document containing concerts, stays, and separate currency totals. Compact/mobile layouts include floating navigation; dark, system, reduced-motion, and reduced-transparency modes are supported.

Styles are split into shared tokens (`app/globals.css`), shell materials, overview composition, feature layouts, and responsive rules under `app/styles/`. `PRODUCT.md` and `DESIGN.md` record product truth and design decisions. The existing domain/store/form modules and reliable document navigation remain in place.

Validation for this redesign: TypeScript, production build, six domain tests, and an isolated React/DOM interaction check for recording payment, updated totals/local persistence, editor selection, and accessible calendar tabs. Independent source review found and resolved content-height, reduced-transparency cascade, and tab-panel issues. The managed browser preview service was unavailable, so rendered desktop/mobile layout and end-to-end browser navigation remain unverified.

Tokyo photograph by Kazuend, CC0 public domain: https://commons.wikimedia.org/wiki/File:Shiba-koen,_aerial_view_on_Tokyo_Tower_at_dusk_(Unsplash).jpg

The photograph depicts a real city; named performance and hotel fixtures are fictional. It is shown for Tokyo itineraries only. The source image was resized for delivery without generated elements.

## Mobile Wallet edition

This independent Site was branched from Encore live version 3, commit `06e43050fdd57e2f72da51a94e895c2e58dbd03e`. The parent Site is not changed or published by this checkout. This edition uses a separate Site repository and `encore-mobile-demo-v1` browser storage key.

The photo Wallet replaces Overview below 768px. Desktop retains the original agenda. Select Tickets or Trips, tap a cover, and use Done, Escape or the drag handle to return. Related trips/concerts open inside the Wallet; full detail pages and existing editors remain available. The stack shows the first three upcoming records; View all opens the complete collection.

Use **Edit / image** on an expanded card to choose or remove its image. JPG/PNG/WebP uploads are decoded, resized to a maximum 1000px edge, re-encoded as JPEG without metadata, and bounded to 280,000 data-URL characters. Source uploads are limited to 12MB. Images are stored only with that item in this browser. Storage failures are reported. No actual ticket credentials, login, Discord delivery, cloud sync or official franchise art is supplied.

### Implementation boundaries

- `components/encore/wallet/mobile-wallet.tsx`: selection, tabs and related-item navigation.
- `components/encore/wallet/wallet-card.tsx`: image-backed card rendering and fallback.
- `components/encore/wallet/use-wallet-motion.ts`: interruptible spring transforms and reduced motion.
- `components/encore/wallet/wallet-details.tsx`: concert applications, linked trips and hotel stays.
- `components/encore/item-image-field.tsx` and `lib/encore/images.ts`: image selection, validation and compression.
- `app/styles/wallet.css`: scoped mobile presentation; existing desktop styles retained.

Concert sample cover: AI-generated illustrative arena image from the earlier design exploration. Generation prompt is in `public/concert-stage-source.txt`. It does not depict a claimed franchise performance. Tokyo photo retains its existing credit above. Osaka has no assigned photo until one is chosen.
