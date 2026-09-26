import type { UtcInstant } from "../../../lib/dates";
import type { ApplicationRound, Concert } from "../../concerts/domain/types";
import type { Stay } from "../../stays/domain/types";

export type AttentionKind = "application_closing" | "result_to_check" | "payment_due" | "cancellation_cutoff";

export interface AttentionItem {
  key: string;
  kind: AttentionKind;
  label: string;
  detail: string;
  dueAt: UtcInstant;
  timeZone: string;
  overdue: boolean;
  /** Hash route of the record this item leads to. */
  href: string;
}

export const ATTENTION_LABELS: Record<AttentionKind, string> = {
  application_closing: "Application closes",
  result_to_check: "Result to check",
  payment_due: "Payment due",
  cancellation_cutoff: "Free cancellation ends",
};

const HORIZON_MS = 21 * 24 * 60 * 60 * 1000;

interface AttentionInput {
  concerts: readonly Concert[];
  rounds: readonly ApplicationRound[];
  stays: readonly Stay[];
  now: Date;
}

/**
 * Derives what needs the user's attention. A passed result time never
 * implies a win or loss — it only asks the user to check and record it.
 */
export function buildAttention({ concerts, rounds, stays, now }: AttentionInput): AttentionItem[] {
  const nowMs = now.getTime();
  const items: AttentionItem[] = [];
  const concertById = new Map(concerts.map((concert) => [concert.id, concert]));

  const withinHorizon = (instant: UtcInstant) => new Date(instant).getTime() - nowMs <= HORIZON_MS;
  const isPast = (instant: UtcInstant) => new Date(instant).getTime() < nowMs;

  for (const round of rounds) {
    const concert = concertById.get(round.concertId);
    if (!concert || concert.archived || concert.status === "cancelled") continue;
    const base = {
      detail: `${concert.title} · ${round.provider} ${round.roundName}`,
      timeZone: concert.timeZone,
      href: `#/concerts/${concert.id}`,
    };

    if (round.application === "planned" && round.applicationClosesAt && !isPast(round.applicationClosesAt) && withinHorizon(round.applicationClosesAt)) {
      items.push({ ...base, key: `${round.id}:apply`, kind: "application_closing", label: ATTENTION_LABELS.application_closing, dueAt: round.applicationClosesAt, overdue: false });
    }
    if (round.application === "submitted" && (round.result === "pending" || round.result === "unknown") && round.resultAt && isPast(round.resultAt)) {
      items.push({ ...base, key: `${round.id}:result`, kind: "result_to_check", label: ATTENTION_LABELS.result_to_check, dueAt: round.resultAt, overdue: false });
    }
    if (round.result === "won" && round.payment === "unpaid" && round.paymentDueAt && withinHorizon(round.paymentDueAt)) {
      items.push({ ...base, key: `${round.id}:pay`, kind: "payment_due", label: ATTENTION_LABELS.payment_due, dueAt: round.paymentDueAt, overdue: isPast(round.paymentDueAt) });
    }
  }

  for (const stay of stays) {
    if (stay.status !== "booked" || !stay.freeCancellationUntil) continue;
    if (isPast(stay.freeCancellationUntil) || !withinHorizon(stay.freeCancellationUntil)) continue;
    items.push({
      key: `${stay.id}:cancel`,
      kind: "cancellation_cutoff",
      label: ATTENTION_LABELS.cancellation_cutoff,
      detail: `${stay.hotel} · ${stay.city}`,
      dueAt: stay.freeCancellationUntil,
      timeZone: stay.timeZone,
      overdue: false,
      href: `#/trips/${stay.tripId}`,
    });
  }

  return items.sort((a, b) => Number(b.overdue) - Number(a.overdue) || a.dueAt.localeCompare(b.dueAt));
}
