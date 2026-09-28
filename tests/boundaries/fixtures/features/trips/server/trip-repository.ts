// Server-only implementation: must never reach client code.
export type TripRow = { id: string; title: string };
export function loadTrips(): TripRow[] {
  return [];
}
