// The only Motion functions the Wallet uses. `use-wallet-motion` imports
// this module lazily; re-exporting by name keeps the chunk tree-shaken.
export { animate, motionValue } from "motion";
