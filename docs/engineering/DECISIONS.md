# Decisions

Short records of decisions that change hosting, runtime, authentication, persistence, caching or delivery guarantees. Newest first.

## 2026-10-26 — Motion only for the Wallet springs; CSS for the rest

**Context.** The 2026-10-05 decision planned Motion (motion.dev) for animation. Three animations were missing or rough: the editor dialog vanished on close, the "saved" toast had no animation, and the Wallet used a hand-built spring curve that restarted from zero velocity when interrupted.

**Decision.**

- The Wallet cards use Motion springs (`motion` 14.3). The library is imported lazily through `features/wallet/ui/wallet-motion-library.ts`, which re-exports only `animate` and `motionValue`. The chunk is 22KB gzip and loads only with the Wallet; until it arrives, cards move without animating.
- The dialog close and the toast use CSS keyframes and `tw-animate-css`, which are already installed. No library is needed for an enter/exit fade.
- Reduced motion turns all of them off.

**Alternatives.** `motion/react` with `AnimatePresence` for the toast: rejected. It would put the React bundle on every page for one fade.

**Impact.** One new dependency. Rollback: revert the hook to the previous commit and remove the package.

## 2026-10-26 — The token scale, enforced by a check

**Context.** After the move to Tailwind, the components still used 26 arbitrary font sizes, 36 arbitrary spacing values, 12 radii, 7 font weights, 10 line heights and 15 letter-spacings. The owner asked for the consistency pass.

**Decision.** Every component value comes from this scale (tokens in `app/globals.css`, Tailwind defaults otherwise):

| | Steps |
|---|---|
| Type | `caption` 12, `label` 13, `small` 14, `body` 16, `lead` 18, `title` 22, `heading` 28, `display` 36px |
| Weight | normal, medium, semibold; bold only for the wordmark and the Wallet title |
| Letter-spacing | `tight` −0.02em, `tighter` −0.035em, `wide` 0.06em, normal |
| Line height | `tight`, `snug`, `normal`, `relaxed` |
| Radius | `xs` 4, `sm` 8, `md` 10, `lg` 14, `xl` 20px, `full` |
| Spacing | 2, 4, 6, 8, 10, 12, 16, 20, 24, 32, 40, 48px |

- Off-scale values were rounded to the nearest step, rounding down on a tie.
- Weights 550–570 became semibold, not medium. The font stack is the system font: on Arial-only systems 550 rendered bold and 500 renders regular, so semibold keeps the look there and is close on Apple's variable fonts.
- Positional offsets (`top-[13px]`) and spacing above 48px (navigation clearances) are layout geometry and stay as they are.
- `scripts/check-scale.mjs` (`pnpm check:scale`, part of `pnpm check`) fails on any new off-scale value in components.

**Alternatives.** A finer scale with a 15px size and 18px spacing step was rejected: it would keep most of today's drift.

**Impact.** A deliberate visual change, reviewed as before/after screenshots. Text sizes and spacing move by at most a few pixels. Rollback is the one commit.

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
