import { describe, expect, it } from "vitest";
import type { ApplicationRound, Concert } from "../../concerts/domain/types";
import { buildAttention } from "./attention";

const now = new Date("2026-10-01T00:00:00Z");

const concert: Concert = {
  id: "c1",
  title: "Live",
  performance: "Day 1",
  venue: "Arena",
  city: "Tokyo",
  date: "2026-11-14",
  startTime: "17:00",
  timeZone: "Asia/Tokyo",
  status: "planned",
  archived: false,
  tripId: null,
  sourceUrl: null,
  coverHue: 200,
};

const round = (overrides: Partial<ApplicationRound>): ApplicationRound => ({
  id: "r1",
  concertId: "c1",
  provider: "eplus",
  roundName: "Lottery 1",
  application: "planned",
  result: "unknown",
  payment: "unpaid",
  collection: "not_ready",
  amount: null,
  applicationClosesAt: null,
  resultAt: null,
  paymentDueAt: null,
  collectionOpensAt: null,
  ...overrides,
});

const kinds = (rounds: ApplicationRound[], concerts = [concert]) =>
  buildAttention({ concerts, rounds, stays: [], now }).map((item) => item.kind);

describe("buildAttention", () => {
  it("flags a planned application closing soon", () => {
    expect(kinds([round({ applicationClosesAt: "2026-10-03T06:00:00Z" })])).toEqual(["application_closing"]);
  });

  it("ignores a closing window beyond the horizon or already submitted", () => {
    expect(kinds([round({ applicationClosesAt: "2026-12-30T06:00:00Z" })])).toEqual([]);
    expect(kinds([round({ application: "submitted", applicationClosesAt: "2026-10-03T06:00:00Z" })])).toEqual([]);
  });

  it("asks to check a passed result without inferring a win", () => {
    const items = buildAttention({
      concerts: [concert],
      rounds: [round({ application: "submitted", result: "pending", resultAt: "2026-09-30T03:00:00Z" })],
      stays: [],
      now,
    });
    expect(items.map((item) => item.kind)).toEqual(["result_to_check"]);
  });

  it("marks an unpaid win past its deadline as overdue and sorts it first", () => {
    const items = buildAttention({
      concerts: [concert],
      rounds: [
        round({ id: "a", applicationClosesAt: "2026-10-02T00:00:00Z" }),
        round({ id: "b", application: "submitted", result: "won", paymentDueAt: "2026-09-30T14:59:00Z" }),
      ],
      stays: [],
      now,
    });
    expect(items[0]).toMatchObject({ kind: "payment_due", overdue: true });
  });

  it("skips archived and cancelled concerts", () => {
    const closing = [round({ applicationClosesAt: "2026-10-03T06:00:00Z" })];
    expect(kinds(closing, [{ ...concert, archived: true }])).toEqual([]);
    expect(kinds(closing, [{ ...concert, status: "cancelled" }])).toEqual([]);
  });
});
