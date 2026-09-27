import { useState } from "react";
export const ciProbe = useState;
export type Currency = "JPY" | "USD" | "AUD" | "SGD";
export type Result = "Pending" | "Won" | "Lost" | "Waitlisted";
export type Payment = "Unpaid" | "Paid" | "Not required" | "Refunded";
export interface Trip {
  image?: string;
  id: string;
  title: string;
  cities: string;
  start: string;
  end: string;
  status: "Confirmed" | "Tentative" | "Completed";
  notes: string;
}
export interface Concert {
  image?: string;
  id: string;
  title: string;
  subtitle: string;
  date: string;
  time: string;
  venue: string;
  city: string;
  zone: string;
  tripId: string;
  color: string;
  notes: string;
}
export interface Application {
  id: string;
  concertId: string;
  round: string;
  provider: string;
  deadline: string;
  resultDate: string;
  paymentDeadline: string;
  submitted: boolean;
  result: Result;
  payment: Payment;
  collection: "Not ready" | "Ready" | "Collected";
  amount: number;
  currency: Currency;
  reminder: boolean;
  offset: string;
}
export interface Hotel {
  id: string;
  tripId: string;
  name: string;
  city: string;
  checkIn: string;
  checkOut: string;
  cancellation: string;
  amount: number;
  currency: Currency;
  payment: Payment;
  reference: string;
}
export interface Delivery {
  id: string;
  label: string;
  destination: string;
  status: "Simulated sent" | "Failed";
  time: string;
}
export interface Preferences {
  zone: string;
  currency: Currency;
  theme: "light" | "dark" | "system";
  solid: boolean;
  destination: "none" | "dm" | "channel";
  connected: boolean;
  channel: string;
  revealTitle: boolean;
}
export interface PlannerState {
  trips: Trip[];
  concerts: Concert[];
  applications: Application[];
  hotels: Hotel[];
  deliveries: Delivery[];
  preferences: Preferences;
}
export type Editor =
  | { type: "concert"; id?: string; tripId?: string }
  | { type: "trip"; id?: string }
  | { type: "hotel"; id?: string; tripId?: string }
  | { type: "application"; id?: string; concertId: string }
  | { type: "reminder"; id: string }
  | null;
export const DEMO_NOW = "2026-10-01T03:00:00Z";
export const money = (amount: number, currency: Currency) =>
  new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    currencyDisplay: currency === "JPY" ? "symbol" : "code",
    maximumFractionDigits: currency === "JPY" ? 0 : 2,
  }).format(amount / (currency === "JPY" ? 1 : 100));
export function day(
  value: string,
  options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" },
) {
  return value
    ? new Intl.DateTimeFormat("en-GB", { ...options, timeZone: "UTC" }).format(
        new Date(value.length === 10 ? value + "T12:00:00Z" : value),
      )
    : "Date not announced";
}
export function instant(value: string, zone = "Asia/Tokyo") {
  return value
    ? new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: zone,
        timeZoneName: "short",
      }).format(new Date(value))
    : "Time not announced";
}
export const due = (value: string) => {
  const hours =
    (new Date(value).getTime() - new Date(DEMO_NOW).getTime()) / 3600000;
  return hours < 0
    ? "Overdue"
    : hours === 0
      ? "Now"
      : hours < 24
        ? `In ${Math.ceil(hours)} hours`
        : `In ${Math.ceil(hours / 24)} days`;
};
export const appStatus = (a: Application) =>
  a.result === "Won"
    ? a.payment === "Paid"
      ? a.collection === "Collected"
        ? "Ticket collected"
        : "Ticket secured"
      : "Payment needed"
    : a.result === "Lost"
      ? "Not selected"
      : a.submitted
        ? "Awaiting result"
        : "Application open";
export function costs(state: PlannerState, tripId?: string) {
  const ids = state.concerts
    .filter((c) => !tripId || c.tripId === tripId)
    .map((c) => c.id);
  const items = [
    ...state.applications.filter(
      (a) => ids.includes(a.concertId) && a.result === "Won",
    ),
    ...state.hotels.filter((h) => !tripId || h.tripId === tripId),
  ];
  return items
    .filter((i) => i.payment !== "Refunded" && i.payment !== "Not required")
    .reduce<Partial<Record<Currency, { total: number; paid: number }>>>(
      (acc, i) => {
        const v = acc[i.currency] ?? { total: 0, paid: 0 };
        v.total += i.amount;
        if (i.payment === "Paid") v.paid += i.amount;
        acc[i.currency] = v;
        return acc;
      },
      {},
    );
}
