// Serve the GitHub Pages export (dist/pages) the way GitHub Pages does, for
// browser tests: files live under the base path, `/x` resolves to `x`,
// `x.html` or `x/index.html`, and anything else gets 404.html with a 404.
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join } from "node:path";

const root = new URL("../dist/pages/", import.meta.url).pathname;
const basePath = process.env.ENCORE_BASE_PATH ?? "";
const port = Number(process.env.PORT ?? 4173);
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".json": "application/json",
  ".txt": "text/plain",
};

if (!existsSync(join(root, "index.html"))) {
  console.error("dist/pages is missing. Run `pnpm build:pages` first.");
  process.exit(1);
}

const isFile = (path) => existsSync(path) && statSync(path).isFile();

createServer((request, response) => {
  const pathname = decodeURIComponent(
    new URL(request.url ?? "/", "http://localhost").pathname,
  );
  if (!pathname.startsWith(basePath + "/")) {
    response.writeHead(404).end();
    return;
  }
  const file = join(root, pathname.slice(basePath.length));
  const match = [file, file + ".html", join(file, "index.html")].find(isFile);
  const served = match ?? join(root, "404.html");
  response.writeHead(match ? 200 : 404, {
    "content-type": types[extname(served)] ?? "application/octet-stream",
  });
  createReadStream(served).pipe(response);
}).listen(port, () => {
  console.log(`Serving dist/pages at http://localhost:${port}${basePath}/`);
});
