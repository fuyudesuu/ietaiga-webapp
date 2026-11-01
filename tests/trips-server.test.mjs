import { test } from "node:test";
import assert from "node:assert/strict";
import { tripInput } from "../features/trips/contracts/trip-input.ts";
import {
  classifyError,
  toRow,
  toTripRecord,
} from "../features/trips/server/trip-records.ts";

test("trip input accepts a minimal trip and fills defaults", () => {
  assert.deepEqual(tripInput.parse({ title: "  Tokyo autumn " }), {
    title: "Tokyo autumn",
    destinations: "",
    startDate: null,
    endDate: null,
    status: "tentative",
    notes: "",
  });
});

test("trip input refuses ownership fields and bad values", () => {
  for (const forged of [
    { title: "x", owner_id: "aaaaaaaa-0000-4000-8000-000000000001" },
    { title: "x", ownerId: "aaaaaaaa-0000-4000-8000-000000000001" },
    { title: "x", id: "a1000000-0000-4000-8000-000000000001" },
  ])
    assert.equal(
      tripInput.safeParse(forged).success,
      false,
      JSON.stringify(forged),
    );
  for (const invalid of [
    {},
    { title: "   " },
    { title: "x".repeat(201) },
    { title: "x", status: "won" },
    { title: "x", startDate: "2026-02-30" },
    { title: "x", startDate: "10/09/2026" },
    { title: "x", startDate: "2026-10-13", endDate: "2026-10-09" },
    { title: "x", notes: "n".repeat(5001) },
  ])
    assert.equal(
      tripInput.safeParse(invalid).success,
      false,
      JSON.stringify(invalid),
    );
});

test("rows and records map both ways without owner data", () => {
  const input = tripInput.parse({
    title: "Osaka",
    startDate: "2026-12-04",
    endDate: "2026-12-07",
    status: "confirmed",
  });
  assert.deepEqual(toRow(input), {
    title: "Osaka",
    destinations: "",
    start_date: "2026-12-04",
    end_date: "2026-12-07",
    status: "confirmed",
    notes: "",
  });
  assert.deepEqual(
    toTripRecord({
      id: "t1",
      title: "Osaka",
      destinations: "Osaka",
      start_date: "2026-12-04",
      end_date: null,
      status: "tentative",
      notes: "",
      updated_at: "2026-11-01T00:00:00Z",
    }),
    {
      id: "t1",
      title: "Osaka",
      destinations: "Osaka",
      startDate: "2026-12-04",
      endDate: null,
      status: "tentative",
      notes: "",
      updatedAt: "2026-11-01T00:00:00Z",
    },
  );
});

test("database errors become categories, never raw messages", () => {
  assert.deepEqual(classifyError("23514"), { kind: "invalid", code: "23514" });
  assert.deepEqual(classifyError("22023"), { kind: "invalid", code: "22023" });
  assert.deepEqual(classifyError("54000"), { kind: "limit_reached" });
  assert.deepEqual(classifyError("PGRST116"), { kind: "not_found" });
  assert.deepEqual(classifyError("42501"), {
    kind: "unavailable",
    code: "42501",
  });
  assert.deepEqual(classifyError(undefined), {
    kind: "unavailable",
    code: "unknown",
  });
});
