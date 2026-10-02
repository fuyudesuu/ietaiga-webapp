import { expect, type Page } from "@playwright/test";
import type { PlannerState } from "@/lib/encore/model";

const basePath = process.env.ENCORE_BASE_PATH ?? "";

/** Open an app route, e.g. "/concerts/love", under the Pages base path. */
export async function openRoute(page: Page, route: string) {
  await page.goto(basePath + route);
  await expect(page.locator("main h1").first()).toBeVisible();
}

/** The path and query of the current page, without the base path. */
export function currentRoute(page: Page) {
  const url = new URL(page.url());
  return url.pathname.slice(basePath.length) + url.search;
}

/** The planner state saved in this browser, or null before the first save. */
export async function savedPlanner(page: Page): Promise<PlannerState | null> {
  const saved = await page.evaluate(() =>
    localStorage.getItem("encore-mobile-demo-v1"),
  );
  return saved ? (JSON.parse(saved) as { data: PlannerState }).data : null;
}

export function editorDialog(page: Page) {
  return page.getByRole("dialog");
}

/** Pick an option in one of the editor's select menus. */
export async function choose(page: Page, label: string, option: string) {
  await editorDialog(page).getByRole("combobox", { name: label }).click();
  await page.getByRole("option", { name: option, exact: true }).click();
}

export async function save(page: Page) {
  await editorDialog(page)
    .getByRole("button", { name: /^Save (changes|reminder)$/ })
    .click();
}

export const savedNotice = "Your changes are saved in this browser.";
