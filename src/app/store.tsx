import { createContext, useContext, useEffect, useMemo, useReducer, useState, type ReactNode } from "react";
import { createDemoData, type PlannerData } from "../demo/seed";
import type { ApplicationRound, Concert } from "../features/concerts/domain/types";

/**
 * Prototype-only persistence: browser localStorage, demo data only.
 * Replace with an owner-scoped server repository (refactor stage D).
 */
const STORAGE_KEY = "encore-prototype:v1";

type Action =
  | { type: "updateRound"; roundId: string; changes: Partial<Omit<ApplicationRound, "id" | "concertId">> }
  | { type: "addConcert"; concert: Concert }
  | { type: "setConcertArchived"; concertId: string; archived: boolean }
  | { type: "reset" };

function reducer(state: PlannerData, action: Action): PlannerData {
  switch (action.type) {
    case "updateRound":
      return {
        ...state,
        rounds: state.rounds.map((round) => (round.id === action.roundId ? { ...round, ...action.changes } : round)),
      };
    case "addConcert":
      return { ...state, concerts: [...state.concerts, action.concert] };
    case "setConcertArchived":
      return {
        ...state,
        concerts: state.concerts.map((concert) =>
          concert.id === action.concertId ? { ...concert, archived: action.archived } : concert,
        ),
      };
    case "reset":
      return createDemoData(new Date());
  }
}

function isPlannerData(value: unknown): value is PlannerData {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return ["concerts", "rounds", "trips", "stays"].every((key) => Array.isArray(record[key]));
}

function loadInitial(): PlannerData {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (isPlannerData(parsed)) return parsed;
    }
  } catch {
    // Storage unavailable or corrupt: fall back to fresh demo data below.
  }
  return createDemoData(new Date());
}

interface StoreValue {
  data: PlannerData;
  dispatch: (action: Action) => void;
  persisted: boolean;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, dispatch] = useReducer(reducer, undefined, loadInitial);
  const [persisted, setPersisted] = useState(true);
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setPersisted(true);
    } catch {
      setPersisted(false);
    }
  }, [data]);
  const value = useMemo(() => ({ data, dispatch, persisted }), [data, persisted]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const value = useContext(StoreContext);
  if (!value) throw new Error("useStore must be used inside StoreProvider");
  return value;
}

/** Real clock, ticking each minute so relative times stay current. */
export function useNow(): Date {
  const [now, tick] = useReducer(() => new Date(), undefined, () => new Date());
  useEffect(() => {
    const timer = window.setInterval(tick, 60_000);
    return () => window.clearInterval(timer);
  }, []);
  return now;
}
