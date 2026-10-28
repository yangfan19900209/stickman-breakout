const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { PNG } = require("pngjs");
const manifest = JSON.parse(fs.readFileSync("art/manifest.json"));
test("comic pack preserves original RGBA sources and every frame fits padded runtime atlas", () => {
  const atlas = PNG.sync.read(
    fs.readFileSync("assets/resources/comic/comic.png"),
  );
  assert.deepEqual([atlas.width, atlas.height], manifest.textureSize);
  const ids = new Set();
  for (const f of manifest.frames) {
    assert.ok(!ids.has(f.id));
    ids.add(f.id);
    assert.equal(f.qa, "reviewed");
    const [x, y, w, h] = f.atlas;
    assert.ok(
      x >= 4 && y >= 4 && x + w + 2 < atlas.width && y + h + 2 < atlas.height,
    );
    assert.ok(f.anchor.every(Number.isFinite));
    const image = PNG.sync.read(fs.readFileSync(f.file));
    assert.deepEqual([image.width, image.height], f.size);
    // The artist's black ink must remain opaque, with transparent exterior.
    let ink = 0,
      transparent = 0;
    for (let n = 0; n < image.data.length; n += 4) {
      if (image.data[n] < 60 && image.data[n + 3] > 150) ink++;
      if (image.data[n + 3] === 0) transparent++;
    }
    if (!f.id.startsWith("background."))
      assert.ok(ink > 3, `${f.id}: lost black outline`);
    assert.ok(transparent > 0, `${f.id}: lost alpha`);
    for (const g of manifest.frames) {
      if (f.id >= g.id) continue;
      const [a, b, c, d] = g.atlas;
      assert.ok(
        x + w + 4 <= a || a + c + 4 <= x || y + h + 4 <= b || b + d + 4 <= y,
        `${f.id}/${g.id}: no sampling gutter`,
      );
    }
  }
  assert.ok(manifest.textureBytes < 768 * 1024, "single atlas compressed budget");
  assert.ok(
    manifest.unavailable.some(
      (x) => x.id === "boss.colossus" && x.qa === "needs-remake",
    ),
  );
  assert.equal(manifest.clips["player.crouch-walk"].length, 6);
  assert.ok(!manifest.frames.some((x) => x.id.startsWith("rig.")));
});
test("all source crops are valid; original atlas hashes are reproducible", () => {
  const { createHash } = require("node:crypto");
  for (const [key, source] of Object.entries(manifest.sources)) {
    const bytes = fs.readFileSync(source.file),
      image = PNG.sync.read(bytes);
    assert.deepEqual([image.width, image.height], source.size);
    assert.equal(
      createHash("sha256").update(bytes).digest("hex"),
      source.sha256,
    );
    for (const f of manifest.frames.filter((f) => f.source === key)) {
      const [l, t, r, b] = f.crop;
      assert.ok(
        l >= 0 &&
          t >= 0 &&
          r <= image.width &&
          b <= image.height &&
          r > l &&
          b > t,
      );
    }
  }
});
