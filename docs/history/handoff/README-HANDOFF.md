# Encore → Claude Code handoff

Prepared 27 September 2026 (Australia/Sydney).

This kit contains project instructions, the existing MVP scope, a safe modernization sequence and review templates. It does not contain the application source or dependencies, and it does not implement CI, authentication or a backend.

## Install into the application checkout

1. Open the **mobile branch application source** in Claude Code, at the folder containing its `package.json`. A live URL alone is not the editable source.
2. Inspect existing `CLAUDE.md`, `AGENTS.md`, `.claude/rules`, documentation and uncommitted work before copying. Merge existing instructions; do not overwrite them blindly.
3. Copy this kit's `CLAUDE.md`, `.claude/rules/`, `docs/` and optional `.github/PULL_REQUEST_TEMPLATE.md` into that project root. Preserve existing files and their history.
4. Use `START-HERE.md` as the first prompt. It asks for the initial bounded foundation task, not the entire MVP at once.
5. Commit the merged instructions with the project through the normal review process. Avoid keeping a conflicting second copy of the product specification elsewhere.

Root `CLAUDE.md` holds the short standing rules. Detailed policies live in scoped rule files and engineering documents, so the startup instructions stay concise. Claude Code documents project `CLAUDE.md` and path-scoped rules; these guide behavior but are not enforced configuration. [Official memory documentation](https://code.claude.com/docs/en/memory).

The first stage requires translating important rules into real lint, import-boundary and CI checks. Code review remains necessary for cohesion, user behavior and architecture. No prompt guarantees maintainability or correct security.

## Contents

| File | Purpose |
|---|---|
| `CLAUDE.md` | Persistent instructions and non-negotiable boundaries |
| `.claude/rules/encore-typescript.md` | Rules for application TypeScript |
| `.claude/rules/encore-frontend.md` | React, CSS, accessibility and motion |
| `.claude/rules/encore-backend.md` | Authorization, transactions, storage and jobs |
| `docs/product/MVP.md` | Product scope and phased roadmap snapshot |
| `docs/engineering/CURRENT-STATE.md` | What exists and what is still proposed |
| `docs/engineering/ARCHITECTURE.md` | Dependency rules, ownership and a worked use case |
| `docs/engineering/WORKFLOW.md` | Repeatable implementation/review procedure |
| `docs/engineering/QUALITY-GATES.md` | Concrete checks Claude must establish |
| `docs/engineering/REFACTOR-PLAN.md` | Incremental TypeScript/CSS migration with exit criteria |
| `docs/engineering/PROGRESS.md` | Session handoff template and starting state |
| `.github/PULL_REQUEST_TEMPLATE.md` | Human-review checklist; useful with or without GitHub |
| `START-HERE.md` | Copyable first task for Claude Code |

References checked 26 September 2026 UTC: [Claude Code memory](https://code.claude.com/docs/en/memory), [Claude Code best practices](https://code.claude.com/docs/en/best-practices). Engineering policies in this kit are project-specific recommendations; they are not claims of certification or proof that the current prototype already complies.
