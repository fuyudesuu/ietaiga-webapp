"use client";

import { useParams } from "next/navigation";
import { useSyncExternalStore } from "react";
import { flushSync } from "react-dom";
import { RECORD_FALLBACK_ID, withBasePath } from "./paths";

/** Commit the edit and its storage effect before leaving the current document. */
export function commitAndNavigate(commit: () => void, href?: string) {
  if (!href) {
    commit();
    return;
  }

  flushSync(commit);
  window.location.assign(withBasePath(href));
}

/** The `[id]` route param, or `?id=` on the static-hosting fallback page. */
export function useRecordId(): string | undefined {
  const params = useParams();
  // Read the query from the document: a static export freezes vinext's
  // search-param snapshot at pre-render time, where the query is empty.
  const fallbackId = useSyncExternalStore(
    subscribeToNothing,
    () => new URLSearchParams(window.location.search).get("id"),
    () => null,
  );
  const id = typeof params.id === "string" ? params.id : undefined;
  return id === RECORD_FALLBACK_ID ? (fallbackId ?? undefined) : id;
}

// Records are opened by full document navigation, so the query never changes
// while this page is mounted.
function subscribeToNothing() {
  return () => {};
}
