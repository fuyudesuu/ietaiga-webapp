// Fail when a component uses a type, weight, letter-spacing, line-height,
// radius or spacing value outside the token scale (DECISIONS.md, 2026-10-26).
// Positional offsets and spacing above 48px are layout geometry, not scale.
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const files = execFileSync(
  "git",
  ["ls-files", "app", "components/encore-ui", "components/shell", "features"],
  { encoding: "utf8" },
)
  .split("\n")
  .filter((file) => file.endsWith(".tsx"));

const start = String.raw`(?<=[\s"'\`:])`;
const end = String.raw`(?=!?[\s"'\`])`;
const spacing = String.raw`-?(?:p[xytblr]?|m[xytblr]?|gap(?:-[xy])?|space-[xy])-`;
const rules = [
  ["font size", String.raw`text-\[(?:length:)?[\d.]+(?:rem|px|em)\]`],
  ["font weight", String.raw`font-\[\d+\]`],
  ["letter-spacing", String.raw`tracking-\[[^\]]+\]`],
  ["line height", String.raw`leading-(?:\[[^\]]+\]|\d+)`],
  ["radius", String.raw`rounded(?:-[a-z]+)?-\[\d+px\]`],
  ["spacing", spacing + String.raw`\[(?:[1-9]|[1-3]\d|4[0-8])px\]`],
  ["spacing", spacing + String.raw`(?:1\.25|3\.5|4\.5|7|9|11)`],
].map(([name, pattern]) => [name, new RegExp(start + pattern + end, "g")]);

const problems = [];
for (const file of files) {
  readFileSync(file, "utf8")
    .split("\n")
    .forEach((line, index) => {
      for (const [name, pattern] of rules)
        for (const match of line.matchAll(pattern))
          problems.push(`${file}:${index + 1}  ${name}: ${match[0]}`);
    });
}
if (problems.length) {
  console.error("Off-scale values (use the tokens in app/globals.css):");
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log(`Token scale: ${files.length} files clean.`);
