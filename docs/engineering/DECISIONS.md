# Decisions

Short records of decisions that change hosting, runtime, authentication, persistence, caching or delivery guarantees. Newest first.

## 2026-11-01 — Stage D: Cloudflare Workers, Supabase, Discord sign-in with server-only sessions

**Status.** Accepted for implementation. It takes effect when the owner provisions the accounts (docs/engineering/SETUP-SUPABASE.md). Until then, deployments run as the demo and GitHub Pages stays the public preview.

**Context.** The MVP needs private accounts that work across devices (MVP-01), private cover images (MVP-09) and later reminders. The repository already builds for Cloudflare Workers through Vinext. The product spec recommends Supabase (Postgres, Auth, Storage) with Discord login.

**Decision.**

- **Hosting.**
  - The app runs on Cloudflare Workers (the existing Vinext build). The static GitHub Pages export stays a demo with no sign-in: route handlers are not exported.
  - Workers reads its settings from `process.env` (`nodejs_compat_populate_process_env`).
- **Data.**
  - Supabase Postgres holds the data, with versioned SQL migrations in `supabase/migrations/`.
  - Every user table has `owner_id`, forced row-level security and policies for `authenticated` only. Anonymous callers have no privileges.
  - Links between records use composite `(owner_id, id)` foreign keys, so the database itself rejects cross-account links.
  - `owner_id` and `id` are immutable.
  - Cover images live in a private `covers` bucket under `<owner_id>/`.
- **Identity.**
  - Supabase Auth with the Discord provider. The app requests only `identify`; Supabase's provider is expected to add `email`, so the email address is treated as stored account data (to confirm on staging). No server or message access. Login is separate from any notification consent.
- **Sessions.**
  - `@supabase/ssr` with the PKCE flow, run only in server route handlers.
  - Cookies are `HttpOnly`, `SameSite=Lax`, `Secure` outside localhost, with a 30-day cap. PKCE verifier cookies are capped at 10 minutes.
  - Auth responses are `Cache-Control: no-store`.
- **Who the user is.**
  - Authorization decisions use `auth.getUser()`, which checks with the Auth server. A decoded cookie alone is never trusted.
  - An Auth outage is an error, not "signed out".
- **Key and query handling.**
  - The app uses only the publishable (anon) key, and every query runs as the signed-in user under RLS.
  - The service-role key is not used by the web app. A later privileged worker (reminders, account cleanup) must isolate it and check ownership itself.
- **Browser and server boundary.**
  - Browser code never imports a Supabase SDK; dependency-cruiser enforces this with `client-uses-no-supabase`.
  - All data access happens in server code under `features/*/server`.
- **Request forgery and redirects.**
  - Sign-in start and sign-out are POST-only.
  - They require a same-site `Origin` or `Sec-Fetch-Site` header (CSRF).
  - Redirect targets are built from the configured `ENCORE_SITE_URL`, never the request's Host header.
  - The post-login return path accepts same-site paths only (no open redirect).
  - Errors are logged as a category plus a correlation id, never tokens or codes.

**Security review (2026-11-01).**

An independent adversarial review of the schema found no cross-account access. Its 92 attack tests are kept in `tests/db/pentest.test.sql`.

Fixed in the migration:

- cover folders of deleted accounts are queued for Storage API removal (`private.storage_cleanup`);
- cover object names must be `<owner>/<name>.(jpg|png|webp)`, and an asset's type must match its extension;
- per-account caps on rows and cover files;
- sign-up names are sanitized;
- the migration asserts its role bypasses RLS;
- trigger functions are not callable over RPC, and the API roles get no default privileges;
- time zones must be real IANA zones;
- restrictive policies shut out Supabase anonymous-sign-in users.

Accepted, as content-free leaks:

- primary keys are global, so a guessed UUID can be confirmed to exist;
- planner estimates (`count=planned`) reveal rough table volume.

A second review attacked the sign-in code and the running Workers build. It found no exploitable critical or high issue. Fixed:

