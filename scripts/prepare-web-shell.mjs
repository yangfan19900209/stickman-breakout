import { cpSync, readFileSync } from "node:fs";
import path from "node:path";
const root = path.resolve(import.meta.dirname, "..");
const manifest = JSON.parse(
  readFileSync(path.join(root, "web-shell/manifest.webmanifest"), "utf8"),
);
if (manifest.start_url !== "./" || manifest.scope !== "./")
  throw Error("PWA must support a GitHub Pages subpath.");
cpSync(path.join(root, "web-shell"), path.join(root, "build/web-mobile"), {
  recursive: true,
});
console.log(
  "Web shell, manifest, icons and offline worker copied to Creator output.",
);
