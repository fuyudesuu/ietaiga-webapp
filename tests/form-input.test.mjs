import { test } from "node:test";
import assert from "node:assert/strict";
import { loadTypeScript } from "./load-typescript.mjs";

const {
  parseMoney,
  amountInputValue,
  toJstInput,
  fromJstInput,
  tripChoices,
  noTrip,
} = await loadTypeScript("../lib/encore/form-input.ts", import.meta.url);

test("amounts are stored in minor units of their currency", () => {
  assert.deepEqual(parseMoney("12000", "JPY", "USD"), {
    amount: 12000,
    currency: "JPY",
  });
  assert.deepEqual(parseMoney("199.99", "USD", "JPY"), {
    amount: 19999,
    currency: "USD",
  });
  assert.equal(amountInputValue(19999, "USD"), "199.99");
  assert.equal(amountInputValue(12000, "JPY"), "12000");
});

test("an unknown currency falls back to the preferred one", () => {
  assert.deepEqual(parseMoney("5", "", "AUD"), {
    amount: 500,
    currency: "AUD",
  });
  assert.deepEqual(parseMoney("5", "EUR", "JPY"), {
    amount: 5,
    currency: "JPY",
  });
});

test("negative, non-numeric and fractional-yen amounts are rejected", () => {
  assert.throws(() => parseMoney("-1", "JPY", "JPY"), {
    message: "Enter an amount of zero or more.",
  });
  assert.throws(() => parseMoney("abc", "USD", "JPY"), {
    message: "Enter an amount of zero or more.",
  });
  assert.throws(() => parseMoney("1.5", "JPY", "JPY"), {
    message: "Enter whole yen for JPY.",
  });
});

test("a blank amount is currently saved as 0 (known issue)", () => {
  assert.deepEqual(parseMoney("", "JPY", "JPY"), {
    amount: 0,
    currency: "JPY",
  });
});

test("JST inputs round-trip to UTC instants", () => {
  assert.equal(toJstInput("2026-09-23T14:59:00Z"), "2026-09-23T23:59");
  assert.equal(fromJstInput("2026-09-23T23:59"), "2026-09-23T14:59:00.000Z");
  // Across midnight and a month boundary in Japan.
  assert.equal(toJstInput("2026-09-30T15:00:00Z"), "2026-10-01T00:00");
  assert.equal(toJstInput(""), "");
  assert.equal(fromJstInput(""), "");
});

test("trip choices start with no trip", () => {
  const choices = tripChoices([
    { id: "autumn", title: "Autumn", cities: "Tokyo · Yokohama" },
  ]);
  assert.deepEqual(choices, [
    { value: noTrip, label: "No trip yet" },
    { value: "autumn", label: "Tokyo · Yokohama · Autumn" },
  ]);
});
