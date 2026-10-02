"use client";
import { commitAndNavigate } from "@/lib/encore/navigation";
import { usePlanner } from "@/lib/encore/store";
import type { Concert } from "@/lib/encore/model";

/**
 * Temporary adapter: the concert editor reads and saves
 * through the browser demo store. Remove it in refactor stage D, when an
 * owner-scoped concerts repository replaces the demo store.
 */
export function useConcertDemoStore() {
  const { state, update } = usePlanner();
  return {
    trips: state.trips,
    findConcert: (id?: string) =>
      state.concerts.find((concert) => concert.id === id),

    /** Saves the concert; a new one is saved before its page opens. */
    saveConcert(concert: Concert, { isNew }: { isNew: boolean }) {
      commitAndNavigate(
        () =>
          update((planner) => ({
            ...planner,
            concerts: isNew
              ? [...planner.concerts, concert]
              : planner.concerts.map((existing) =>
                  existing.id === concert.id ? concert : existing,
                ),
          })),
        isNew ? "/concerts/" + concert.id : undefined,
      );
    },
  };
}
