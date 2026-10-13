import ts from "typescript";
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
// Transpile only; the separate strict typecheck catches type errors against official cc declarations.
function walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, e.name);
    if (e.isDirectory()) walk(file);
    else if (file.endsWith(".ts")) {
      const dest = path.join(".test-build", file.replace(/\.ts$/, ".js"));
      mkdirSync(path.dirname(dest), { recursive: true });
      writeFileSync(
        dest,
        ts.transpileModule(readFileSync(file, "utf8"), {
          compilerOptions: {
            target: ts.ScriptTarget.ES2020,
            module: ts.ModuleKind.CommonJS,
            experimentalDecorators: true,
          },
        }).outputText,
      );
    }
  }
}
walk("assets/scripts");
writeFileSync(".test-build/package.json", '{"type":"commonjs"}');
const tests = readdirSync("tests")
  .filter((f) => f.endsWith(".test.cjs"))
  .map((f) => `tests/${f}`);
const r = spawnSync(process.execPath, ["--test", ...tests], {
  stdio: "inherit",
});
process.exitCode = r.status ?? 1;
