// Visual regression check for styling refactors (e.g. the move to Tailwind).
//
//   node scripts/visual-snapshots.mjs capture <dir>   screenshot every screen
//   node scripts/visual-snapshots.mjs compare <a> <b> list screenshots that differ
//                                                     (beyond anti-aliasing noise)
//
// Captures run against the Pages export (`pnpm build:pages`), served by
// scripts/serve-pages.mjs on PORT (default 4173) under ENCORE_BASE_PATH.
// Motion is reduced so screenshots are deterministic: two captures of the
// same build are byte-identical. Hover and focus states are not covered.
import { chromium } from "@playwright/test";
import { mkdirSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const [command, first, second] = process.argv.slice(2);
const origin = `http://localhost:${process.env.PORT ?? 4173}`;
const base = origin + (process.env.ENCORE_BASE_PATH ?? "");

const routes = [
  "/",
  "/trips",
  "/trips/autumn",
  "/trips/winter",
  "/concerts",
  "/concerts/love",
  "/concerts/wish",
  "/settings",
];
const viewports = [
  [320, 640],
  [390, 844],
  [768, 1024],
  [1280, 800],
  [1600, 900],
];
const themes = [
  { name: "light", setup: null },
  { name: "dark", setup: "dark" },
  { name: "solid", setup: "solid" },
];

// Interactive states, captured at one phone and one desktop width.
const states = [
  {
    name: "concert-editor",
    route: "/concerts/love",
    open: (page) =>
      page.getByRole("button", { name: "Edit concert" }).first().click(),
  },
  {
    name: "hotel-editor-error",
    route: "/trips/autumn",
    open: async (page) => {
      await page
        .getByRole("button", { name: "Add hotel stay" })
        .first()
        .click();
      await page.getByLabel("Hotel name *").fill("Test");
      await page.getByLabel("Check-in date *").fill("2026-10-12");
      await page.getByLabel("Check-out date *").fill("2026-10-11");
      await page.getByRole("button", { name: "Save changes" }).click();
    },
  },
  {
    name: "reminder-editor",
    route: "/concerts/love",
    open: (page) =>
      page.getByRole("button", { name: "1 day before" }).first().click(),
  },
  {
    name: "wallet-card-open",
    route: "/",
    phoneOnly: true,
    open: (page) =>
      page
        .getByRole("button", { name: /Open details$/ })
        .last()
        .click(),
  },
  {
    name: "wallet-trips-tab",
    route: "/",
    phoneOnly: true,
    open: (page) => page.getByRole("tab", { name: /Trips/ }).click(),
  },
];

async function applyTheme(page, setup) {
  if (!setup) return;
  await page.goto(base + "/settings");
  if (setup === "dark")
    await page.locator('[role=radio][value="dark"]').click({ force: true });
  if (setup === "solid") await page.locator("#solid-setting").click();
  await page.waitForTimeout(100);
}

async function settle(page) {
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(150);
}

async function capture(dir) {
  mkdirSync(dir, { recursive: true });
  const browser = await chromium.launch();
  let count = 0;
  for (const theme of themes) {
    for (const [width, height] of viewports) {
      const context = await browser.newContext({
        viewport: { width, height },
        reducedMotion: "reduce",
        deviceScaleFactor: 1,
        hasTouch: width < 768,
      });
      const page = await context.newPage();
      await applyTheme(page, theme.setup);
      for (const route of routes) {
        await page.goto(base + route);
        await settle(page);
        const name = `${theme.name}-${width}${route.replaceAll("/", "_") || "_home"}`;
        await page.screenshot({
          path: join(dir, name + ".png"),
          fullPage: true,
        });
        count++;
      }
      if (width === 390 || width === 1280) {
        for (const state of states) {
          if (state.phoneOnly && width !== 390) continue;
          await page.goto(base + state.route);
          await settle(page);
          await state.open(page);
          // Let focus rings and transitions settle so captures repeat exactly.
          await page.evaluate(() => {
            if (document.activeElement instanceof HTMLElement)
              document.activeElement.blur();
          });
          await page.waitForTimeout(600);
          await page.screenshot({
            path: join(dir, `${theme.name}-${width}-state-${state.name}.png`),
          });
          count++;
        }
      }
      await context.close();
    }
  }
  await browser.close();
  console.log(`Captured ${count} screenshots in ${dir}`);
}

// Pixels whose colour channels differ by more than this count as changed;
// smaller differences are anti-aliasing noise between runs.
const channelTolerance = 16;

async function compare(before, after) {
  const names = readdirSync(before).filter((name) => name.endsWith(".png"));
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const changed = [];
  for (const name of names) {
    const a = readFileSync(join(before, name));
    const b = readFileSync(join(after, name));
    if (a.equals(b)) continue;
    const result = await page.evaluate(
      async ({ a, b, tolerance }) => {
        const load = async (data) => {
          const image = new Image();
          image.src = "data:image/png;base64," + data;
          await image.decode();
          const canvas = new OffscreenCanvas(image.width, image.height);
          const context = canvas.getContext("2d");
          context.drawImage(image, 0, 0);
          return context.getImageData(0, 0, image.width, image.height);
        };
        const [first, second] = [await load(a), await load(b)];
        if (first.width !== second.width || first.height !== second.height)
          return {
            pixels: -1,
            size: `${first.width}x${first.height} vs ${second.width}x${second.height}`,
          };
        let pixels = 0;
        for (let i = 0; i < first.data.length; i += 4) {
          for (let channel = 0; channel < 3; channel++) {
            if (
              Math.abs(first.data[i + channel] - second.data[i + channel]) >
              tolerance
            ) {
              pixels++;
              break;
            }
          }
        }
        return { pixels };
      },
      {
        a: a.toString("base64"),
        b: b.toString("base64"),
        tolerance: channelTolerance,
      },
    );
    if (result.pixels !== 0) changed.push({ name, ...result });
  }
  await browser.close();
  console.log(
    `${names.length - changed.length} match, ${changed.length} different`,
  );
  for (const { name, pixels, size } of changed)
    console.log(`  ${name}: ${size ?? pixels + " pixels"}`);
  process.exitCode = changed.length ? 1 : 0;
}

if (command === "capture" && first) await capture(first);
else if (command === "compare" && first && second) await compare(first, second);
else {
  console.error(
    "Usage: node scripts/visual-snapshots.mjs capture <dir> | compare <a> <b>",
  );
  process.exitCode = 2;
}
