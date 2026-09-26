import { describe, expect, it } from "vitest";
import type { ApplicationRound } from "../../concerts/domain/types";
import type { Stay } from "../../stays/domain/types";
import { summarizeCosts } from "./costs";

const round = (overrides: Partial<ApplicationRound>): ApplicationRound => ({
  id: "r",
  concertId: "c",
  provider: "eplus",
  roundName: "Lottery 1",
  application: "submitted",
  result: "pending",
  payment: "unpaid",
  collection: "not_ready",
  amount: { minor: 12000, currency: "JPY" },
  applicationClosesAt: null,
  resultAt: null,
  paymentDueAt: null,
  collectionOpensAt: null,
  ...overrides,
});

const stay = (overrides: Partial<Stay>): Stay => ({
  id: "s",
  tripId: "t",
  hotel: "Hotel",
  city: "Tokyo",
  checkIn: "2026-11-13",
  checkOut: "2026-11-15",
  timeZone: "Asia/Tokyo",
  status: "booked",
  payment: "unpaid",
  amount: { minor: 30000, currency: "JPY" },
  freeCancellationUntil: null,
  ...overrides,
});

describe("summarizeCosts", () => {
  it("excludes pending and lost rounds from commitments", () => {
    const summary = summarizeCosts([round({ result: "pending" }), round({ result: "lost" })], []);
    expect(summary.committed).toEqual([]);
  });

  it("counts two genuine wins for the same concert as two obligations", () => {
    const summary = summarizeCosts([round({ id: "a", result: "won" }), round({ id: "b", result: "won" })], []);
    expect(summary.committed).toEqual([{ currency: "JPY", minor: 24000 }]);
  });

  it("keeps currencies separate and never converts", () => {
    const summary = summarizeCosts(
      [round({ result: "won", payment: "paid" })],
      [stay({ amount: { minor: 45000, currency: "AUD" }, payment: "paid" })],
    );
    expect(summary.committed).toEqual([
      { currency: "JPY", minor: 12000 },
      { currency: "AUD", minor: 45000 },
    ]);
    expect(summary.paid).toHaveLength(2);
  });

  it("treats an unknown amount as unknown, not zero", () => {
    const summary = summarizeCosts([round({ result: "won", amount: null })], []);
    expect(summary.committed).toEqual([]);
    expect(summary.unknownAmounts).toBe(1);
  });

  it("drops refunded wins and cancelled stays", () => {
    const summary = summarizeCosts([round({ result: "won", payment: "refunded" })], [stay({ status: "cancelled" })]);
    expect(summary.committed).toEqual([]);
  });
});
