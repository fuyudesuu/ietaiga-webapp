import { addDays, TOKYO } from "../lib/dates";
import type { ApplicationRound, Concert } from "../features/concerts/domain/types";
import type { Stay } from "../features/stays/domain/types";
import type { Trip } from "../features/trips/domain/types";

export interface PlannerData {
  concerts: Concert[];
  rounds: ApplicationRound[];
  trips: Trip[];
  stays: Stay[];
}

/**
 * Fictional demo records, generated relative to `now` so the attention
 * list is populated whenever the prototype is opened. Not user data.
 */
export function createDemoData(now: Date): PlannerData {
  const today = now.toISOString().slice(0, 10);
  const at = (days: number, utcHour: number) => {
    const instant = new Date(now);
    instant.setUTCDate(instant.getUTCDate() + days);
    instant.setUTCHours(utcHour, 0, 0, 0);
    return instant.toISOString();
  };
  const tripStart = addDays(today, 38);

  const trips: Trip[] = [
    {
      id: "trip-autumn",
      title: "Autumn Tokyo run",
      destinations: ["Tokyo", "Saitama"],
      startDate: tripStart,
      endDate: addDays(tripStart, 5),
      status: "confirmed",
      archived: false,
      notes: "Two arena nights, one day for Akihabara.",
      coverHue: 330,
    },
    {
      id: "trip-winter",
      title: "Winter Osaka",
      destinations: ["Osaka"],
      startDate: addDays(today, 96),
      endDate: addDays(today, 99),
      status: "tentative",
      archived: false,
      notes: "Only if the lottery comes through.",
      coverHue: 210,
    },
  ];

  const concerts: Concert[] = [
    {
      id: "c-starlight",
      title: "Starlight Stage 10th Live",
      performance: "Day 1 · Brand New Sky",
      venue: "Belluna Dome",
      city: "Saitama",
      date: addDays(tripStart, 1),
      startTime: "17:00",
      timeZone: TOKYO,
      status: "planned",
      archived: false,
      tripId: "trip-autumn",
      sourceUrl: null,
      coverHue: 330,
    },
    {
      id: "c-derby",
      title: "Derby Dreams 6th Event",
      performance: "Day 2",
      venue: "K-Arena Yokohama",
      city: "Yokohama",
      date: addDays(tripStart, 3),
      startTime: "16:30",
      timeZone: TOKYO,
      status: "planned",
      archived: false,
      tripId: "trip-autumn",
      sourceUrl: null,
      coverHue: 140,
    },
    {
      id: "c-idol",
      title: "=Nearly Winter Tour",
      performance: "Osaka final",
      venue: "Osaka-jo Hall",
      city: "Osaka",
      date: addDays(today, 97),
      startTime: null,
      timeZone: TOKYO,
      status: "planned",
      archived: false,
      tripId: "trip-winter",
      sourceUrl: null,
      coverHue: 210,
    },
    {
      id: "c-unannounced",
      title: "School Idol Festival Encore",
      performance: "Main show",
      venue: "TBA",
      city: "Tokyo",
      date: null,
      startTime: null,
      timeZone: TOKYO,
      status: "planned",
      archived: false,
      tripId: null,
      sourceUrl: null,
      coverHue: 45,
    },
  ];

  const rounds: ApplicationRound[] = [
    {
      id: "r-star-ff",
      concertId: "c-starlight",
      provider: "ASOBI TICKET",
      roundName: "Serial code lottery",
      application: "submitted",
      result: "won",
      payment: "unpaid",
      collection: "not_ready",
      amount: { minor: 11500, currency: "JPY" },
      applicationClosesAt: at(-20, 14),
      resultAt: at(-3, 6),
      paymentDueAt: at(2, 14),
      collectionOpensAt: at(30, 3),
    },
    {
      id: "r-derby-1",
      concertId: "c-derby",
      provider: "eplus",
      roundName: "Pre-sale 1",
      application: "submitted",
      result: "pending",
      payment: "unpaid",
      collection: "not_ready",
      amount: { minor: 9800, currency: "JPY" },
      applicationClosesAt: at(-10, 14),
      resultAt: at(-1, 6),
      paymentDueAt: null,
      collectionOpensAt: null,
    },
    {
      id: "r-derby-2",
      concertId: "c-derby",
      provider: "l-tike",
      roundName: "Pre-sale 2",
      application: "planned",
      result: "unknown",
      payment: "unpaid",
      collection: "not_ready",
      amount: { minor: 9800, currency: "JPY" },
      applicationClosesAt: at(4, 14),
      resultAt: at(9, 6),
      paymentDueAt: null,
      collectionOpensAt: null,
    },
    {
      id: "r-idol-fc",
      concertId: "c-idol",
      provider: "CyStore ticket",
      roundName: "Fanclub lottery",
      application: "planned",
      result: "unknown",
      payment: "unpaid",
      collection: "not_ready",
      amount: null,
      applicationClosesAt: at(12, 14),
      resultAt: at(20, 6),
      paymentDueAt: null,
      collectionOpensAt: null,
    },
  ];

  const stays: Stay[] = [
    {
      id: "s-shinjuku",
      tripId: "trip-autumn",
      hotel: "Shinjuku Granbell",
      city: "Tokyo",
      checkIn: tripStart,
      checkOut: addDays(tripStart, 5),
      timeZone: TOKYO,
      status: "booked",
      payment: "unpaid",
      amount: { minor: 84000, currency: "JPY" },
      freeCancellationUntil: at(6, 15),
    },
    {
      id: "s-osaka",
      tripId: "trip-winter",
      hotel: "Namba Oriental",
      city: "Osaka",
      checkIn: addDays(today, 96),
      checkOut: addDays(today, 99),
      timeZone: TOKYO,
      status: "booked",
      payment: "paid",
      amount: { minor: 32000, currency: "AUD" },
      freeCancellationUntil: null,
    },
  ];

  return { concerts, rounds, trips, stays };
}
