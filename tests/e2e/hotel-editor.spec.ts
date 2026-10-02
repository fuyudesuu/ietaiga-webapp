import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import {
  choose,
  editorDialog,
  openRoute,
  save,
  savedNotice,
  savedPlanner,
} from "./helpers";

// Characterization of the hotel stay editor.

async function openTokyoStay(page: Page) {
  await openRoute(page, "/trips/autumn");
  await page
    .locator("div")
    .filter({ has: page.getByRole("heading", { name: "The Tokyo Stay" }) })
    .filter({ has: page.getByRole("button", { name: "Details" }) })
    .last()
    .getByRole("button", { name: "Details" })
    .click();
}

test("edit opens with the stay's values, shown in JST", async ({ page }) => {
  await openTokyoStay(page);
  const dialog = editorDialog(page);
  await expect(dialog.getByRole("heading")).toHaveText("Edit hotel stay");
  await expect(dialog.getByLabel("Hotel name *")).toHaveValue("The Tokyo Stay");
  await expect(dialog.getByLabel("Area / city")).toHaveValue("Shinjuku, Tokyo");
  await expect(dialog.getByRole("combobox", { name: "Trip" })).toHaveText(
    "Tokyo · Yokohama · A little Tokyo, a lot of live music",
  );
  await expect(dialog.getByLabel("Check-in date *")).toHaveValue("2026-10-09");
  await expect(dialog.getByLabel("Check-out date *")).toHaveValue("2026-10-11");
  // Stored as 2026-10-02T09:00:00Z.
  await expect(
    dialog.getByLabel("Free cancellation until · JST (optional)"),
  ).toHaveValue("2026-10-02T18:00");
  await expect(dialog.getByLabel("Amount")).toHaveValue("28000");
  await expect(dialog.getByRole("combobox", { name: "Currency" })).toHaveText(
    "JPY",
  );
  await expect(dialog.getByRole("combobox", { name: "Payment" })).toHaveText(
    "Paid",
  );
  await expect(
    dialog.getByLabel("Booking reference (sample only)"),
  ).toHaveValue("DEMO-TYO-2410");
});

test("saving converts JST times and amounts to stored values", async ({
  page,
}) => {
  await openTokyoStay(page);
  const dialog = editorDialog(page);
  await dialog
    .getByLabel("Free cancellation until · JST (optional)")
    .fill("2026-10-05T09:30");
  await choose(page, "Currency", "USD");
  await dialog.getByLabel("Amount").fill("199.99");
  await choose(page, "Payment", "Refunded");
  await save(page);

  await expect(dialog).toBeHidden();
  await expect(page.getByText(savedNotice)).toBeVisible();
  const saved = await savedPlanner(page);
  expect(saved?.hotels.find((hotel) => hotel.id === "h1")).toEqual({
    id: "h1",
    tripId: "autumn",
    name: "The Tokyo Stay",
    city: "Shinjuku, Tokyo",
    checkIn: "2026-10-09",
    checkOut: "2026-10-11",
    cancellation: "2026-10-05T00:30:00.000Z",
    amount: 19999,
    currency: "USD",
    payment: "Refunded",
    reference: "DEMO-TYO-2410",
  });
});

test("a new stay starts on the trip it was added from", async ({ page }) => {
  await openRoute(page, "/trips/autumn");
  await page.getByRole("button", { name: "Add hotel stay" }).first().click();
  const dialog = editorDialog(page);
  await expect(dialog.getByRole("heading")).toHaveText("Add hotel stay");
  await expect(dialog.getByRole("combobox", { name: "Trip" })).toHaveText(
    "Tokyo · Yokohama · A little Tokyo, a lot of live music",
  );
  await expect(dialog.getByRole("combobox", { name: "Payment" })).toHaveText(
    "Unpaid",
  );
  await dialog.getByLabel("Hotel name *").fill("Station Inn");
  await dialog.getByLabel("Check-in date *").fill("2026-10-12");
  await dialog.getByLabel("Check-out date *").fill("2026-10-13");
  await save(page);

  await expect(dialog).toBeHidden();
  const saved = await savedPlanner(page);
  expect(saved?.hotels.at(-1)).toEqual({
    id: expect.any(String),
    tripId: "autumn",
    name: "Station Inn",
    city: "",
    checkIn: "2026-10-12",
    checkOut: "2026-10-13",
    cancellation: "",
    // Current behavior: a blank amount is saved as 0, not as unknown.
    amount: 0,
    currency: "JPY",
    payment: "Unpaid",
    reference: "",
  });
});

test("invalid entries are rejected in order", async ({ page }) => {
  await openTokyoStay(page);
  const dialog = editorDialog(page);
  const error = dialog.getByRole("alert");

  await dialog.getByLabel("Amount").fill("-1");
  await dialog.getByLabel("Check-out date *").fill("2026-10-09");
  await save(page);
  await expect(error).toHaveText("Enter an amount of zero or more.");

  await dialog.getByLabel("Amount").fill("1.5");
  await save(page);
  await expect(error).toHaveText("Enter whole yen for JPY.");

  await dialog.getByLabel("Amount").fill("28000");
  await save(page);
  await expect(error).toHaveText("Check-out must be after check-in.");

  await dialog.getByLabel("Check-out date *").fill("2026-10-11");
  await choose(page, "Trip", "No trip yet");
  await save(page);
  await expect(error).toHaveText("Choose a trip for this stay.");
  expect(await savedPlanner(page)).toBeNull();
});
