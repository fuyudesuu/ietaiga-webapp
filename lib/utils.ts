import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// The app's type scale (`--text-*` in app/globals.css). Without it, class
// merging would read e.g. `text-small` as a colour and drop the real colour.
// Note: a font-size class passed later (e.g. via className) also drops an
// earlier `leading-*`, because font-size utilities set line height too.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: [
        "caption",
        "label",
        "small",
        "body",
        "lead",
        "title",
        "heading",
        "display",
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
