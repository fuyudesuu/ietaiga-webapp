import { expect, test } from "@playwright/test";
import { currentRoute, openRoute } from "./helpers";

// On phones, the Overview lists every plan; each row opens its card in the
// Concerts or Trips card stack.

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

test("the filter narrows the list to trips", async ({ page }) => {
  await openRoute(page, "/");
  const plans = page.getByRole("link", { name: /Tokyo · Yokohama|Love Live!/ });
  await expect(plans).toHaveCount(2);
  await page.getByRole("button", { name: /^Trips/ }).click();
  await expect(page.getByRole("button", { name: /^Trips/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(plans).toHaveCount(1);
  await expect(page.getByRole("link", { name: /Love Live!/ })).toHaveCount(0);
});

test("a concert row opens its card on the Concerts page", async ({ page }) => {
  await openRoute(page, "/");
  await page.getByRole("link", { name: /Love Live!/ }).click();
  await expect.poll(() => currentRoute(page)).toBe("/concerts?open=love");
  await expect(
    page.getByRole("button", { name: /^Love Live!.*Close details$/ }),
  ).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("button", { name: "Done" })).toBeVisible();
});

test("a trip card's concert opens on the Concerts page", async ({ page }) => {
  await openRoute(page, "/trips?open=autumn");
  await page
    .locator("#wallet-item-details")
    .getByRole("button", { name: /Love Live!/ })
    .click();
  await expect.poll(() => currentRoute(page)).toBe("/concerts?open=love");
});
