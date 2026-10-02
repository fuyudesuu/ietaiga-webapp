"use client";
import { commitAndNavigate } from "@/lib/encore/navigation";
import { usePlanner } from "@/lib/encore/store";
import type { Trip } from "@/lib/encore/model";

/**
 * Temporary adapter: the trip editor reads and saves through the browser demo
 * store. Remove it in refactor stage D, when an owner-scoped trips repository
 * replaces the demo store.
 */
export function useTripDemoStore() {
  const { state, update } = usePlanner();
  return {
    findTrip: (id?: string) => state.trips.find((trip) => trip.id === id),

    /** Saves the trip; a new one is saved before its page opens. */
    saveTrip(trip: Trip, { isNew }: { isNew: boolean }) {
      commitAndNavigate(
        () =>
          update((planner) => ({
            ...planner,
            trips: isNew
              ? [...planner.trips, trip]
              : planner.trips.map((existing) =>
                  existing.id === trip.id ? trip : existing,
                ),
          })),
        isNew ? "/trips/" + trip.id : undefined,
      );
    },
  };
}
