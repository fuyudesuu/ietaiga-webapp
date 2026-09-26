# Development procedure

## Before editing

1. Read the task, current Git status, applicable instructions and relevant existing modules/tests. Do not discard unrelated edits.
2. State the requested behavior, acceptance criteria and likely files. Identify whether this is a refactor or behavior change; keep them separate when practical.
3. Read package scripts/runtime configuration. Run the relevant baseline checks; capture existing failures and missing infrastructure accurately.
4. Identify the real risks: persistence, ownership, timezone conversion, retries, focus/navigation, image validation or CSS cascade. Pick verification that addresses them.
5. Make a short implementation plan. Proceed with routine reversible work. Ask only for missing product/infrastructure choices that prevent correct progress, and continue independent work meanwhile.

## During implementation

- Work on one coherent use case. Commit-sized steps should be understandable independently; avoid mixing dependency upgrades, formatting churn, redesign and backend introduction.
- For risky refactoring, add characterization tests first. Preserve existing behavior unless a documented bug fix is part of the task.
- Build one complete slice through UI, validation, service and persistence rather than many disconnected mock screens.
- Keep functions/modules cohesive. Search for existing logic before adding a new helper. Do not clone an entire screen to add one field.
- When rules conflict with a real need, describe the tradeoff and record a narrow exception; never silently edit standards to bypass a failing gate.
- Do not leave incomplete TODO implementations behind clickable controls. Disable unavailable features with honest copy or keep them out of the user flow.
- Handle loading/error/cancel paths alongside the happy path. A failed backend call must not appear as a successful browser-only update.

## Verification

Run affected unit/integration tests while developing, then the documented type/lint/test/build gates for the final source state. A previously green build does not validate later source edits. Do not repeat unchanged expensive checks without a concrete reason.

For UI changes, inspect the relevant phone/desktop sizes plus theme/motion states in one bounded pass; fix concrete defects together and confirm them. Use actual phone testing for the release gate. If visual access is unavailable, complete available checks and explicitly retain the unresolved verification gap.

For backend changes, include invalid/unauthorized/concurrent cases where relevant. Use isolated nonproduction data. Never test a real Discord message against an unrelated user's destination; outbound tests require an explicitly authorized test destination.

Review the final diff for accidental secrets, dead branches, duplications, weakened validation/policies, incorrect imports, unnecessary dependencies, changed lockfiles and unrelated modifications. Do not hide failures with broad ignores or assertions.

## Review and merge

Use the PR template even if the work is reviewed locally. A reviewer must be able to identify the business rule, persistence owner and failure behavior without tracing a giant component. Review is about correctness/cohesion, not just formatting.

Record dependency additions and why existing tools were insufficient. Run automated vulnerability/secret checks when available, but assess findings rather than treating every advisory as an automatic rewrite. Changed migrations require explicit data-loss and rollout review.

Merge through the project's authorized process after required checks. This kit does not authorize publishing, altering live sharing settings, sending messages or destructive production migrations. Respect existing user authorization; do not add repeated approval prompts for routine work.

## Session handoff

Update `PROGRESS.md` with the task, source revision if available, completed changes, commands/results, unresolved failures and exact next action. Do not store secrets, webhook URLs or private sample bookings. On continuation, inspect source/Git before trusting the handoff.

Suggested final report:

1. What works now and what changed.
2. Modules touched and their responsibilities.
3. Exact commands run and results; checks not run with reasons.
4. Remaining limitations/migration steps.
5. Next bounded task.
