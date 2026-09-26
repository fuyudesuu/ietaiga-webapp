# Encore — MVP and implementation roadmap

Version 0.1 · 27 September 2026 (Australia/Sydney) · Proposed implementation baseline

## 1. Product outcome

A personal concert and travel planner for someone who frequently travels to Japan for performances. The first release should answer: **What needs my attention, what have I secured, and what belongs to my next trip?**

The user manages their own records. One trip can contain several concerts and hotel stays. A concert can exist before a trip is planned. Primary providers include ASOBI TICKET, eplus, l-tike and CyStore ticket; franchise examples include THE IDOLM@STER, Uma Musume, Love Live! and =LOVE. These are labels and external links initially, not integrations.

The existing prototypes establish the visual and interaction direction, but currently use fictional browser-local data. Discord login, cloud persistence and real reminder delivery are not implemented. Existing prototype data must not become a new account’s production records automatically.

Reference: [Mobile Wallet prototype](https://encore-mobile-wallet.khoanhkhacanhem123.chatgpt.site). The separate desktop prototype remains unchanged.

## 2. Scope decisions

| Decision | Proposed first release |
|---|---|
| Users | Private personal accounts; no collaboration or public profiles |
| Platform | Responsive web app; prioritize mobile Wallet and retain usable desktop planning |
| Login | Discord through managed authentication; login is separate from notification consent |
| Data entry | Manual entry and source links; unknown dates and amounts allowed |
| Reminders | In-app attention list plus optional Discord channel delivery |
| Discord destination choice | MVP: in-app only or connected channel. Next release: bot DM and guided server/channel choice |
| Money | JPY-first UI; retain original currency per amount. No automatic currency conversion |
| Images | User-selected cover per concert/trip; private cloud storage |
| Design | Existing mobile Wallet direction; substantive redesign is outside the MVP build |

The channel-first delivery boundary is a recommendation, not an already confirmed user preference. It keeps actual Discord delivery in the MVP while deferring bot installation and DM delivery handling. Users without a suitable channel can still use every planning feature.

## 3. MVP feature backlog and acceptance criteria

| ID | Feature | Required behavior / acceptance |
|---|---|---|
| MVP-01 | Identity and private account | Sign in/out with Discord; records follow the same account across devices; user A cannot read, edit, link or download user B’s records/images |
| MVP-02 | Concert records | Create, edit, archive and delete; title, performance name, venue, city, date/time, timezone, notes and source URL; date/time can be unknown |
| MVP-03 | Application rounds | Several rounds per concert, with provider, round name, application window, result announcement, payment and ticket-collection deadlines |
| MVP-04 | Status tracking | Track application, lottery outcome, payment and collection independently; users confirm real-world results manually |
| MVP-05 | Trips | Create/edit trips with dates, destinations, notes, status and cover; attach/detach several concerts; each concert belongs to zero or one trip initially |
| MVP-06 | Hotels | Several stays per trip, with check-in/out, hotel timezone, booking link/reference, cancellation deadline, original price and payment status |
| MVP-07 | Summary and attention | Upcoming trip/concerts; applications closing, results ready to check, payments due and hotel cancellation deadlines; every row leads to the relevant record |
| MVP-08 | Mobile photo Wallet | Tickets/Trips tabs; cards show their item’s image; expand/collapse and linked details work with touch and keyboard; reduced-motion alternative |
| MVP-09 | Images | Upload, replace or remove a cover; valid raster formats only; private storage and authorized access; readable fallback without an image |
| MVP-10 | Reminders | Enable per deadline; presets 7 days, 1 day or 2 hours beforehand, plus at-deadline; display exact scheduled time before saving; cancel obsolete reminders |
| MVP-11 | Discord channel delivery | Opt-in connection, user-triggered test, clear destination, disconnect, delivery status and actionable failures; no setup/test message without an explicit user action |
| MVP-12 | Search and filters | Search concert/trip names; filter upcoming, archived and attention-needed items; empty and no-result states have a useful next action |
| MVP-13 | Data controls | Export structured JSON; delete account and owned data through a confirmed flow; operational backup and restore procedure exists |

MVP-01 through MVP-13 form the launch scope; implementation is sequenced below. Additional ideas do not silently enter this scope.

### Small additions worth including

- Preserve Japanese and English names without forcing both.
- Store provider/booking URLs so users can return to the actual transaction.
- Warn about a concert outside its attached trip’s dates or overlapping hotel stays; allow intentional exceptions.
- Confirm destructive deletion and explain its effect on linked concerts, stays and reminders.
- Keep result-announcement reminders distinct from a confirmed lottery result.

### Explicit exclusions

Ticket purchasing, actual payments, admission QR codes, ticket transfer/resale, fanclub credentials, automatic result checks, website scraping, flights/transit, shared trips, native apps and full offline editing are outside the MVP. Recording a payment only updates the planner.

## 4. Important product rules

### Dates and timezones

Store deadline instants in UTC together with the source IANA timezone. Default Japanese events to Asia/Tokyo; let users change the event timezone. Display deadline source time and the user’s selected local time when different. Do not derive event timezone from the current device location.

Keep date-only concert dates and hotel check-in/out as date values, not midnight UTC. An unknown time remains unknown and cannot schedule an exact-time reminder. Validate daylight-saving gaps/ambiguities for non-Japanese events before converting to UTC. Use the real clock in production; the prototype’s fixed demo clock is test data only.

### Statuses

| Independent field | Initial values |
|---|---|
| Application | Planned, submitted, withdrawn |
| Result | Unknown, pending, won, lost, waitlisted |
| Payment | Not required, unpaid, paid, refunded |
| Collection | Not ready, ready, collected |
| Concert | Planned, cancelled, completed; separate archive flag |
| Trip | Tentative, confirmed, completed, cancelled; separate archive flag |
| Hotel | Booked, cancelled; separate payment status |

No automatic “won” state when an announcement time passes. A passed deadline does not prove an application failed. Cancelling an event does not mean its payment was refunded. Editing a status must update the attention list and relevant reminders together.

### Amounts and trip totals

Use integer minor units with a currency code: whole yen for JPY, cents for USD/AUD/SGD. A missing amount is null, never silently zero. Existing currency choices can remain because they are already in the prototype; conversion, exchange-rate feeds and combined converted totals are future work.

Show separate totals per currency. Pending/lost rounds are excluded from committed costs. Count each distinct winning purchase and each active hotel booking once; two genuine wins may create two obligations. Do not deduplicate purchases merely because their concert matches. Show planned commitments and paid amounts separately. Keep refunds visible in history; full refunds reduce net paid amounts. Partial payments/refunds require a later transaction model.

## 5. Main user journeys

1. **First use:** Discord login → choose local timezone → empty dashboard → create trip or concert. Notification setup is optional and separate.
2. **Plan a performance:** add concert → add application round → enter deadlines → select reminders → attach to trip when ready.
3. **Win a ticket:** manually record result → enter/confirm payment deadline and cost → record payment → update collection state. Superseded reminders disappear.
4. **Prepare a trip:** attach concerts → add hotels and cancellation cutoffs → view itinerary and costs → update cover image.
5. **Act on a reminder:** receive minimal message → open authenticated item page → complete action → related attention state updates. A sent message is not proof it was read.
6. **Leave safely:** export data → confirm account deletion → block access immediately → remove records/assets and revoke notification destinations through a retryable cleanup process.

## 6. Recommended implementation stack

This is a proposed production target, not a claim that external accounts or infrastructure already exist.

| Layer | Recommendation | Reason |
|---|---|---|
| App | React + TypeScript, standard Next.js App Router | Reuse UI/domain work; one application for frontend and backend routes |
| Styling | Existing CSS tokens and Radix/shadcn controls | Preserve the design and accessible control behavior without another UI framework |
| Database | Supabase-managed PostgreSQL | Relational concert/trip data, SQL constraints and row-level security |
| Identity | Supabase Auth with Discord provider | Managed authentication rather than custom password/session infrastructure [1] |
| Images | Supabase Storage, private buckets | Owner-based access and expiring authorized delivery [2] |
| Validation | Shared TypeScript schemas, using the existing Zod dependency | Validate inputs at the server boundary; reuse shapes in forms |
| Data access | Supabase client behind feature repositories; SQL migrations and generated database types | Keep business logic independent of vendor APIs; avoid adding an ORM initially |
| Scheduling | Supabase Cron invokes a small authenticated reminder worker | Persist jobs in PostgreSQL; scheduling survives a closed browser [3] |
| Hosting | A supported Next.js Node deployment; finalize in milestone 0 | Hosting compatibility and operating budget must be checked before provisioning |
| Testing | Domain tests, database authorization tests, focused browser tests | Verify the risks that matter rather than chasing arbitrary coverage |

The current Site uses a Vinext/Cloudflare-compatible prototype runtime. Do not assume its deployment, authentication or database integration is production-ready. Milestone 0 must decide whether to retain a supported existing runtime or move the app to the standard Next.js target. Preserve the existing live prototypes during that decision. No new hosting purchase or migration occurs as part of this document.

Use one repository and a modular monolith: one app with clear feature boundaries, plus a small delivery worker using shared rules. No microservices, general event bus or separate mobile codebase is needed.

## 7. Initial data model

All user-owned records use an internal UUID owner ID tied to the authenticated account. Discord’s provider ID is an identity mapping, never a client-supplied authorization decision.

| Entity | Core fields and relationships |
|---|---|
| Profile | Auth user ID, display preferences, local timezone, default currency |
| Trip | Owner, title, destinations, start/end date, status, cover asset, archive timestamp |
| Concert | Owner, optional trip, title/subtitle, venue/city, local date/time, timezone, status, source URL, cover asset |
| Application | Owner, concert, provider, round name, application/result/payment/collection states, amount and currency |
| Hotel booking | Owner, trip, hotel/location, date range, timezone, booking reference/URL, amount, payment and cancellation state |
| Deadline | Owner, exactly one application/hotel/concert parent, kind, UTC instant, source timezone, revision, active state |
| Reminder rule | Owner, deadline, offset, destination, enabled state |
| Notification destination | Owner, channel metadata, connection state; secret reference accessible only to trusted server code |
| Delivery job | Rule/deadline revision, destination, due time, job state, attempts, lease expiry, next retry, provider message ID/error category |
| Asset | Owner, private object key, validated MIME type, dimensions/size, lifecycle state |

Required constraints: hotel check-out after check-in; trip end on/after start; currency/amount validity; exactly one deadline parent; uniqueness of scheduled delivery per reminder rule + deadline revision + destination. Cross-record links must have the same owner, enforced in database constraints/policies as well as service validation. Index owner/date lookups and pending job due times.

Trip deletion must explicitly offer to detach concerts or delete them; explain hotel/reminder effects. Archive preserves history. Account deletion removes all owned records/assets. Avoid soft-deleting every entity without a demonstrated recovery requirement.

## 8. Security and delivery design

### Identity and access

Use managed OAuth with validated state, correct callback allowlists, and verified server-side sessions. Confirm the managed provider’s required scopes; request no additional guild/message access for login. Do not assume Discord login grants permission to message the user. Keep provider credentials and service-role keys on the server.

Authorize every read and mutation. Do not rely on hidden buttons, unguessable URLs or route middleware alone. Enable RLS for exposed user tables and matching policies for private image objects [2,4]. Normal user operations run in the user’s authorization context; any privileged worker must independently enforce owner and destination relationships. Log correlation IDs and error categories, not tokens, webhook URLs, hotel references or full reminder payloads.

For browser authentication, follow the chosen provider’s supported session/refresh flow; do not mix a custom session system with the SDK by accident. Define secure cookie behavior and CSRF protections at implementation time. Authenticated responses must not enter a shared public cache.

### Image handling

Revalidate uploads on the server, regardless of browser compression. Start with JPG/PNG/WebP, a 12 MB source limit and a bounded resized output. Verify actual file content, decode safely, strip metadata, generate suitable thumbnails and use randomized object keys. Require owner authorization for replacing/deleting covers. Handle failed uploads and clean up abandoned objects. No arbitrary remote-image URL fetching in the MVP.

### Discord connection

Use Discord’s separate incoming-webhook authorization flow to let an eligible user connect a channel, with a clear disconnect action [5]. Prefer this over asking users to paste a secret webhook URL. Store its secret encrypted or in a managed secret store; never return it to browser code or exports. If the managed login provider cannot perform this separate flow, implement it as an isolated server adapter with its own validated OAuth state.

Show the selected channel/server and message preview before enabling delivery. Default shared-channel messages to a generic deadline label and authenticated link; let the user explicitly opt into event titles. Never include hotel booking references. Disable mentions in outgoing messages. Connection tests send only when the user presses **Send test reminder**.

### Reliable reminders

- Create/update deadline and job revisions transactionally. Editing a deadline invalidates old pending jobs; marking the related task complete cancels obsolete reminders.
- Poll due jobs about once a minute. Workers atomically claim a bounded batch with leases, recheck current status/consent before sending, and record the outcome.
- Respect Discord rate-limit responses and retry-after values. Retry transient failures with bounded backoff; disable invalid destinations and surface reconnection instructions [6].
- Use uniqueness constraints to prevent duplicate scheduled jobs. External delivery is not guaranteed exactly once: a network timeout after Discord accepts a message creates an uncertain outcome. Record uncertainty and avoid an immediate blind resend.
- Show scheduled, delivered-to-provider, failed, cancelled and uncertain states. Never label a message “read” without evidence.
- In-app attention remains available even when Discord fails. Do not switch to a different destination automatically.
- Proposed target: under normal operation, dispatch within two minutes of the requested time; this is an engineering target to test, not a guaranteed deadline alert.
- Catch-up policy: if the reminder time passed but its deadline remains ahead, send once promptly; if the deadline already passed, keep an overdue in-app item and suppress stale external reminders. Result-announcement notices may catch up for up to 24 hours while the result is still pending.

## 9. Code organization and development rules

| Location | Responsibility |
|---|---|
| `app/` | Routes, layouts, thin request handlers and page composition |
| `features/identity/` | Session-facing operations, account preferences and deletion |
| `features/concerts/` | Concert/application UI, schemas, services and repository |
| `features/trips/` | Trip management, itinerary and links |
| `features/stays/` | Hotel bookings and cancellation rules |
| `features/reminders/` | Deadline rules, scheduling, delivery states and adapters |
| `features/assets/` | Upload validation, asset lifecycle and authorized image access |
| `components/ui/` | Reusable visual primitives with no domain/database logic |
| `lib/` | Deliberately small shared utilities: dates, money, errors, telemetry |
| `supabase/migrations/` | Versioned SQL schema, constraints and policies |
| `supabase/functions/` | Thin worker entrypoint; shared tested delivery rules remain reusable |
| `tests/` and feature tests | Domain, authorization, integration and critical user flows |
| `docs/decisions/` | Short architecture decision records and operational runbooks |

Keep UI components focused on rendering and interaction. Services own use cases; pure domain functions own status/date/money rules; repositories own persistence queries. Server credentials and provider clients must never be imported into client components. Introduce abstractions when they isolate a real boundary, not to create layers for their own sake.

Use descriptive names, strict TypeScript, explicit error types and consistent formatting. Comments explain domain decisions rather than repeat code. Avoid catch-all utility files, giant page components, duplicated validation and effects that hide business rules. Extract a module when it has an independent responsibility, not at an arbitrary line count.

Every functional change needs clear acceptance criteria and a reviewable diff. CI runs type checks, lint, relevant tests and a production build. Meaningful tests cover timezones, cost/status rules, cross-user access, reminder retries and critical UI flows; cosmetic changes do not require artificial tests. Database changes ship as reviewed migrations, with a forward-fix or recovery plan for destructive changes. Pin dependencies and update deliberately.

Separate development, staging and production credentials/data. Keep secrets out of Git. Maintain setup instructions, environment-variable names without secret values, a schema overview and backup/restore instructions. Record decisions affecting authentication, hosting and notification delivery. Do not silently change product requirements during implementation.

## 10. Implementation milestones

| Milestone | Deliverable | Exit condition |
|---|---|---|
| 0 — Foundation | Confirm runtime/hosting; repository structure, CI, staging configuration, schema/RLS migrations | App builds reproducibly; two test accounts prove row/object isolation |
| 1 — First complete flow | Discord login → trip → concert → application → cover upload → persistent account data | Sign out/in on another browser and recover the same private records; denied login/session expiry handled |
| 2 — Daily planning | Hotels, full status/deadline editing, summary, search, totals and Wallet connected to real data | One trip with three concerts and two stays can be managed without prototype state or fake controls |
| 3 — Real reminders | In-app attention, channel connection, persisted jobs, worker, delivery history | Real opt-in test delivery; edit/cancel/retry/revoked-destination scenarios pass |
| 4 — Private beta | Export/deletion, monitoring, backup/restore exercise, accessibility and actual-device checks | Release checklist below passes; invite a small test group |

Start with milestone 0 and then milestone 1. Do not build every screen against mock data before proving authentication and persistence. External service setup needs a project owner, redirect domains and deployment credentials; collect these when implementing the foundation, without ever requesting secrets in chat.

## 11. Release acceptance checklist

- New production users see an empty account, not fictional plans. Demo mode is clearly separate.
- Account A cannot access or link account B’s trips, applications, hotels, reminders or images, including guessed IDs and direct requests.
- Login cancellation, expired sessions and failed saves retain useful feedback; the app never falsely confirms persistence.
- Japanese and Australian timezone/DST cases preserve the correct deadline instant.
- Editing or completing an action invalidates stale reminder jobs; concurrent workers do not send the same normal job twice.
- Discord failure, revoked connections, rate limiting and ambiguous send outcomes appear in delivery history.
- Images survive a second-device login, have safe fallbacks and remain private.
- Mobile Safari and Android Chrome are checked on actual devices; desktop keyboard navigation, focus return, reduced motion, contrast and 320px layouts are checked.
- Export, deletion cleanup, monitoring alerts and a documented restore exercise work. Backup coverage includes image objects as well as database rows; retention depends on the selected service plan and must be explicitly configured.
- Existing prototype deployments remain available as design references until a deliberate production cutover.

## 12. Future features, in recommended order

| Phase | Feature | Why / dependency |
|---|---|---|
| 1.1 | Bot DM reminders and server/channel selector | Complete destination choice; requires opt-in onboarding, installation/permission checks, blocked-DM handling and separate bot credentials |
| 1.1 | Custom reminder offsets, snooze and quiet hours | Add after reliable basic delivery; never silently defer a reminder beyond its deadline |
| 1.1 | Calendar export/subscription | Make plans usable in an existing calendar; subscription URLs need revocable private tokens |
| 1.1 | Trip checklist and duplicate-from-template | Low-effort recurring travel preparation |
| 1.1 | Validated prototype/import file migration | Preview records and conflicts before writing; never import fictional seeds automatically |
| 1.2 | Better desktop workspace | Date-led agenda, item thumbnails and persistent details pane; align hotel stays with the itinerary |
| 1.2 | Flights, trains and transfers | Extend itinerary after concert/hotel planning is stable |
| 1.2 | Installable PWA and optional offline read access | Cache intentionally, handle stale information and clear private caches on sign-out; offline editing comes later |
| 1.2 | Currency conversion and richer expenses | Preserve original amounts and quote timestamps; add partial payments/refunds before advanced budgeting |
| 2 | Public event-page import | Provider-specific adapters, extracted-field preview, source provenance and user confirmation |
| 2 | Franchise/provider discovery | Start with a single demonstrably useful source; IDOLM@STER, Uma Musume, Love Live! and =LOVE are research candidates, not promised integrations |
| 2 | Fanclub-assisted import | Prefer user-provided text/files or supported authorization; assess each site’s terms and access model before implementation; do not store fanclub passwords or bypass access controls |
| Later, demand-led | Shared trips and companions | New membership/permission model, separate private booking fields and shared-message consent |
| Later, demand-led | Native app, offline edits and advanced automation | Only after real usage establishes a need; requires sync/conflict and support work |

Automatic website parsing stays low priority. Imported deadlines must retain their source and be confirmed before reminders activate. An imported result-announcement date is never evidence that a user won a lottery.

## 13. Decisions to revisit at implementation start

These do not block reviewing the feature scope. Recommended defaults are recorded above.

1. Is channel-first Discord delivery acceptable for the first release, or must DM delivery move into the MVP?
2. Which account will own production hosting, Supabase and the Discord application, and what monthly operating budget should guide the choice?
3. Should the private beta be limited to invited users? Recommended: yes, while reminder delivery and account isolation are tested.

## 14. Technical references

Checked 26 September 2026 UTC. Feature priorities and architecture choices above are recommendations; provider capabilities below are documented sources. Recheck release-specific setup details when implementing.

1. [Supabase: Sign in with Discord](https://supabase.com/docs/guides/auth/social-login/auth-discord)
2. [Supabase: Storage access control](https://supabase.com/docs/guides/storage/security/access-control)
3. [Supabase: Cron](https://supabase.com/docs/guides/cron)
4. [Supabase: Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
5. [Discord: OAuth2, including the incoming-webhook flow](https://docs.discord.com/developers/topics/oauth2)
6. [Discord: Rate limits](https://github.com/discord/discord-api-docs/blob/main/developers/topics/rate-limits.mdx)
7. [Next.js: Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers)
8. [Next.js: Authentication and authorization](https://nextjs.org/docs/app/guides/authentication)
9. [Discord: Webhook resource](https://docs.discord.com/developers/resources/webhook)
