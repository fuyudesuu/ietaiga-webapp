import { totalsByCurrency, type Money } from "../../../lib/money";
import type { ApplicationRound } from "../../concerts/domain/types";
import type { Stay } from "../../stays/domain/types";

export interface CostSummary {
  /** Won tickets and active bookings, per currency. */
  committed: Money[];
  /** Amounts already paid and not refunded, per currency. */
  paid: Money[];
  /** Committed items whose price is still unknown. */
  unknownAmounts: number;
}

/**
 * Pending/lost rounds are not commitments. Each winning round and each
 * booked stay counts once; two genuine wins are two obligations.
 */
export function summarizeCosts(rounds: readonly ApplicationRound[], stays: readonly Stay[]): CostSummary {
  const committedItems = [
    ...rounds.filter((round) => round.result === "won" && round.payment !== "refunded"),
    ...stays.filter((stay) => stay.status === "booked"),
  ];
  const committed: Money[] = [];
  const paid: Money[] = [];
  let unknownAmounts = 0;
  for (const item of committedItems) {
    if (item.amount === null) {
      unknownAmounts += 1;
      continue;
    }
    committed.push(item.amount);
    if (item.payment === "paid") paid.push(item.amount);
  }
  return { committed: totalsByCurrency(committed), paid: totalsByCurrency(paid), unknownAmounts };
}
