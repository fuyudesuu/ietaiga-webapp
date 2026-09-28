// ALLOWED: type-only import of another feature's client-safe contract.
import type { TripSummary } from "@/tests/boundaries/fixtures/features/trips/contracts/trip";
export function tripTitle(trip: TripSummary): string {
  return trip.title;
}
