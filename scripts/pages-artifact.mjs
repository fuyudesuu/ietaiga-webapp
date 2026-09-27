// Assemble the static export (`ENCORE_STATIC_EXPORT=1` build) into a folder
// that GitHub Pages can serve below ENCORE_BASE_PATH.
import {
  cpSync,
  existsSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

const source = "dist/client";
const target = "dist/pages";
const basePath = process.env.ENCORE_BASE_PATH ?? "";

if (!existsSync(path.join(source, "index.html"))) {
  throw new Error(
    `No static export in ${source}. Run the build with ENCORE_STATIC_EXPORT=1 first.`,
  );
}

rmSync(target, { recursive: true, force: true });
cpSync(source, target, { recursive: true });

// vinext writes hashed assets under the base path; Pages already serves the
// artifact root at the base path, so lift them to the root.
if (basePath) {
  const nested = path.join(target, basePath);
  for (const entry of readdirSync(nested))
    renameSync(path.join(nested, entry), path.join(target, entry));
  rmSync(path.join(target, basePath.split("/").filter(Boolean)[0]), {
    recursive: true,
    force: true,
  });
}

// Cloudflare-only header rules have no meaning on Pages.
rmSync(path.join(target, "_headers"), { force: true });

// "/concerts" is both concerts.html and a concerts/ folder; give the folder an
// index so the trailing-slash form resolves too.
for (const entry of readdirSync(target)) {
  if (!entry.endsWith(".html")) continue;
  const folder = path.join(target, entry.slice(0, -".html".length));
  if (existsSync(folder) && statSync(folder).isDirectory()) {
    cpSync(path.join(target, entry), path.join(folder, "index.html"));
  }
}

// Serve folders that start with "_" (such as _next) as-is.
writeFileSync(path.join(target, ".nojekyll"), "");
console.log(
  `GitHub Pages artifact ready in ${target} (base path "${basePath || "/"}").`,
);
