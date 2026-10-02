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

// Characterization: records how the concert editor behaves, so moving it
// between modules cannot silently change it.

test("edit opens with the concert's current values", async ({ page }) => {
  await openRoute(page, "/concerts/love");
  await page.getByRole("button", { name: "Edit concert" }).click();
  const dialog = editorDialog(page);
  await expect(dialog.getByRole("heading")).toHaveText("Edit concert");
  await expect(dialog.getByLabel("Concert / artist *")).toHaveValue(
    "Love Live!",
  );
  await expect(dialog.getByLabel("Performance name")).toHaveValue(
    "Our next chapter · Live in Yokohama",
  );
  await expect(dialog.getByLabel("Concert date (optional)")).toHaveValue(
    "2026-10-11",
  );
  await expect(dialog.getByLabel("Start time · JST (optional)")).toHaveValue(
    "18:00",
  );
  await expect(dialog.getByLabel("Venue")).toHaveValue("K Arena Yokohama");
  await expect(dialog.getByLabel("City")).toHaveValue("Yokohama");
  await expect(
    dialog.getByRole("combobox", { name: "Attach to a trip" }),
  ).toHaveText("Tokyo · Yokohama · A little Tokyo, a lot of live music");
  await expect(dialog.getByLabel("Notes")).toHaveValue(
    "Sample performance. Result needs to be checked manually.",
  );
  await expect(dialog.getByAltText("Selected card cover")).toBeVisible();
});

test("editing saves in place and keeps the record's identity", async ({
  page,
}) => {
  await openRoute(page, "/concerts/love");
  await page.getByRole("button", { name: "Edit concert" }).click();
  const dialog = editorDialog(page);
  await dialog.getByLabel("Concert / artist *").fill("  Love Live! Encore  ");
  await dialog.getByLabel("Concert date (optional)").fill("");
  await choose(page, "Attach to a trip", "No trip yet");
  await save(page);

  await expect(dialog).toBeHidden();
  await expect(page.getByText(savedNotice)).toBeVisible();
  expect(currentRoute(page)).toBe("/concerts/love");
  const saved = await savedPlanner(page);
  expect(saved?.concerts.find((concert) => concert.id === "love")).toEqual({
    id: "love",
    title: "Love Live! Encore",
    subtitle: "Our next chapter · Live in Yokohama",
    date: "",
    time: "18:00",
    venue: "K Arena Yokohama",
    city: "Yokohama",
    zone: "Asia/Tokyo",
    tripId: "",
    color: "pink",
    notes: "Sample performance. Result needs to be checked manually.",
    image: "/concert-stage.jpg",
  });
});

test("a new concert is saved before opening its page", async ({ page }) => {
  await openRoute(page, "/concerts");
  await page.getByRole("button", { name: "Add concert" }).first().click();
  const dialog = editorDialog(page);
  await expect(dialog.getByRole("heading")).toHaveText("Add concert");
  await expect(dialog.getByLabel("Concert date (optional)")).toHaveValue("");
  await expect(
    dialog.getByRole("combobox", { name: "Attach to a trip" }),
  ).toHaveText("No trip yet");
  await dialog.getByLabel("Concert / artist *").fill("Characterization Live");
  await save(page);

  await page.waitForURL(/\/concerts\/view\?id=/);
  const id = new URL(page.url()).searchParams.get("id");
  await expect(page.locator("main h1").first()).toHaveText(
    "Characterization Live",
  );
  const saved = await savedPlanner(page);
  expect(saved?.concerts.at(-1)).toEqual({
    id,
    title: "Characterization Live",
    subtitle: "",
    date: "",
    time: "",
    venue: "To be announced",
    city: "Japan",
    zone: "Asia/Tokyo",
    tripId: "",
    color: "blue",
    notes: "",
    image: "",
  });
});

test("adding a concert from a trip preselects that trip", async ({ page }) => {
  await openRoute(page, "/trips/autumn");
  await page.getByRole("button", { name: "Concert", exact: true }).click();
  await expect(
    editorDialog(page).getByRole("combobox", { name: "Attach to a trip" }),
  ).toHaveText("Tokyo · Yokohama · A little Tokyo, a lot of live music");
});

test("a blank title is rejected and the entries are kept", async ({ page }) => {
  await openRoute(page, "/concerts");
  await page.getByRole("button", { name: "Add concert" }).first().click();
  const dialog = editorDialog(page);
  await dialog.getByLabel("Concert / artist *").fill("   ");
  await dialog.getByLabel("Venue").fill("Budokan");
  await save(page);

  await expect(dialog.getByRole("alert")).toHaveText(
    "A concert title is required.",
  );
  await expect(dialog.getByLabel("Venue")).toHaveValue("Budokan");
  expect(await savedPlanner(page)).toBeNull();
});

test("closing asks before discarding changes", async ({ page }) => {
  await openRoute(page, "/concerts/love");
  const dialog = editorDialog(page);

  // Untouched: closes straight away.
  await page.getByRole("button", { name: "Edit concert" }).click();
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(dialog).toBeHidden();

  // Changed: asks first; "Keep editing" returns to the entries.
  await page.getByRole("button", { name: "Edit concert" }).click();
  await dialog.getByLabel("Venue").fill("Budokan");
  await page.keyboard.press("Escape");
  const prompt = page.getByRole("alertdialog");
  await expect(prompt.getByText("Discard your changes?")).toBeVisible();
  await prompt.getByRole("button", { name: "Keep editing" }).click();
  await expect(dialog.getByLabel("Venue")).toHaveValue("Budokan");

  // "Discard changes" closes without saving.
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await prompt.getByRole("button", { name: "Discard changes" }).click();
  await expect(dialog).toBeHidden();
  expect(await savedPlanner(page)).toBeNull();
});

test("a chosen photo is saved with the concert, and can be removed", async ({
  page,
}) => {
  await openRoute(page, "/concerts/love");
  await page.getByRole("button", { name: "Edit concert" }).click();
  const dialog = editorDialog(page);

  await dialog.getByLabel("Card image").setInputFiles({
    name: "notes.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("not an image"),
  });
  await expect(dialog.getByRole("status")).toHaveText(
    "Choose a JPG, PNG or WebP photo.",
  );

  await dialog.getByLabel("Card image").setInputFiles({
    name: "cover.png",
    mimeType: "image/png",
    buffer: tinyPng,
  });
  await expect(dialog.getByRole("status")).toHaveText(
    "Saved with this item in your browser.",
  );
  await expect(dialog.getByAltText("Selected card cover")).toHaveAttribute(
    "src",
    /^data:image\/jpeg;base64,/,
  );
  await save(page);
  await expect(dialog).toBeHidden();
  let saved = await savedPlanner(page);
  expect(saved?.concerts.find((c) => c.id === "love")?.image).toMatch(
    /^data:image\/jpeg;base64,/,
  );

  await page.getByRole("button", { name: "Edit concert" }).click();
  await dialog.getByRole("button", { name: "Remove image" }).click();
  await expect(dialog.getByAltText("Selected card cover")).toHaveCount(0);
  await save(page);
  await expect(dialog).toBeHidden();
  saved = await savedPlanner(page);
  expect(saved?.concerts.find((c) => c.id === "love")?.image).toBe("");
});

// A 2×2 PNG.
const tinyPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFklEQVR4nGNk+M/AwMDAxMDAwMDAAAANHQEDasKb6QAAAABJRU5ErkJggg==",
  "base64",
);
