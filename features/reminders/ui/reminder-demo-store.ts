"use client";
import { usePlanner } from "@/lib/encore/store";

/**
 * Temporary adapter: the reminder editor reads and saves an application's
 * reminder preference in the browser demo store. Remove it in refactor
 * stage D/E, when reminders are persisted with their delivery jobs.
 */
export function useReminderDemoStore() {
  const { state, update } = usePlanner();
  return {
    preferences: state.preferences,
    findApplication: (id: string) =>
      state.applications.find((application) => application.id === id),
    findConcert: (id?: string) =>
      state.concerts.find((concert) => concert.id === id),

    /** Changes only the reminder preference of the application round. */
    saveReminder(
      applicationId: string,
      preference: { reminder: boolean; offset: string },
    ) {
      update((planner) => ({
        ...planner,
        applications: planner.applications.map((application) =>
          application.id === applicationId
            ? { ...application, ...preference }
            : application,
        ),
      }));
    },
  };
}
