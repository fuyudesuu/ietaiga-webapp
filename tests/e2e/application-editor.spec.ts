import { expect, test } from "@playwright/test";
import {
  choose,
  editorDialog,
  openRoute,
  save,
  savedNotice,
  savedPlanner,
} from "./helpers";

// Characterization of the ticket application editor.

test("edit opens with the round's values, shown in JST", async ({ page }) => {
  await openRoute(page, "/concerts/love");
  await page
    .getByRole("button", { name: "Edit Official advance lottery" })
    .click();
  const dialog = editorDialog(page);
  await expect(dialog.getByRole("heading")).toHaveText(
    "Edit ticket application",
  );
  await expect(dialog.getByLabel("Application round *")).toHaveValue(
    "Official advance lottery",
  );
  await expect(
    dialog.getByRole("combobox", { name: "Ticket provider" }),
  ).toHaveText("l-tike");
  await expect(dialog.getByLabel("Application deadline · JST")).toHaveValue(
    "2026-09-23T23:59",
  );
  await expect(dialog.getByLabel("Results announced · JST")).toHaveValue(
    "2026-10-01T12:00",
  );
  await expect(dialog.getByLabel("Payment deadline · JST")).toHaveValue(
    "2026-10-03T21:00",
  );
  for (const [label, value] of [
    ["Application submitted?", "Yes"],
    ["Lottery result", "Pending"],
    ["Currency", "JPY"],
    ["Payment", "Unpaid"],
    ["Ticket collection", "Not ready"],
  ]) {
    await expect(dialog.getByRole("combobox", { name: label })).toHaveText(
      value,
    );
  }
  await expect(dialog.getByLabel("Amount")).toHaveValue("11000");
});

test("saving keeps the reminder settings and independent states", async ({
  page,
}) => {
  await openRoute(page, "/concerts/love");
  await page
    .getByRole("button", { name: "Edit Official advance lottery" })
    .click();
  const dialog = editorDialog(page);
  await choose(page, "Lottery result", "Won");
  await choose(page, "Ticket collection", "Ready");
  await save(page);

  await expect(dialog).toBeHidden();
  await expect(page.getByText(savedNotice)).toBeVisible();
  const saved = await savedPlanner(page);
  expect(saved?.applications.find((round) => round.id === "a3")).toEqual({
    id: "a3",
    concertId: "love",
    round: "Official advance lottery",
    provider: "l-tike",
    deadline: "2026-09-23T14:59:00.000Z",
    resultDate: "2026-10-01T03:00:00.000Z",
    paymentDeadline: "2026-10-03T12:00:00.000Z",
    submitted: true,
    result: "Won",
    payment: "Unpaid",
    collection: "Ready",
    amount: 11000,
    currency: "JPY",
    reminder: true,
    offset: "1 day",
  });
});

test("a new round starts with defaults and unknown dates", async ({ page }) => {
  await openRoute(page, "/concerts/love");
  await page.getByRole("button", { name: "+ Add round" }).click();
  const dialog = editorDialog(page);
  await expect(dialog.getByRole("heading")).toHaveText(
    "Add ticket application",
  );
  await expect(
    dialog.getByRole("combobox", { name: "Ticket provider" }),
  ).toHaveText("ASOBI TICKET");
  await expect(dialog.getByLabel("Application deadline · JST")).toHaveValue("");
  await dialog.getByLabel("Application round *").fill("Venue lottery");
  await choose(page, "Currency", "SGD");
  await dialog.getByLabel("Amount").fill("88.5");
  await save(page);

  await expect(dialog).toBeHidden();
  const saved = await savedPlanner(page);
  expect(saved?.applications.at(-1)).toEqual({
    id: expect.any(String),
    concertId: "love",
    round: "Venue lottery",
    provider: "ASOBI TICKET",
    deadline: "",
    resultDate: "",
    paymentDeadline: "",
    submitted: false,
    result: "Pending",
    payment: "Unpaid",
    collection: "Not ready",
    amount: 8850,
    currency: "SGD",
    reminder: false,
    offset: "1 day",
  });
});
