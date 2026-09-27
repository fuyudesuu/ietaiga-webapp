# Encore design system

## Direction

An iOS-inspired personal concert planner with cool white content, ink typography, cobalt actions, and translucent navigation. Overview pairs an actionable agenda with a journey document. Concert dates provide visual rhythm. The user's pinned native-glass brief takes precedence over generic stylistic bans.

## Tokens

Light: background #f4f6fa, foreground #14233e, primary #0865ee, muted text #58677e, border #dbe2ec, card #ffffff. Dark: background #101723, foreground #edf3ff, primary #7badff, card #1a2434. System UI/Hiragino sans; body 16px, secondary 14px, page headings 32–40px. Tabular dates/money. Control radii 10px, content 16px, floating navigation 20px.

## Material and components

Glass is reserved for fixed navigation and focused editor overlays. Solid content preserves readability. Native anchors retain reliable document navigation. Installed Radix/shadcn controls preserve focus, keyboard and form behavior. Cobalt means interaction, amber urgency, green paid status.

## Responsive composition

Desktop agenda/journey columns and side navigation. Mobile stacked content, date-led rows, floating bottom navigation. Reduced transparency and reduced motion have solid/static fallbacks.

## Motion

The focused editor enters with a brief blur and position transition above the still-visible page. No repeated content entrance animations.

## Mobile Wallet branch · September 2026

At widths below 768px, Overview becomes a Wallet with Tickets and Trips tabs. The desktop Overview is retained. Payment urgency stays above the stack. Each cover reads the optional image field on its concert or trip; no city-name inference. Covers without an image use an explicit placeholder. The bundled concert photo is illustrative, not franchise artwork.

Cards are 280px high with a 100px exposed header. Selected cards spring to the top; other cards leave the focus order and fade below. Done, Escape, another tap, and the drag handle close the selection. Reduced motion uses immediate transforms. All text/actions are real DOM elements. Navigation remains native anchors; related items can open directly inside the Wallet.

Use existing cool-white/navy/cobalt tokens and theme preferences. Glass stays on app navigation. Dark image scrims keep text legible; text is never embedded into artwork. Photo uploads are resized and stripped of metadata in the browser. No external upload or additional backend is introduced.
