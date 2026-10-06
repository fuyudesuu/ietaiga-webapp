# Architecture and ownership

## Shape

Use a modular monolith: one app repository and a small reminder worker, with shared pure rules where appropriate. The goal is that a human can locate, understand and change a feature without reading the whole app. Do not introduce microservices, a general event bus or a separate mobile app.

| Area | Owns | Must not own |
|---|---|---|
| `app/` | Routing, layout composition, HTTP adaptation | Large forms, cost logic, SQL or delivery retries |
| `features/<name>/ui/` | Views, form interaction, UI state | Credentials, database clients, policy decisions |
| `features/<name>/domain/` | Pure rules, domain types, invariants | Framework/browser/DB/provider dependencies |
| `features/<name>/contracts/` | Validated input/output contracts safe to share | Privileged clients or secret configuration |
| `features/<name>/server/` | Use cases, owner-scoped repositories, adapters | React rendering or globally mutable request state |
| `components/ui/` | Reusable visual controls | Concert/trip-specific business rules |
| `lib/` | Small cross-feature primitives | A dumping ground for displaced feature code |
| `supabase/` | Migrations, policies and worker entrypoints | Untested alternative copies of business rules |

Create only the directories a feature needs. A small pure utility does not require a service, repository, adapter and factory. Co-locate unit/component tests where useful; reserve shared test directories for integration/browser/policy fixtures.

## Allowed dependency direction

- Routes compose feature entrypoints.
- UI uses domain/contracts and a client-safe API boundary.
- Server use cases use domain/contracts and repositories/adapters.
- Infrastructure implementations may depend on domain contracts; domain never depends on infrastructure.
- Shared primitives never import a feature.
- Another feature may use a deliberately exposed contract or operation, not another feature's private UI/store/repository.
- Use explicit client-safe and server-only entrypoints. Do not create one `index.ts` that re-exports both and rely on tree-shaking to protect secrets.

Define the exact import rules in code during foundation work. Where orchestrating trips and concerts would cause a circular dependency, use an application-level orchestration service or a minimal shared identifier contract. Do not let both features import each other's internals.

## Feature ownership

| Feature | Authority |
|---|---|
| Identity | Authenticated actor, profile preferences, account deletion |
| Concerts | Concerts, application rounds, ticket status transitions |
| Trips | Trip dates/destinations and concert attachment use cases |
| Stays | Hotel bookings, cancellation state and cost |
| Reminders | Scheduling, delivery jobs, destination consent and provider adapters |
| Assets | Validated uploads, private object references, replacement/deletion lifecycle |

Database foreign keys and ownership checks must agree with these relationships. A UI's filtered dropdown does not prevent a forged cross-user relationship.

## Worked example: record payment

1. `PaymentAction` gathers the application ID and displays pending/error/success UI.
2. A thin server action or route verifies the session and parses the input. Select one transport pattern for this use case; avoid duplicating endpoints and logic.
3. `recordPayment` loads the application through an owner-scoped repository, checks the intended transition and handles a repeated request predictably.
4. One database transaction updates payment status and cancels pending payment reminders for the relevant revision. Use a transaction-capable server connection or a narrowly secured database function; two separate Data API requests are not a transaction.
5. The service returns a small typed result. The UI refreshes the affected authoritative data and then announces success.

Keep the transition rule independently testable. Verify the transaction/ownership behavior against a real test database. A mocked repository can test service decisions, but cannot prove SQL constraints or policies.

## Data and state rules

- Keep database rows, domain objects and display models distinct when their semantics differ; map at a small named boundary. Do not duplicate types for their own sake.
- Schema validation handles untrusted shape; services/domain functions validate business meaning; constraints and policies enforce persisted integrity. Client validation improves feedback but cannot authorize.
- Server data is authoritative. Local state owns transient selection, form drafts, dialogs and gestures. Do not mirror the entire database into a global React context.
- Prefer derived totals/status labels to independently mutable copies. Adopt a client cache only when needed, then define invalidation and sign-out clearing explicitly.
- Use explicit nulls for unknowns in new persistent contracts. Preserve existing demo serialization until a tested adapter/migration translates it. Do not silently reinterpret old empty strings as valid timestamps or zero amounts.
- Avoid a global current-user variable. Each request/job carries its verified context explicitly.

## TypeScript readability

Prefer names such as `application`, `trip`, `paymentDeadline` and `canRecordPayment`. A function should express one operation; extract pure decisions from long handlers before extracting arbitrary blocks into helpers. Keep nesting shallow through clear validation/early returns.

Use union types for states with genuinely different data. Avoid `Partial<Everything>` inputs for privileged mutations: each operation has an explicit allowed input. Use typed public results rather than leaking raw provider errors or database rows.

Interfaces/ports are useful for real external boundaries such as a Discord sender and clock. Avoid abstract base classes, generic service factories and speculative plugin systems. Two similar short functions can be clearer than an abstraction with many flags.

## CSS ownership

Components are styled with Tailwind utilities that use the token scale in the `@theme` block of `app/globals.css`: colours, type, spacing, radii, shadows and motion. Keep responsive (`max-md:`), state and dark/solid variants on the element they affect. Repeated combinations become shared components in `components/encore-ui/`, not new global classes.

Global CSS retains only:
- tokens and base/reset rules;
- the shadcn control skins;
- the glass material and its fallbacks;
- keyframes;
- styles that utilities express poorly, such as pseudo-elements and third-party markup.

When migrating a component: inspect all current matching rules, including responsive and theme overrides; move the resulting behavior into utilities; delete only migrated global selectors after checking other consumers; and compare `scripts/visual-snapshots.mjs` captures before and after. Do not leave both styling systems controlling the same property indefinitely. Do not globally replace every matching class string without identifying owners.

Preserve narrow-screen overflow behavior, dark/solid modes, focus rings, photo scrims and touch targets. Snapshotting HTML alone does not validate the visual cascade.

## Decisions requiring a short ADR

Record context, decision, alternatives/tradeoffs, security/operations impact and rollout plan when changing hosting/runtime, auth/session strategy, persistence access method, cache strategy or job delivery guarantees. A small component extraction needs no ADR.

Follow `docs/product/MVP.md` for feature scope. This document elaborates engineering standards; it does not move deferred features into the MVP.
