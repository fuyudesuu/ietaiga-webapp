"use client";

import { flushSync } from "react-dom";

/** Commit the edit and its storage effect before leaving the current document. */
export function commitAndNavigate(commit: () => void, href?: string) {
  if (!href) {
    commit();
    return;
  }

  flushSync(commit);
  window.location.assign(href);
}
