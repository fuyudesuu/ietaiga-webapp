import { test } from "node:test";
import assert from "node:assert/strict";
import { loadTypeScript } from "./load-typescript.mjs";

const { createPlannerStore, parseSavedPlanner, DEMO_STORAGE_KEY } =
  await loadTypeScript("../lib/encore/demo-storage.ts", import.meta.url);
const { seed } = await loadTypeScript(
  "../lib/encore/fixtures.ts",
  import.meta.url,
);

function memoryStorage(initial = {}) {
  const items = new Map(Object.entries(initial));
  return {
    items,
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => items.set(key, value),
  };
}
const saved = (data) => JSON.stringify({ version: 1, data });

test("uses the saved browser copy when it is valid", () => {
  const edited = { ...structuredClone(seed), trips: [] };
  const storage = memoryStorage({ [DEMO_STORAGE_KEY]: saved(edited) });
  const store = createPlannerStore(seed, () => storage);
  assert.deepEqual(store.getSnapshot().trips, []);
  assert.equal(store.getServerSnapshot(), seed);
});

test("ignores corrupt, old-version or incomplete saved data", () => {
  assert.equal(parseSavedPlanner("{not json"), null);
  assert.equal(
    parseSavedPlanner(JSON.stringify({ version: 2, data: seed })),
    null,
  );
  const incomplete = { ...structuredClone(seed), hotels: undefined };
  assert.equal(parseSavedPlanner(saved(incomplete)), null);
  const store = createPlannerStore(seed, () =>
    memoryStorage({ [DEMO_STORAGE_KEY]: "{not json" }),
  );
  assert.equal(store.getSnapshot(), seed);
});

test("writes an edit to storage before notifying listeners", () => {
  const storage = memoryStorage();
  const store = createPlannerStore(seed, () => storage);
  let storedWhenNotified = null;
  store.subscribe(() => {
    storedWhenNotified = storage.getItem(DEMO_STORAGE_KEY);
  });
  const next = { ...store.getSnapshot(), trips: [] };
  assert.equal(store.set(next), true);
  assert.equal(store.getSnapshot(), next);
  assert.deepEqual(JSON.parse(storedWhenNotified), { version: 1, data: next });
});

test("reports a failed write but keeps the edit in memory", () => {
  const store = createPlannerStore(seed, () => ({
    getItem: () => null,
    setItem: () => {
      throw new Error("QuotaExceededError");
    },
  }));
  const next = { ...store.getSnapshot(), trips: [] };
  assert.equal(store.set(next), false);
  assert.equal(store.getSnapshot(), next);
});

test("starts from the seed when storage cannot be read", () => {
  const store = createPlannerStore(seed, () => {
    throw new Error("SecurityError");
  });
  assert.equal(store.getSnapshot(), seed);
  assert.equal(store.set({ ...seed, trips: [] }), false);
});
