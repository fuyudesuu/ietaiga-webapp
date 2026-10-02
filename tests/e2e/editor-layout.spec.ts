import { expect, test, type Page } from "@playwright/test";
import { editorDialog, openRoute } from "./helpers";

// The editor dialog fits the screen: it never scrolls sideways, and only the
// fields scroll while the heading, close button and actions stay in view.

const sizes = [
  { name: "320px phone", width: 320, height: 568 },
  { name: "390px phone", width: 390, height: 664 },
  { name: "desktop", width: 1280, height: 720 },
];

async function expectFitsAndScrollsFieldsOnly(page: Page) {
  const dialog = editorDialog(page);
  const fields = dialog.locator("form > div").first();
  const viewport = page.viewportSize();
  if (!viewport) throw new Error("The test needs a fixed viewport.");

  const widths = await dialog.evaluate((element) => ({
    scroll: element.scrollWidth,
    client: element.clientWidth,
  }));
  expect(widths.scroll).toBeLessThanOrEqual(widths.client);

  // Scroll the fields to the end: the actions and close button stay visible.
  await fields.evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  expect(await fields.evaluate((element) => element.scrollTop)).toBeGreaterThan(
    0,
  );
  for (const control of [
    dialog.getByRole("button", { name: "Save changes" }),
    dialog.getByRole("button", { name: "Cancel" }),
    dialog.getByRole("button", { name: "Close" }),
    dialog.getByRole("heading"),
  ]) {
    await expect(control).toBeInViewport({ ratio: 1 });
  }
  const box = await dialog.boundingBox();
  expect(box && box.y + box.height).toBeLessThanOrEqual(viewport.height);
}

for (const size of sizes) {
  test.describe(size.name, () => {
    test.use({ viewport: { width: size.width, height: size.height } });

    test("concert editor with a long trip name", async ({ page }) => {
      await openRoute(page, "/concerts/love");
      await page.getByRole("button", { name: "Edit concert" }).click();
      await expectFitsAndScrollsFieldsOnly(page);
    });

    test("ticket application editor", async ({ page }) => {
      await openRoute(page, "/concerts/love");
      await page.getByRole("button", { name: "+ Add round" }).click();
      await expectFitsAndScrollsFieldsOnly(page);
    });
  });
}
