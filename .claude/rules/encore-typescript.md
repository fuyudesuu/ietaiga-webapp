---
paths:
  - "features/**/*.ts"
  - "features/**/*.tsx"
  - "lib/encore/**/*.ts"
  - "lib/encore/**/*.tsx"
  - "components/encore/**/*.tsx"
  - "app/**/*.ts"
  - "app/**/*.tsx"
---

# Application TypeScript

- Read the enclosing module before editing; reuse existing rules rather than copying logic to a new screen.
- Keep strict TypeScript. Parse external inputs at boundaries with a schema; infer input types from that schema where useful. Database-generated types represent storage, not automatically domain/UI contracts.
- Treat IDs as identifiers, not authorization. For new persistence contracts, missing relationships/amounts use null explicitly. Model date-only values separately from timestamps and define conversion in one tested utility.
- Use named props types once a component has a nontrivial interface. Model mutually exclusive loading/result states as a union when independent booleans permit impossible states.
- Split components at meaningful interaction/rendering boundaries. A new file should have a responsibility that can be named without "and everything else".
- Services should read as a sequence of domain actions. A 200-line hook containing validation, persistence, gestures and delivery is not a successful extraction.
- Inject a clock/ID generator/provider at the boundary when determinism or an external side effect makes testing useful. Do not wrap every language primitive in an interface.
- Derive values instead of synchronizing duplicate state. Effects are for synchronization with external systems, not an alternative event-handler layer.
- Prefer specific error codes with useful user messages. Catch errors where they can be handled, translated or reported; do not return success-shaped empty values after failure.
- No repository-wide formatting/renaming in a feature task. Remove obsolete code only after callers migrate; search for remaining imports and duplicate logic.
- Review long files/functions for cohesion; do not satisfy size guidance by minifying, splitting arbitrary fragments or hiding complexity behind generic helpers.
