## Problem and resulting behavior

What user/developer problem does this solve? What changes after this PR?

## Scope and module ownership

List the affected responsibilities. Explain new dependencies, architecture exceptions or a large file that remains cohesive. Identify intentional behavior changes separately from refactoring.

## Verification evidence

Commands and results, including new tests that actually ran. For UI changes, state the viewports/themes/input methods inspected. Mark unavailable checks explicitly.

## Review checks

- [ ] Acceptance criteria are met; incomplete/simulated behavior is clearly identified.
- [ ] UI, domain rules and persistence have clear owners; no client-to-server secret import or new dependency cycle.
- [ ] No extra responsibility was appended to the legacy aggregate forms/styles files.
- [ ] Errors, empty/loading states and persistence-before-success/navigation are handled.
- [ ] Relevant authorization, date/money, failure and concurrency behavior is tested.
- [ ] Styling has clear ownership; relevant mobile/theme/focus/motion behavior is preserved.
- [ ] No unrelated rewrites, secret values, blanket suppressions or unnecessary dependencies.
- [ ] Migration/rollout/recovery details are included where applicable.
- [ ] Progress and affected documentation match the implemented state.

Use N/A with a brief reason for checks unrelated to this change; do not check a box without evidence.

## Remaining limitations and next step

State material risks, deployment prerequisites and one follow-up task, if needed.
