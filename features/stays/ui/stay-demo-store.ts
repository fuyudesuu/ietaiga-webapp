"use client";
import { usePlanner } from "@/lib/encore/store";
import type { Hotel } from "@/lib/encore/model";

/**
 * Temporary adapter: the hotel stay editor reads and saves through the
 * browser demo store. Remove it in refactor stage D, when an owner-scoped
 * stays repository replaces the demo store.
 */
export function useStayDemoStore() {
  const { state, update } = usePlanner();
  return {
    trips: state.trips,
    defaultCurrency: state.preferences.currency,
    findHotel: (id?: string) => state.hotels.find((hotel) => hotel.id === id),

    saveHotel(hotel: Hotel, { isNew }: { isNew: boolean }) {
      update((planner) => ({
        ...planner,
        hotels: isNew
          ? [...planner.hotels, hotel]
          : planner.hotels.map((existing) =>
              existing.id === hotel.id ? hotel : existing,
            ),
      }));
    },
  };
}