- sign-out always clears the session cookies, even when the token refresh fails;
- the return path is re-checked after dot-segment normalisation, and the callback checks the final origin;
- rejected or tampered tokens count as signed out, while a rejected API key is a configuration error;
- `__Host-` cookie names on https stop sibling subdomains from planting sessions;
- security headers on every response: frame-ancestors and X-Frame-Options, base-uri, object-src, form-action, nosniff, Referrer-Policy (`no-referrer` on `/auth/*`), Permissions-Policy, and HSTS on https;
- secret and service-role keys are refused as the publishable key;
- the PKCE flow id is used, so two tabs can sign in at once;
- cookies are cleared even with sign-in switched off;
- invalid settings return `no-store` errors, and logs carry error names and codes, never messages.

Its tests are in `tests/identity-security.test.mjs`.

Still required before launch:

- the upload route validates real file content and strips metadata before storing;
- the account-deletion worker removes queued folders;
- the policy tests run against a real Supabase project (staging), because the test stand-in is not real Supabase storage or its role setup;
- a Cloudflare rate-limiting rule on `/auth/*` (SETUP-SUPABASE.md);
- a script-source Content Security Policy with per-request nonces;
- any future GET handler or page must have no side effects, because the session cookie is SameSite=Lax; Server Actions need their own CSRF check;
- `next` (types only; the Worker runs vinext's server) is bumped past its advisories, and vinext security releases are tracked.

Known limitation: signing out while Supabase Auth is unreachable takes about 25 seconds (the library retries the refresh) before the cookies are cleared.

**Alternatives.**

- **Standard Next.js on a Node host:** rejected for now. It would be a hosting migration without a demonstrated need; Workers is already built and tested.
- **A browser Supabase client:** rejected. It would expose session tokens to page scripts and spread data access into UI code.
- **A custom session system:** rejected (MVP: managed authentication).

**Security and operations impact.**

- Account isolation is proven by `pnpm test:db`, which runs the policies on real PostgreSQL as two users and an anonymous caller. CI runs it.
- The tests use a minimal Supabase stand-in (`tests/db/supabase-shim.sql`). Before launch, the same tests must also pass against a real Supabase project (staging).
- The owner must configure in Supabase: redirect allowlist, site URL, Discord provider, rate limits and leaked-password settings where applicable.

**Rollout.**

1. Merge with no accounts configured: no behaviour change.
2. The owner creates staging Supabase and Discord apps and sets the secrets.
3. Run the migration and policy tests on staging.
4. Wire the first flow (trips) to the server repository.
5. Production follows the release checklist in MVP.md.

**Rollback.** Unset the sign-in settings: the deployment returns to the demo. Database rollback is forward-fix only (new migrations).

## 2026-11-01 — Phone navigation: a plan list on Overview, card stacks per page

**Context.** On phones, the Overview was the Wallet: a Tickets/Trips switch above one card stack showing up to three items. The owner asked for:

- each card type on its own page;
- one Overview page that lists every concert and trip, with a filter.

**Decision.**

- **Phone Overview ("Your plans"):** a dated list of every concert and trip, grouped by month, with an All / Concerts / Trips filter and the next payment due at the top.
- **Concerts and Trips on phones:** each shows the card stack for its kind (`WalletDeck`), with every item. The desktop list and grid are unchanged.
- **Links:** a row or a linked item opens the card on its page, at `/concerts?open=<id>` or `/trips?open=<id>`.
- **Shared rules:** ticket and payment selection are pure model functions (`ticketApplication`, `nextPaymentDue`) used by both screens.

**Alternatives.** Keeping the Tickets/Trips switch on the Overview: rejected by the owner.

**Impact.**

- The Wallet design is kept, but split across pages.
- Search and the status filter remain desktop-only for now.
- Rollback: revert the change; no data is affected.

## 2026-10-26 — Motion only for the Wallet springs; CSS for the rest

**Context.** The 2026-10-05 decision planned Motion (motion.dev) for animation. Three animations were missing or rough: the editor dialog vanished on close, the "saved" toast had no animation, and the Wallet used a hand-built spring curve that restarted from zero velocity when interrupted.

**Decision.**

- The Wallet cards use Motion springs (`motion` 14.3). The library is imported lazily through `features/wallet/ui/wallet-motion-library.ts`, which re-exports only `animate` and `motionValue`. The chunk is 22KB gzip and loads only with the Wallet; until it arrives, cards move without animating.
- The dialog close and the toast use CSS keyframes and `tw-animate-css`, which are already installed. No library is needed for an enter/exit fade.
- Reduced motion turns all of them off.

**Alternatives.** `motion/react` with `AnimatePresence` for the toast: rejected. It would put the React bundle on every page for one fade.

**Impact.** One new dependency. Rollback: revert the hook to the previous commit and remove the package.

## 2026-10-26 — The token scale, enforced by a check

**Context.** After the move to Tailwind, the components still used 26 arbitrary font sizes, 36 arbitrary spacing values, 12 radii, 7 font weights, 10 line heights and 15 letter-spacings. The owner asked for the consistency pass.

**Decision.** Every component value comes from this scale (tokens in `app/globals.css`, Tailwind defaults otherwise):

|                | Steps                                                                                                |
| -------------- | ---------------------------------------------------------------------------------------------------- |
| Type           | `caption` 12, `label` 13, `small` 14, `body` 16, `lead` 18, `title` 22, `heading` 28, `display` 36px |
| Weight         | normal, medium, semibold; bold only for the wordmark and the Wallet title                            |
| Letter-spacing | `tight` −0.02em, `tighter` −0.035em, `wide` 0.06em, normal                                           |
| Line height    | `tight`, `snug`, `normal`, `relaxed`                                                                 |
| Radius         | `xs` 4, `sm` 8, `md` 10, `lg` 14, `xl` 20px, `full`                                                  |
| Spacing        | 2, 4, 6, 8, 10, 12, 16, 20, 24, 32, 40, 48px                                                         |

- Off-scale values were rounded to the nearest step, rounding down on a tie.
- Weights 550–570 became semibold, not medium. The font stack is the system font: on Arial-only systems 550 rendered bold and 500 renders regular, so semibold keeps the look there and is close on Apple's variable fonts.
- Positional offsets (`top-[13px]`) and spacing above 48px (navigation clearances) are layout geometry and stay as they are.
- `scripts/check-scale.mjs` (`pnpm check:scale`, part of `pnpm check`) fails on any new off-scale value in components.

**Alternatives.** A finer scale with a 15px size and 18px spacing step was rejected: it would keep most of today's drift.

**Impact.** A deliberate visual change, reviewed as before/after screenshots. Text sizes and spacing move by at most a few pixels. Rollback is the one commit.

## 2026-10-05 — Styling: Tailwind everywhere, one token scale; Motion for animation later

**Context.** Styling used three systems at once:

- Tailwind inside the vendored shadcn/ui controls;
- about 3,400 lines of global CSS in `app/styles/` for every screen;
- the first CSS Modules, from stage C.

The global CSS has drifted. It uses 39 distinct font sizes, 29 gap values, 16 corner radii, 31 hard-coded colours outside the tokens and 8 `!important` overrides. The owner wants one framework that keeps the UI consistent.

**Decision.**

- Use Tailwind CSS (v4, already installed) for all component styling, alongside the shadcn/ui controls.
- One token scale lives in the `@theme` block in `app/globals.css`: colours, type sizes, spacing, radii, shadows and motion timing. Components use these tokens through Tailwind utilities.
- Screens are converted one at a time. Each conversion deletes the global rules it replaces and is checked with `scripts/visual-snapshots.mjs` to match the previous build.
- A later consistency pass rounds off-scale values to the scale. This is a deliberate, reviewed visual change.
- Custom CSS remains only where utilities are a poor fit:
  - tokens and base styles;
  - the shadcn control skins;
  - the glass material and its fallbacks;
  - keyframes;
  - pseudo-elements such as the file-picker button.
- Motion (motion.dev) is the planned animation library, added afterwards in its own change.

**Alternatives.**

- Tokens plus CSS Modules (the previous plan): rejected by the owner. Two styling systems would remain.
- A component library such as MUI or Mantine: rejected. It would fight the custom glass and Wallet design.

**Impact.**

- No behaviour change.
- The four CSS Modules from stage C are converted, and CSS Modules are no longer the target for features.
- CLAUDE.md, ARCHITECTURE.md and `.claude/rules/encore-frontend.md` are updated.
- Rollback is per screen: each conversion is its own commit.

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
