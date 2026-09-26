# Quality gates to establish

Status: specified, not installed by this kit. Claude's first foundation task must wire these into the real repository and prove the important gates detect violations. Do not report them as active merely because this document exists.

## Gate matrix

| Gate | Required check | Evidence |
|---|---|---|
| Types | Strict TypeScript; no newly introduced errors | Exact typecheck command exits successfully |
| Static analysis | Lint application code; preserve narrow vendor exceptions | No new relevant lint failures or broad suppressions |
| Formatting | Check touched application files initially; establish whole-project baseline separately | Formatter check passes without unrelated churn |
| Dependencies | Enforce client/server, domain/infrastructure and cross-feature import direction | Negative fixtures prove forbidden direct and transitive dependency paths fail |
| Tests | Domain and affected interaction/integration tests discovered by the runner | Output includes the newly added tests; failures cannot be skipped silently |
| Build | Production build for the chosen runtime | Build passes from checked-in source and reproducible dependencies |
| Database | Actual RLS/constraint/migration tests once DB exists | Two users + anonymous caller; select/insert/update/delete/relationship/object-access cases |
| Browser | Critical create/edit/navigation/save flows once browser test setup exists | Actual rendered app; desktop/mobile focus and responsive behavior |
| Delivery | Worker state/retry/concurrency tests once real jobs exist | Lease expiry, cancellation revision, invalid destination and uncertain send covered |

Suggested script names: `typecheck`, `lint`, `format:check`, `test`, `test:integration`, `test:e2e`, `check:boundaries`, `build`, `check`. These are target names, not claims they all exist. Make `check` run the applicable baseline gates; do not add empty scripts that always succeed.

## Dependency enforcement specifics

Use the existing ESLint setup for simple restrictions, plus a resolver-aware boundary checker if graph checks are needed. Choose the smallest maintained tool compatible with the actual installed versions; document a new dependency. Do not claim an import regex proves architectural isolation.

Required restrictions:
- Domain files cannot reach framework, UI, database, provider SDK or secret-config modules.
- Client entrypoints cannot transitively reach server implementations; follow re-exports and aliases. Type-only imports of client-safe contracts are allowed.
- Features cannot deep-import another feature's internals; shared code cannot depend on features.
- No cross-feature dependency cycles. Account for aliases, relative imports and re-exports; disallow computed dynamic imports at protected boundaries unless narrowly reviewed.

Prove the gate with at least: a direct forbidden import, the same violation through an alias, a re-export/transitive client-to-server violation, and an allowed type-only contract import. Use dedicated fixture files, not broken application source left behind. Include fixtures in test coverage while excluding them from the application's production build.

## Existing debt

Record actual failures in the foundation report before choosing a migration strategy. Existing large files are not automatically release failures. Prevent new architecture violations and do not grow the legacy aggregate files with unrelated features.

If a baseline is needed, keep an explicit narrow list with a reason and removal task. Do not blanket-exclude all legacy code, disable strict mode, weaken RLS or suppress every warning. New modules must meet current rules immediately. An exception change belongs in the review diff.

Line counts and complexity are review signals, not maintainability proofs. Never shorten code by minifying or arbitrarily splitting dependent fragments just to pass a threshold. Generated/vendor code should have separate policies; application security checks still apply at its integration boundary.

## CI rollout

1. Detect the actual Git hosting/CI provider. Configure there; do not invent a working GitHub pipeline when the repository is hosted elsewhere.
2. Use the declared Node/package-manager versions and frozen lockfile. Run baseline checks without production credentials.
3. Add an isolated database integration job once a disposable database is available. Separate tests requiring network credentials from deterministic unit checks.
4. Add browser tests when an approved local/test runtime can run. A unavailable browser is a reported missing gate, not a silent skip presented as success.
5. Configure required branch checks through the authorized repository administration process. A workflow file alone does not enable branch protection.
6. Test a deliberately failing fixture so CI demonstrably fails, then remove/fix the injected failure before merge.

## Minimum meaningful tests by change

| Change | Required examples |
|---|---|
| Form extraction | Correct initial values, validation, failed-save value retention, cancel/discard, successful persisted result |
| Cost/status rule | Pending vs won, two genuine purchases, refund behavior, null amount, separated currencies |
| Deadline rule | JST/local conversion, date-only preservation, DST ambiguity/gap, changed revision cancellation |
| Ownership | Another user's ID in both direct requests and related-record links; anonymous denial |
| Image flow | Invalid file/type/size, failed replacement, private object access, removed/missing image fallback |
| Wallet interaction | Open/close, rapid tab changes, keyboard focus restoration, reduced motion and pointer cancellation |

Test observable outcomes and invariants. Do not mirror implementation internals, rely exclusively on snapshots or invent a percentage coverage target as a substitute for risk coverage.
