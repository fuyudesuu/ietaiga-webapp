import type { TripInput } from "../contracts/trip-input";

// Pure mapping between trip rows and records, and database error categories.
// Kept free of the "server-only" guard so unit tests can load it.

/** A stored trip, as the database returns it. */
export interface TripRecord {
  id: string;
  title: string;
  destinations: string;
  startDate: string | null;
  endDate: string | null;
  status: TripInput["status"];
  notes: string;
  updatedAt: string;
}

export const COLUMNS =
  "id, title, destinations, start_date, end_date, status, notes, updated_at";
// A personal planner never needs more in one list (the database caps an
// account at 500 trips).
export const LIST_LIMIT = 500;

export type TripRow = {
  id: string;
  title: string;
  destinations: string;
  start_date: string | null;
  end_date: string | null;
  status: TripInput["status"];
  notes: string;
  updated_at: string;
};

export function toTripRecord(row: TripRow): TripRecord {
  return {
    id: row.id,
    title: row.title,
    destinations: row.destinations,
    startDate: row.start_date,
    endDate: row.end_date,
    status: row.status,
    notes: row.notes,
    updatedAt: row.updated_at,
  };
}

export function toRow(input: TripInput) {
  return {
    title: input.title,
    destinations: input.destinations,
    start_date: input.startDate,
    end_date: input.endDate,
    status: input.status,
    notes: input.notes,
  };
}

export type RepositoryFailure =
  | { kind: "not_found" }
  | { kind: "invalid"; code: string }
  | { kind: "limit_reached" }
  | { kind: "unavailable"; code: string };

export type RepositoryResult<T> =
  { ok: true; value: T } | { ok: false; failure: RepositoryFailure };

/** Maps a database error to a category the UI can explain, never its text. */
export function classifyError(code: string | undefined): RepositoryFailure {
  if (code === "23514" || code === "22023" || code === "22P02")
    return { kind: "invalid", code };
  if (code === "54000") return { kind: "limit_reached" };
  if (code === "PGRST116") return { kind: "not_found" };
  return { kind: "unavailable", code: code ?? "unknown" };
}
