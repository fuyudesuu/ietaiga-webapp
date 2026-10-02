"use client";
import { commitAndNavigate } from "@/lib/encore/navigation";
import { usePlanner } from "@/lib/encore/store";
import type { Application, Concert } from "@/lib/encore/model";

/**
 * Temporary adapter: the concert and application editors read and save
 * through the browser demo store. Remove it in refactor stage D, when an
 * owner-scoped concerts repository replaces the demo store.
 */
export function useConcertDemoStore() {
  const { state, update } = usePlanner();
  return {
    trips: state.trips,
    defaultCurrency: state.preferences.currency,
    findConcert: (id?: string) =>
      state.concerts.find((concert) => concert.id === id),
    findApplication: (id?: string) =>
      state.applications.find((application) => application.id === id),

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

    saveApplication(application: Application, { isNew }: { isNew: boolean }) {
      update((planner) => ({
        ...planner,
        applications: isNew
          ? [...planner.applications, application]
          : planner.applications.map((existing) =>
              existing.id === application.id ? application : existing,
            ),
      }));
    },
  };
}
