---
paths:
  - "features/**/server/**/*.ts"
  - "features/**/domain/**/*.ts"
  - "app/api/**/*.ts"
  - "supabase/**/*.ts"
  - "supabase/**/*.sql"
  - "lib/server/**/*.ts"
---

# Backend, persistence and reminders

- Authenticate and authorize every operation. Derive the actor from a verified session, not a request owner ID. Enforce ownership on all related records and storage objects.
- RLS tests must use the caller contexts the app uses. A service-role test bypassing policies does not prove normal-user isolation.
- Keep normal operations under user-scoped permissions. Isolate privileged cleanup/worker code; validate its inputs, owner relations and destination consent explicitly.
- Keep secrets out of client bundles, logs, errors, exports, fixtures and commits. Guard server modules using the runtime's supported mechanism. Never accept browser-selected arbitrary network destinations for a worker.
- Read-validate-write sequences that can race need transactions/constraints or optimistic concurrency. Do not implement a required transaction as two independent HTTP database calls.
- Use versioned migrations; do not edit an already-applied migration to change production history. Use additive rollout/backfill/constraint/removal steps where compatibility requires them.
- If a security-definer database function is necessary, restrict execute grants, set a safe search path and verify the actor/ownership inside it. Do not bypass policies for convenience.
- Model reminder claims with leases, unique job keys and bounded retries. Recheck cancellation/deadline revision before delivery. Handle 429, revoked destinations, transient failures and uncertain sends distinctly.
- Do not promise exactly-once external messaging. Track attempts/provider IDs and explain ambiguous outcomes. Keep messages minimal and mentions disabled.
- Validate file type, size and ownership on the server. Browser compression is not a security boundary. Avoid arbitrary URL fetching; private bucket objects require authorized access.
- Use bounded/paginated queries and indexes for actual lookup paths. Avoid per-row provider/database calls in list rendering.
- Add structured error categories and correlation IDs; redact personal content. Verify database and object-storage recovery separately before launch.
