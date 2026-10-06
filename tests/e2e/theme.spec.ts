import { expect, test } from "@playwright/test";
import { openRoute } from "./helpers";

// A saved dark theme is applied by the inline boot script before the app's
// scripts run, so pages never flash light while they load.

test("a saved dark theme paints before the app loads", async ({ page }) => {
  await openRoute(page, "/settings");
  await page.getByRole("radio", { name: "Dark" }).click({ force: true });
  await expect(page.locator("html")).toHaveClass(/\bdark\b/);

  await page.route(/\.js$/, (route) => route.abort());
  await page.goto(page.url().replace(/settings$/, "concerts"));
  await expect(page.locator("html")).toHaveClass(/\bdark\b/);
  const background = await page.evaluate(
    () => getComputedStyle(document.body).backgroundColor,
  );
  expect(background).not.toBe("rgb(255, 255, 255)");
});
