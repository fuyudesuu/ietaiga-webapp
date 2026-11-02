// Database policy tests against a real, throwaway PostgreSQL server.
//
//   pnpm test:db
//
// Starts a temporary cluster, applies tests/db/supabase-shim.sql (the parts of
// Supabase the policies use), every migration in supabase/migrations, then
// runs each tests/db/*.test.sql as the API roles (anon / authenticated).
// Needs PostgreSQL 15+ server binaries: on PATH, under /usr/lib/postgresql,
// or in PG_BIN. When run as root, the server runs as the "postgres" user.
import { execFileSync, spawnSync } from "node:child_process";
import {
  chmodSync,
  existsSync,
  mkdtempSync,
  readdirSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;

function findBin() {
  if (process.env.PG_BIN) return process.env.PG_BIN;
  const which = spawnSync("sh", ["-c", "command -v initdb"], {
    encoding: "utf8",
  });
  if (which.status === 0) return join(which.stdout.trim(), "..");
  const base = "/usr/lib/postgresql";
  const versions = existsSync(base)
    ? readdirSync(base)
        .filter((version) => Number(version) >= 15)
        .sort((a, b) => Number(b) - Number(a))
    : [];
  if (versions.length) return join(base, versions[0], "bin");
  throw new Error(
    "PostgreSQL 15+ server binaries not found. Install them or set PG_BIN.",
  );
}

const bin = findBin();
const asRoot = process.getuid?.() === 0;
const dir = mkdtempSync(join(tmpdir(), "encore-db-"));
const data = join(dir, "data");
const port = String(54000 + Math.floor(Math.random() * 1000));

// initdb and postgres refuse to run as root.
function run(command, args, options = {}) {
  const [file, argv] = asRoot
    ? ["runuser", ["-u", "postgres", "--", join(bin, command), ...args]]
    : [join(bin, command), args];
  return execFileSync(file, argv, { encoding: "utf8", ...options });
}

if (asRoot) {
  chmodSync(dir, 0o777);
  execFileSync("chown", ["postgres", dir]);
}
let started = false;
let failed = false;
try {
  run("initdb", ["-D", data, "-U", "postgres", "--auth=trust", "-E", "UTF8"], {
    stdio: "ignore",
  });
  run(
    "pg_ctl",
    [
      "-D",
      data,
      "-o",
      `-p ${port} -k ${dir} -c listen_addresses=''`,
      "-w",
      "start",
    ],
    { stdio: "ignore" },
  );
  started = true;
  const psql = (file) =>
    spawnSync(
      join(bin, "psql"),
      [
        "-h",
        dir,
        "-p",
        port,
        "-U",
        "postgres",
        "-d",
        "postgres",
        "-X",
        "-q",
        "-v",
        "ON_ERROR_STOP=1",
        "-f",
        file,
      ],
      { encoding: "utf8" },
    );
  const migrations = readdirSync(join(root, "supabase/migrations"))
    .filter((file) => file.endsWith(".sql"))
    .sort()
    .map((file) => join(root, "supabase/migrations", file));
  const setup = [
    join(root, "tests/db/supabase-shim.sql"),
    ...migrations,
    join(root, "tests/db/helpers.sql"),
  ];
  for (const file of setup) {
    const result = psql(file);
    if (result.status !== 0) {
      console.error(`Setup failed in ${file}:\n${result.stderr}`);
      failed = true;
      break;
    }
  }
  if (!failed) {
    const tests = readdirSync(join(root, "tests/db"))
      .filter((file) => file.endsWith(".test.sql"))
      .sort();
    for (const test of tests) {
      const result = psql(join(root, "tests/db", test));
      const passed = (result.stderr.match(/NOTICE: {2}ok - /g) ?? []).length;
      const notes = result.stderr
        .split("\n")
        .filter((line) => line.includes("ok - "))
        .map((line) => line.replace(/^.*NOTICE: {2}/, "  "));
      console.log(`${test}\n${notes.join("\n")}`);
      if (result.status !== 0) {
        failed = true;
        console.error(
          result.stderr
            .split("\n")
            .filter((line) => !line.includes("NOTICE"))
            .join("\n"),
        );
      }
      console.log(
        `${test}: ${passed} passed${result.status ? ", FAILED" : ""}`,
      );
    }
  }
} finally {
  if (started)
    run("pg_ctl", ["-D", data, "-m", "immediate", "stop"], { stdio: "ignore" });
  rmSync(dir, { recursive: true, force: true });
}
process.exit(failed ? 1 : 0);
