# Encore Mobile Wallet work log

## 2026-09-23

Request: branch the live site, integrate the mobile Wallet with per-item images, and suggest desktop improvements separately.

Parent: appgprj_6aa55e15c32c8191aa4467ceba16eb6e, live v3, 06e43050fdd57e2f72da51a94e895c2e58dbd03e. This checkout is a separate source repository with its own registered Site identity in .openai/hosting.json. Parent source/live deployment untouched.

Completed: responsive mobile-only home replacement, photo card stack, Tickets/Trips tabs, interruptible spring motion, reduced-motion fallback, tap/Done/Escape/drag dismissal, focus restoration, linked concert/trip details, stays and totals, payment recording, per-item image picker with compression/validation/error feedback. New records and missing images have explicit states. Native full-page links and existing editors retained.

Validation: TypeScript passed. Six existing domain tests passed. React/JSDOM interaction checks passed: selection and hidden-card focus, payment and browser persistence, ticket/trip links, stay editor, totals, per-item image association/fallback, keyboard tabs, Escape/focus return, empty state and upload validation. These are DOM checks, not browser rendering verification.

Preview blocker: managed preview reports 'sites-previewd mailbox is unavailable at /tmp/sites-previewd/requests'. No real browser or physical-phone visual/motion verification was possible. This does not require changing deployment audience or modifying the original Site.

Desktop ideas deferred: keep an agenda rather than a stacked Wallet; use a persistent selected-item detail pane; introduce modest item-image thumbnails and a wider itinerary with stays aligned to dates. No desktop redesign implemented.
