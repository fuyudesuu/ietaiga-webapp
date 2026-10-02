import { expect, test } from "@playwright/test";
import { choose, editorDialog, openRoute, save, savedPlanner } from "./helpers";

// Characterization of the reminder preference editor.

test("changes only the reminder preference of the round", async ({ page }) => {
  await openRoute(page, "/concerts/love");
  await page.getByRole("button", { name: "1 day before" }).click();
  const dialog = editorDialog(page);
  await expect(dialog.getByRole("heading")).toHaveText(
    "A reminder for this moment",
  );
  await expect(dialog.getByText("Official advance lottery")).toBeVisible();
  await expect(dialog.getByText("Love Live!")).toBeVisible();
  await expect(
    dialog.getByRole("combobox", { name: "Reminder enabled" }),
  ).toHaveText("Yes");
  await expect(
    dialog.getByRole("combobox", {
      name: "Remind me before the next deadline",
    }),
  ).toHaveText("1 day");

  await choose(page, "Remind me before the next deadline", "2 hours");
  await save(page);

  await expect(dialog).toBeHidden();
  await expect(
    page.getByText("Reminder preference saved in this demo."),
  ).toBeVisible();
  const saved = await savedPlanner(page);
  expect(saved?.applications.find((round) => round.id === "a3")).toEqual({
    id: "a3",
    concertId: "love",
    round: "Official advance lottery",
    provider: "l-tike",
    deadline: "2026-09-23T14:59:00Z",
    resultDate: "2026-10-01T03:00:00Z",
    paymentDeadline: "2026-10-03T12:00:00Z",
    submitted: true,
    result: "Pending",
    payment: "Unpaid",
    collection: "Not ready",
    amount: 11000,
    currency: "JPY",
    reminder: true,
    offset: "2 hours",
  });
});

test("can turn the reminder off", async ({ page }) => {
  await openRoute(page, "/concerts/love");
  await page.getByRole("button", { name: "1 day before" }).click();
  await choose(page, "Reminder enabled", "No");
  await save(page);
  await expect(editorDialog(page)).toBeHidden();
  await expect(
    page.getByRole("button", { name: "Add reminder" }),
  ).toBeVisible();
  const saved = await savedPlanner(page);
  const round = saved?.applications.find(
    (application) => application.id === "a3",
  );
  expect(round?.reminder).toBe(false);
  expect(round?.offset).toBe("1 day");
});
