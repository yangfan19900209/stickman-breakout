const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  viewportLayout,
} = require("../.test-build/assets/scripts/ui/ViewportLayout.js");
const {
  controlLayout,
} = require("../.test-build/assets/scripts/ui/ControlLayout.js");
const {
  CameraFollow,
} = require("../.test-build/assets/scripts/camera/CameraFollow.js");
const {
  ParticlePool,
} = require("../.test-build/assets/scripts/combat/ParticlePool.js");
test("portrait has its own full-height viewport, landscape keeps height and exposes extra width", () => {
  const p = viewportLayout(390, 844),
    l = viewportLayout(844, 390);
  assert.equal(p.portrait, true);
  assert.ok(p.height > 1500);
  assert.equal(p.width, 720);
  assert.equal(l.height, 720);
  assert.ok(l.width > 1500);
});
test("safe area keeps hit regions inside viewport and action buttons apart", () => {
  for (const w of [960, 1280, 1558]) {
    const l = controlLayout(
      { left: 70, right: 70, top: 25, bottom: 20 },
      w,
      720,
    );
    for (const c of Object.values(l)) {
      assert.ok(c.x - c.hit / 2 >= 0);
      assert.ok(c.x + c.hit / 2 <= w);
      assert.ok(c.y - c.hit / 2 >= 20);
    }
    assert.ok(l.shoot.x - l.shoot.hit / 2 > l.jump.x + l.jump.hit / 2);
    assert.ok(l.jump.x - l.jump.hit / 2 > l.grenade.x + l.grenade.hit / 2);
  }
});
test("zoomed camera retains forward space, smooth direction lead, vertical dead zone and arena bounds", () => {
  const c = new CameraFollow();
  c.visibleWidth = 900;
  for (let n = 0; n < 240; n++) c.update(3000, 1 / 120, 8200, 1, 150);
  const right = c.x;
  assert.ok(Math.abs(right - (3000 - 900 * 0.36)) < 1);
  assert.equal(c.y, 0);
  c.update(3000, 1 / 120, 8200, -1, 500);
  assert.ok(c.x < right);
  assert.ok(c.x > right - 30);
  assert.ok(c.y < 10);
  for (let n = 0; n < 240; n++) c.update(7850, 1 / 120, 8200, 1, 150, 6840);
  assert.ok(c.x >= 6840 && c.x <= 7300);
  assert.ok(7850 - c.x < 900);
});
test("material hits are distinct; explosion particles contain debris and ground dust, all return to pool", () => {
  const p = new ParticlePool();
  p.impact(1, 200, "wood");
  p.impact(2, 200, "metal");
  p.impact(3, 200, "enemy");
  assert.equal(
    p.items.filter((p) => p.kind === "impact" && p.active).length,
    3,
  );
  assert.ok(p.items.some((p) => p.active && p.kind === "wood"));
  assert.ok(p.items.some((p) => p.active && p.kind === "metal"));
  p.blast(50, 170, 150);
  assert.ok(p.items.some((p) => p.active && p.kind === "dust"));
  assert.equal(p.dropped, 0);
  p.update(2);
  assert.equal(p.items.filter((p) => p.active).length, 0);
});
