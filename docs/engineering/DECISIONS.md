# Decisions

Short records of decisions that change hosting, runtime, authentication, persistence, caching or delivery guarantees. Newest first.

## 2026-10-05 — Styling: Tailwind everywhere, one token scale; Motion for animation later

**Context.** Styling used three systems at once:

- Tailwind inside the vendored shadcn/ui controls;
- about 3,400 lines of global CSS in `app/styles/` for every screen;
- the first CSS Modules, from stage C.

The global CSS has drifted. It uses 39 distinct font sizes, 29 gap values, 16 corner radii, 31 hard-coded colours outside the tokens and 8 `!important` overrides. The owner wants one framework that keeps the UI consistent.

**Decision.**

- Use Tailwind CSS (v4, already installed) for all component styling, alongside the shadcn/ui controls.
- One token scale lives in the `@theme` block in `app/globals.css`: colours, type sizes, spacing, radii, shadows and motion timing. Components use these tokens through Tailwind utilities.
- Screens are converted one at a time. Each conversion deletes the global rules it replaces and is checked with `scripts/visual-snapshots.mjs` to match the previous build.
- A later consistency pass rounds off-scale values to the scale. This is a deliberate, reviewed visual change.
- Custom CSS remains only where utilities are a poor fit:
  - tokens and base styles;
  - the shadcn control skins;
  - the glass material and its fallbacks;
  - keyframes;
  - pseudo-elements such as the file-picker button.
- Motion (motion.dev) is the planned animation library, added afterwards in its own change.

**Alternatives.**

- Tokens plus CSS Modules (the previous plan): rejected by the owner. Two styling systems would remain.
- A component library such as MUI or Mantine: rejected. It would fight the custom glass and Wallet design.

**Impact.**

- No behaviour change.
- The four CSS Modules from stage C are converted, and CSS Modules are no longer the target for features.
- CLAUDE.md, ARCHITECTURE.md and `.claude/rules/encore-frontend.md` are updated.
- Rollback is per screen: each conversion is its own commit.

## 2026-09-28 — Hosting: GitHub Pages now, Cloudflare Workers build kept, Sites removed

**Context.** The prototype came from a ChatGPT Sites project with Sites-specific build tooling: a dev-server plugin faking ChatGPT sign-in headers, execution-profile and installer scripts, and `.openai/hosting.json`. It now runs as a static test build on GitHub Pages. The owner may later deploy to a host better suited to the MVP.

**Decision.**

- Remove the Sites-specific tooling and the unused Sites starter files (ChatGPT auth helper, D1/Drizzle setup, examples).
- Keep Vinext as the framework and keep its Cloudflare Workers server build (`pnpm build`, `pnpm start`). It is the only server-side deploy target in the repo and a plausible production candidate.
- Keep GitHub Pages (`pnpm build:pages`) as the current public test build.

**Alternatives.**

- Keep Sites: rejected. The prototype is no longer deployed there, and the tooling only served that environment.
- Remove Cloudflare as well: rejected for now. Nothing else could serve a server-rendered deploy.

**Impact.** No application behavior changes. `pnpm dev` and `pnpm build` call Vinext directly. The final production host, and with it authentication and persistence, remains the milestone-0 decision in `docs/product/MVP.md`. It should be recorded here when made.
