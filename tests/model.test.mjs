import { test } from "node:test";
import assert from "node:assert/strict";
import { loadTypeScript as load } from "./load-typescript.mjs";

const loadTypeScript = (path) => load(path, import.meta.url);
const { costs, money, due, instant, day } = await loadTypeScript(
  "../lib/encore/model.ts",
);
const { seed } = await loadTypeScript("../lib/encore/fixtures.ts");

test("trip costs count winning applications once and exclude undecided rounds", () => {
  assert.deepEqual(costs(seed, "autumn"), {
    JPY: { total: 75800, paid: 37800 },
  });
});
test("recording payment changes paid balance without inflating total", () => {
  const state = structuredClone(seed);
  state.applications[0].payment = "Paid";
  assert.deepEqual(costs(state, "autumn"), {
    JPY: { total: 75800, paid: 49800 },
  });
});
test("different currencies stay separate and refunds are excluded", () => {
  const state = structuredClone(seed);
  state.hotels[0].payment = "Refunded";
  state.hotels.push({
    ...state.hotels[1],
    id: "usd",
    amount: 12550,
    currency: "USD",
    payment: "Paid",
  });
  assert.deepEqual(costs(state, "autumn"), {
    JPY: { total: 47800, paid: 9800 },
    USD: { total: 12550, paid: 12550 },
  });
  assert.match(money(12550, "USD"), /125\.50/);
  assert.match(money(12000, "JPY"), /12,000/);
});
test("deadline instant renders in both zones and fixed clock drives urgency", () => {
  const deadline = "2026-10-01T09:00:00Z";
  assert.match(instant(deadline, "Asia/Tokyo"), /18:00/);
  assert.match(instant(deadline, "Asia/Singapore"), /17:00/);
  assert.equal(due(deadline), "In 6 hours");
  assert.equal(due("2026-09-30T09:00:00Z"), "Overdue");
});
test("Sydney daylight saving is calculated by IANA zone rules", () => {
  assert.match(instant("2026-10-03T12:00:00Z", "Australia/Sydney"), /22:00/);
  assert.match(instant("2026-10-04T12:00:00Z", "Australia/Sydney"), /23:00/);
});
test("unannounced timing stays explicitly unknown", () => {
  assert.equal(day(""), "Date not announced");
  assert.equal(instant(""), "Time not announced");
});
