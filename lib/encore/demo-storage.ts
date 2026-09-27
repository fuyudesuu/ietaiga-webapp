import type { PlannerState } from "./model";

/**
 * Browser-local persistence for the demo planner. This is an external store
 * read through `useSyncExternalStore`: the server and the first client render
 * use the seed, then the saved browser copy. Writes go to localStorage
 * synchronously, so an edit is stored before any following navigation.
 * Replace with an owner-scoped server repository (refactor stage D).
 */
export const DEMO_STORAGE_KEY = "encore-mobile-demo-v1";

const RECORD_LISTS = [
  "concerts",
  "applications",
  "trips",
  "hotels",
  "deliveries",
] as const;

/** Parse a saved copy; anything malformed or from another version is ignored. */
export function parseSavedPlanner(raw: string | null): PlannerState | null {
  if (!raw) return null;
  let saved: unknown;
  try {
    saved = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof saved !== "object" || saved === null) return null;
  const { version, data } = saved as { version?: unknown; data?: unknown };
  if (version !== 1 || typeof data !== "object" || data === null) return null;
  const record = data as Record<string, unknown>;
  const preferences = record.preferences as { zone?: unknown } | undefined;
  const valid =
    RECORD_LISTS.every((key) => Array.isArray(record[key])) &&
    typeof preferences?.zone === "string";
  return valid ? (data as PlannerState) : null;
}

type StorageAccess = () => Pick<Storage, "getItem" | "setItem"> | null;

export interface PlannerStore {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => PlannerState;
  getServerSnapshot: () => PlannerState;
  /** Replace the state. Returns false when it could not be written to storage. */
  set: (next: PlannerState) => boolean;
}

export function createPlannerStore(
  initial: PlannerState,
  storage: StorageAccess,
): PlannerStore {
  let current: PlannerState | null = null;
  const listeners = new Set<() => void>();

  function getSnapshot() {
    if (current) return current;
    let saved: PlannerState | null = null;
    try {
      saved = parseSavedPlanner(storage()?.getItem(DEMO_STORAGE_KEY) ?? null);
    } catch {
      // Storage is blocked (for example, some private modes): start from the
      // seed. A later failed write is reported to the user by `set`.
    }
    current = saved ?? initial;
    return current;
  }

  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot,
    getServerSnapshot: () => initial,
    set(next) {
      current = next;
      let stored = true;
      try {
        const target = storage();
        if (!target) stored = false;
        else
          target.setItem(
            DEMO_STORAGE_KEY,
            JSON.stringify({ version: 1, data: next }),
          );
      } catch {
        stored = false;
      }
      listeners.forEach((listener) => listener());
      return stored;
    },
  };
}
