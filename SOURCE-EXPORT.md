# Encore mobile prototype — source export

Exported 27 September 2026. Open this folder (the one containing package.json) in Claude Code.

## What is included

The complete tracked source of the published mobile Wallet prototype, plus the Claude Code engineering handoff and MVP specification already merged into this folder. All original application source files are unchanged.

- Live reference: https://encore-mobile-wallet.khoanhkhacanhem123.chatgpt.site
- Published version: 1
- Source commit: 56249a1ca17a2248a5bf3023cda8ad032532c8a4
- Original desktop layout is included; the photo Wallet appears below 768px.

This is a frontend prototype, not the implemented production MVP. Records and image edits use this browser's localStorage. Real Discord login, cloud persistence and reminder delivery are not implemented. Browser-local edits from your live-site session are not included in the source export. Use the live app's JSON export separately if you need those records; review any personal data before giving it to an AI tool.

## Local setup

Use Node.js compatible with the package.json requirement (>=22.13.0) and the declared pnpm version (11.25.0). Use your normal package-manager installation method if pnpm is not installed.

From this folder:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

The checked-in portable development script requests port 5173. Open the local URL printed by the server. Set the browser viewport below 768px to see the mobile Wallet.

Useful checks:

```sh
pnpm exec tsc --noEmit
pnpm lint
pnpm test
pnpm build
```

The runtime is Vinext/Vite with Next.js-compatible routing and Cloudflare tooling. Do not replace it with plain Next.js just because package.json also contains Next.js. Resolve production runtime selection as a documented MVP foundation decision.

A clean extraction has no .sites-runtime/execution-profile.json, so the existing scripts select their portable profile automatically. Dependency installation needs registry/network access. This export was checked for source integrity and completeness; a fresh-machine installation and browser render were not rerun for the export. Historical build/test evidence is in WORK_LOG.md, including its visual-verification limitation.

## Start Claude Code

CLAUDE.md and .claude/rules are already present. Read START-HERE.md and use its prompt. No second copy of the earlier handoff ZIP is required.

Suggested opening message:

> This folder contains the current Encore prototype and its engineering handoff. Read SOURCE-EXPORT.md, CLAUDE.md and START-HERE.md. Verify the current state, then carry out the bounded stage-A engineering baseline task. Preserve the UI and existing prototype behavior. Do not attempt the entire MVP or publish changes during this task.

This download has no Git history. If creating a new repository, initialize it here and commit the extracted baseline before changes. Do not overwrite a different existing checkout without reviewing its contents.

## Included hosting metadata

.openai/hosting.json is retained because the checked-in Vite configuration imports it. It contains the identity of the existing private Site; it is not a credential and does not grant deployment access. Do not automatically redeploy that Site, change its audience or create a new Site when running this locally. The bundled hosting helper is prototype infrastructure, not production Discord authentication. Preserve it until an intentional runtime migration.

## Documentation precedence

- docs/product/MVP.md: proposed product scope.
- CLAUDE.md / .claude/rules / docs/engineering: development rules and actual/proposed distinction.
- PRODUCT.md / DESIGN.md: existing design/product context.
- README.md / WORK_LOG.md: historical prototype notes. The older README section names the parent storage key; this mobile branch actually uses encore-mobile-demo-v1, as its later section and source state.
- SOURCE-FILES.sha256: hashes of unchanged tracked source files for comparison.

The archive excludes Git internals, node_modules, build output, runtime state and environment files. No real account data or authentication tokens are included.
