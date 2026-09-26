---
paths:
  - "features/**/ui/**/*.tsx"
  - "features/**/*.module.css"
  - "components/encore/**/*.tsx"
  - "components/encore/**/*.css"
  - "app/**/*.tsx"
  - "app/**/*.css"
---

# React and styling

- Preserve the mobile Wallet design, existing routes and desktop behavior unless the task explicitly changes them. Refactoring is not a redesign.
- Keep loading, empty, error, saving, success and disabled states intentional. Never display "saved" until the authoritative save succeeds.
- Use semantic buttons/links, associated labels, useful errors, keyboard navigation and visible focus. Prevent double submits. Confirm data-destructive actions with their actual consequences.
- Keep unsaved form values on a recoverable error. Validate on the server even if the form validates in the browser.
- Reuse existing Radix/shadcn controls. Do not rewrite vendored controls or their accessibility behavior to make a visual change.
- Global CSS owns reset/base styles, tokens and theme definitions. Features own CSS Modules with their media queries and state rules. Do not add a new global override at the end of `responsive.css` to solve an ownership problem.
- Tailwind remains appropriate for existing shared UI controls. In feature components, give each property one clear styling owner; do not repeatedly fight utilities with global selectors or `!important`.
- Keep typography/spacing/radius/z-index/motion scales in named tokens where repeated. Preserve light/dark, solid-material, small-screen and reduced-motion behavior.
- Prefer content-driven layouts over fixed heights except deliberately bounded components such as Wallet cards. Test long Japanese titles, missing photos and increased text size.
- Animation changes must handle rapid interruption, tab changes, unmount, pointer cancellation and reduced motion. Hidden cards must not retain keyboard focus.
- Do not attach gestures that prevent normal page scrolling. Keep a keyboard/tap alternative for every drag action.
- Browser state is for UI and explicitly temporary drafts; authenticated server data must have a clear persistence owner. Clear private caches on sign-out.
- Keep the existing persist-before-navigation behavior until the server save is awaited before navigation. A router change alone does not prove edits survive.
- Check relevant mobile/desktop/theme variants in a bounded visual pass. If browser access is unavailable, disclose that gap; DOM tests do not prove rendering or touch behavior.
