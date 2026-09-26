import type { DateOnly, UtcInstant } from "../../../lib/dates";
import type { Money } from "../../../lib/money";

export type ConcertStatus = "planned" | "cancelled" | "completed";
export type ApplicationStatus = "planned" | "submitted" | "withdrawn";
export type ResultStatus = "unknown" | "pending" | "won" | "lost" | "waitlisted";
export type PaymentStatus = "not_required" | "unpaid" | "paid" | "refunded";
export type CollectionStatus = "not_ready" | "ready" | "collected";

export interface Concert {
  id: string;
  title: string;
  performance: string;
  venue: string;
  city: string;
  /** Null when the date has not been announced. */
  date: DateOnly | null;
  /** Local start time "HH:MM" in `timeZone`; null when unknown. */
  startTime: string | null;
  timeZone: string;
  status: ConcertStatus;
  archived: boolean;
  tripId: string | null;
  sourceUrl: string | null;
  /** Prototype-only cover: a hue for the generated gradient. */
  coverHue: number;
}

export interface ApplicationRound {
  id: string;
  concertId: string;
  provider: string;
  roundName: string;
  application: ApplicationStatus;
  result: ResultStatus;
  payment: PaymentStatus;
  collection: CollectionStatus;
  /** Null when the price is unknown — never treated as zero. */
  amount: Money | null;
  applicationClosesAt: UtcInstant | null;
  resultAt: UtcInstant | null;
  paymentDueAt: UtcInstant | null;
  collectionOpensAt: UtcInstant | null;
}

export const RESULT_LABELS: Record<ResultStatus, string> = {
  unknown: "Unknown",
  pending: "Pending",
  won: "Won",
  lost: "Lost",
  waitlisted: "Waitlisted",
};
export const APPLICATION_LABELS: Record<ApplicationStatus, string> = {
  planned: "Planned",
  submitted: "Submitted",
  withdrawn: "Withdrawn",
};
export const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  not_required: "Not required",
  unpaid: "Unpaid",
  paid: "Paid",
  refunded: "Refunded",
};
export const COLLECTION_LABELS: Record<CollectionStatus, string> = {
  not_ready: "Not ready",
  ready: "Ready",
  collected: "Collected",
};
