# Incremental modernization plan

Do not execute this entire document in one uncontrolled rewrite. Each stage has an independent acceptance boundary. Preserve the live prototypes and do not mix behavior changes into extraction work without making them explicit.

## A. Establish a repeatable baseline

Inspect the real checkout/runtime and read all applicable instructions. Add clear scripts for checks already supported. Record existing lint/type/test/build behavior and unresolved infrastructure. Establish meaningful import boundaries for newly introduced feature modules, with negative fixtures demonstrating enforcement.

**Exit:** checks are repeatable; known failures are distinguished from new failures; boundary rules actually execute; no app behavior or deployment identity changed. If remote CI cannot be configured, provide working local checks and a clearly marked pending CI setup task. Do not pretend branch protection is enabled.

## B. Extract one editor, then the others

Start with the concert editor in `components/encore/forms.tsx`. Characterize initial values, optional dates, image selection, dirty/discard behavior, validation and save-before-navigation. Extract the UI and input mapping into `features/concerts/` while keeping the existing store behind an explicit temporary adapter.

Keep the shared dialog open/close/discard lifecycle in a small editor host. A simple typed dispatch on editor type is acceptable; do not replace it with a generic dynamic form engine.

**Exit:** concert create/edit behavior and persisted demo shape are preserved; cancel/error/image flows pass; no duplicate concert editor logic remains. Other editors continue to work. Document the adapter's removal task.

Repeat for trip, hotel, application and reminder editors in separate coherent changes. Do not add empty domain/server modules until their responsibilities exist. Do not convert all states/dates to the new production schema during a behavior-preserving extraction.

## C. Migrate the touched CSS by component

Start with the extracted form and image picker. Trace all effective styles from globals/features/responsive/wallet files. Introduce co-located CSS Modules; include the component's mobile and theme behavior. Keep shared tokens/global UI primitives where they belong.

**Exit:** migrated selectors have clear ownership and no remaining conflicting overrides; dialog sizing/scrolling, 320px layout, keyboard focus, light/dark and solid material remain usable. Delete only selectors whose consumers migrated. If rendering cannot be inspected, report this stage as visually unverified.

Continue as screens are changed rather than demanding a full CSS rewrite before building product functionality.

## D. Prove real identity and persistence

Resolve runtime/hosting and session strategy in a short ADR. Implement Discord login, user-owned tables/policies and private image storage. Replace the first feature's temporary persistence adapter with an owner-scoped repository/service.

Build the first complete flow: login → create trip/concert/application → upload cover → sign out/in on another browser → retrieve the same private records. New accounts start empty. Do not import demo seeds or local data without an explicit reviewed import flow.

**Exit:** persistence succeeds across devices; failed saves remain visible; two-account and anonymous policy tests pass; prototype-only state is not the production authority. Reuse the established pattern for stays and the remaining screens.

## E. Add reliable reminders

Implement persisted deadlines/jobs, revision invalidation, transactional updates, leased claims and the Discord channel adapter. Separate login consent from notification setup. Keep DM/bot installation deferred unless scope is changed.

**Exit:** an authorized test channel receives a real reminder; revoked destination/rate-limit/retry/cancellation/concurrency cases work; ambiguous sends are visible; no exactly-once claim. In-app attention remains useful during delivery failure.

## F. Release gates

Complete data export/deletion, isolated staging, monitoring and backup/restore procedures. Check actual mobile devices and desktop accessibility. Remove obsolete demo adapters from production paths only after all consumers migrate. Keep demo fixtures in deliberate demo/test entrypoints.

**Exit:** product release checklist passes, remaining limitations are explicit and the owner deliberately authorizes production cutover. A green build alone is insufficient.

## Stop refactoring when

The touched responsibility is clear, behavior is preserved and a new feature has a clean extension point. Do not continue reorganizing unrelated code for aesthetic consistency. New work should pay down the debt it encounters without blocking every feature behind a complete rewrite.
