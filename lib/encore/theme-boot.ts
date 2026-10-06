import { DEMO_STORAGE_KEY } from "./demo-storage";
import type { Preferences } from "./model";

/**
 * An inline script for <head> that applies the saved theme and "Reduce
 * transparency" classes before the first paint, so a dark-mode page never
 * flashes light while React loads. `PlannerProvider` keeps them in sync
 * afterwards. Unreadable storage falls back to the given defaults.
 */
export function themeBootScript(
  defaults: Pick<Preferences, "theme" | "solid">,
) {
  return `(function () {
  var theme = ${JSON.stringify(defaults.theme)};
  var solid = ${JSON.stringify(defaults.solid)};
  try {
    var saved = JSON.parse(localStorage.getItem(${JSON.stringify(DEMO_STORAGE_KEY)}) || "null");
    var preferences = saved && saved.data && saved.data.preferences;
    if (preferences) {
      if (["light", "dark", "system"].indexOf(preferences.theme) !== -1) theme = preferences.theme;
      solid = preferences.solid === true;
    }
  } catch (error) {}
  var dark = theme === "dark" || (theme === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.classList.toggle("solid", solid);
})();`;
}
