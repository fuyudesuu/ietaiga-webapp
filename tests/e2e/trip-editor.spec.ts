import { expect, test } from "@playwright/test";
import {
  choose,
  currentRoute,
  editorDialog,
  openRoute,
  save,
  savedNotice,
  savedPlanner,
} from "./helpers";

// Characterization of the trip editor.

test("edit opens with the trip's values and saves in place", async ({
  page,
}) => {
  await openRoute(page, "/trips/autumn");
  await page.getByRole("button", { name: "Edit trip" }).click();
  const dialog = editorDialog(page);
  await expect(dialog.getByRole("heading")).toHaveText("Edit trip");
  await expect(dialog.getByLabel("Trip name *")).toHaveValue(
    "A little Tokyo, a lot of live music",
  );
  await expect(dialog.getByLabel("Destinations *")).toHaveValue(
    "Tokyo · Yokohama",
  );
  await expect(dialog.getByLabel("Start date *")).toHaveValue("2026-10-09");
  await expect(dialog.getByLabel("End date *")).toHaveValue("2026-10-13");
  await expect(
    dialog.getByRole("combobox", { name: "Trip status" }),
  ).toHaveText("Confirmed");
  await expect(dialog.getByAltText("Selected card cover")).toBeVisible();

  await dialog.getByLabel("Destinations *").fill("Tokyo");
  await choose(page, "Trip status", "Completed");
  await save(page);

  await expect(dialog).toBeHidden();
  await expect(page.getByText(savedNotice)).toBeVisible();
  expect(currentRoute(page)).toBe("/trips/autumn");
  const saved = await savedPlanner(page);
  expect(saved?.trips.find((trip) => trip.id === "autumn")).toEqual({
    id: "autumn",
    title: "A little Tokyo, a lot of live music",
    cities: "Tokyo",
    start: "2026-10-09",
    end: "2026-10-13",
    status: "Completed",
    notes:
      "Five days, three stages. Leave some time for record shops in Shimokitazawa.",
    image: "/tokyo.jpg",
  });
});

test("a new trip is saved before opening its page", async ({ page }) => {
  await openRoute(page, "/trips");
  await page.getByRole("button", { name: "Create trip" }).click();
  const dialog = editorDialog(page);
  await expect(dialog.getByRole("heading")).toHaveText("Add trip");
  await expect(
    dialog.getByRole("combobox", { name: "Trip status" }),
  ).toHaveText("Tentative");
  await dialog.getByLabel("Trip name *").fill("Spring in Nagoya");
  await dialog.getByLabel("Destinations *").fill("Nagoya");
  await dialog.getByLabel("Start date *").fill("2027-03-01");
  await dialog.getByLabel("End date *").fill("2027-03-01");
  await save(page);

  await page.waitForURL(/\/trips\/view\?id=/);
  const id = new URL(page.url()).searchParams.get("id");
  await expect(page.locator("main h1").first()).toHaveText("Spring in Nagoya");
  const saved = await savedPlanner(page);
  expect(saved?.trips.at(-1)).toEqual({
    id,
    title: "Spring in Nagoya",
    cities: "Nagoya",
    start: "2027-03-01",
    end: "2027-03-01",
    status: "Tentative",
    notes: "",
    image: "",
  });
});

test("an end date before the start is rejected", async ({ page }) => {
  await openRoute(page, "/trips/autumn");
  await page.getByRole("button", { name: "Edit trip" }).click();
  const dialog = editorDialog(page);
  await dialog.getByLabel("End date *").fill("2026-10-08");
  await save(page);
  await expect(dialog.getByRole("alert")).toHaveText(
    "Trip end must be on or after its start date.",
  );
  await expect(dialog.getByLabel("End date *")).toHaveValue("2026-10-08");
  expect(await savedPlanner(page)).toBeNull();
});
