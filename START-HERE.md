# First prompt for Claude Code

Paste the following into Claude Code after merging this kit into the application root:

---

Read CLAUDE.md, applicable .claude/rules, docs/engineering/CURRENT-STATE.md, ARCHITECTURE.md, QUALITY-GATES.md and REFACTOR-PLAN.md. Read the relevant product scope in docs/product/MVP.md.

Implement **stage A: the engineering baseline and quality gates**, as one bounded task. First inspect the actual repository and uncommitted changes, then state a short plan and proceed with reversible work. Do not stop at a proposed plan.

Preserve the existing app appearance, runtime, routes, stored demo data and deployment identity. Do not implement the whole MVP, redesign screens, buy infrastructure or deploy as part of this task.

Deliver:
1. A factual baseline report identifying current scripts, runtime, tests and existing failures.
2. Working type/lint/test/build commands and focused formatting checks, reusing existing tools and lockfile.
3. Real import-boundary checks for new feature modules, with fixtures proving forbidden direct/alias/transitive imports fail and safe type-only imports pass. Keep legacy exceptions narrow and documented.
4. CI configuration for the actual repository provider if supported and available; otherwise document the missing setup while completing runnable local checks. Do not claim branch protection is enabled without verifying it.
5. An updated docs/engineering/PROGRESS.md with exact commands/results and the next bounded task.

Do not silence errors, weaken tests, disable strictness, invent passing results or create empty check scripts. If infrastructure is missing, finish the independent local work and clearly identify the blocker. Review your final diff for scope and maintainability before reporting completion.

Finish with what changed, verification evidence, remaining limitations, and readiness for stage B: extracting the concert editor with behavior-preserving tests. Stop after completing stage A; leave the next stage as a separately reviewable task.

---

## Subsequent feature-task template

Use after the foundation is established:

"Implement [one feature/use case] under the project's engineering rules. Acceptance criteria: [observable outcomes]. Read the affected feature and existing tests first. Explain the modules you will touch, then implement the smallest complete flow. Preserve behavior outside scope. Include the relevant unauthorized/error/edge cases and styling states. Run the applicable gates, inspect the diff and update PROGRESS.md. Report actual results and anything not verified."

Avoid prompts such as "build the rest of the whole app". Give Claude one complete feature with a clear finish condition, then review the resulting diff and evidence before proceeding to the next feature.
