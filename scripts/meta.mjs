import { createHash } from "node:crypto";
import {
  readdirSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
const sceneUUID = "c723c407-96af-4c6d-a138-e4912b9cac8a";
const scriptUUID = "b4669518-dc38-4abc-b85b-2a83c6b50f10";
export function compress(uuid) {
  const hex = uuid.replaceAll("-", ""),
    alphabet =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let out = hex.slice(0, 5);
  for (let i = 5; i < 32; i += 3) {
    const n = parseInt(hex.slice(i, i + 3), 16);
    out += alphabet[n >> 6] + alphabet[n & 63];
  }
  return out;
}
// Minimal SceneAsset structure taken from a successfully imported/built Creator 3.8.8 scene.
// Creator CLI will import and validate it again for this project. Runtime creates all child nodes.
mkdirSync("assets/scenes", { recursive: true });
if (!existsSync("assets/scenes/Main.scene")) {
  const template = JSON.parse(
    readFileSync("scripts/Main.scene.template.json", "utf8"),
  );
  template[1]._id = sceneUUID;
  template[3].__type__ = compress(scriptUUID);
  writeFileSync("assets/scenes/Main.scene", JSON.stringify(template, null, 2));
}
function meta(file, dir = false) {
  if (file.endsWith(".meta") || existsSync(file + ".meta")) return;
  const ext = path.extname(file),
    hash = createHash("md5").update(file.replaceAll("\\", "/")).digest("hex");
  let uuid = `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20)}`;
  if (file.replaceAll("\\", "/").endsWith("/GameManager.ts")) uuid = scriptUUID;
  if (ext === ".scene") uuid = sceneUUID;
  writeFileSync(
    file + ".meta",
    JSON.stringify(
      {
        ver: dir ? "1.2.0" : ext === ".scene" ? "1.1.50" : "4.0.24",
        importer: dir ? "directory" : ext === ".scene" ? "scene" : "typescript",
        imported: true,
        uuid,
        files: ext === ".scene" ? [".json"] : [],
        subMetas: {},
        userData: {},
      },
      null,
      2,
    ),
  );
}
function walk(folder) {
  for (const entry of readdirSync(folder, { withFileTypes: true })) {
    const file = path.join(folder, entry.name);
    meta(file, entry.isDirectory());
    if (entry.isDirectory()) walk(file);
  }
}
walk("assets");
console.log("Creator scene and stable script metadata ready.");
