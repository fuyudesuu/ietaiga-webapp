import { readFile } from "node:fs/promises";
import ts from "typescript";

// Load a production TypeScript module for tests, rather than duplicating it.
// Only type imports may be relative: the module is transpiled on its own.
export async function loadTypeScript(path, base) {
  const source = await readFile(new URL(path, base), "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  return import(
    `data:text/javascript;base64,${Buffer.from(output).toString("base64")}`
  );
}
