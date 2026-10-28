const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  LevelController,
} = require("../.test-build/assets/scripts/level/LevelController.js");
const {
  PlayerController,
} = require("../.test-build/assets/scripts/player/PlayerController.js");
const {
  segmentRect,
  surfaceY,
} = require("../.test-build/assets/scripts/core/Types.js");
const {
  StickmanAnimator,
} = require("../.test-build/assets/scripts/render/StickmanAnimator.js");
const {
  GrenadeSystem,
} = require("../.test-build/assets/scripts/combat/GrenadeSystem.js");
const {
  PickupSystem,
} = require("../.test-build/assets/scripts/world/PickupSystem.js");
const {
  WeaponSystem,
} = require("../.test-build/assets/scripts/combat/WeaponSystem.js");
const idle = { axis: 0, jump: false, shoot: false };
const terrain = () => {
  const l = new LevelController();
  l.objects.reset([]);
  l.staticSolids.splice(
    0,
    l.staticSolids.length,
    ...l.staticSolids.filter((r) => r.kind === "ground"),
  );
  l.refreshSolids();
  return l;
};

test("every authored slope is traversable both ways without hopping, including segment seams", () => {
  const l = terrain(),
    p = new PlayerController();
  for (const direction of [1, -1]) {
    p.reset(direction > 0 ? 30 : 8170, 150);
    let low = 200,
      high = 0;
    for (let n = 0; n < 3600; n++) {
      p.update(1 / 120, { ...idle, axis: direction }, l);
      assert.equal(p.grounded, true, `lost footing at ${p.x}`);
      assert.ok(Math.abs(p.y - l.groundY(p.x)) < 0.001);
      low = Math.min(low, p.y);
      high = Math.max(high, p.y);
    }
    assert.ok(direction > 0 ? p.x > 8100 : p.x < 100);
    assert.ok(high - low >= 65);
  }
});
test("jump detaches uphill, cannot jump in air, then lands; slope never prevents standing", () => {
  const l = terrain(),
    p = new PlayerController();
  p.reset(210, l.groundY(210));
  p.update(1 / 120, { ...idle, axis: 1, crouch: true }, l);
  assert.equal(p.crouched, true);
  p.update(1 / 120, { ...idle, axis: 1, jump: true, jumpHeld: true }, l);
  assert.equal(p.crouched, false);
  assert.equal(p.grounded, false);
  const initial = p.vy;
  for (let n = 0; n < 30; n++)
    p.update(1 / 120, { ...idle, axis: 1, jump: true, jumpHeld: true }, l);
  assert.ok(p.vy < initial - 250);
  assert.ok(p.y > l.groundY(p.x) + 50);
  for (let n = 0; n < 140; n++) p.update(1 / 120, idle, l);
  assert.equal(p.grounded, true);
  assert.equal(p.y, l.groundY(p.x));
});
test("swept bullets hit the slope itself, not its empty bounding-box corner", () => {
  const r = { x: 0, y: 0, w: 200, h: 100, slope: { left: 0, right: 100 } };
  assert.equal(segmentRect({ x: 0, y: 80 }, { x: 100, y: 80 }, r), null);
  assert.equal(segmentRect({ x: 0, y: 50 }, { x: 200, y: 50 }, r), 0.5);
  assert.equal(segmentRect({ x: 200, y: 150 }, { x: 200, y: 0 }, r), 1 / 3);
  assert.ok(segmentRect({ x: 0, y: 50 }, { x: 200, y: 50 }, r, 2) < 0.5);
});
test("grenade bounces off the real incline and supplies settle on its surface", () => {
  const l = terrain(),
    grenades = new GrenadeSystem(),
    p = new PlayerController();
  const g = grenades.items[0];
  Object.assign(g, {
    active: true,
    x: 220,
    y: l.groundY(220) + 6,
    vx: 60,
    vy: -120,
    fuse: 4,
    spin: 0,
  });
  grenades.update(1 / 120, l, { enqueue() {} });
  assert.ok(g.vy > 0);
  assert.ok(Math.abs(g.y - l.groundY(g.x) - 5) < 0.001);
  const drops = new PickupSystem();
  drops.spawn(220, 240, "health");
  p.x = 1000;
  for (let n = 0; n < 300; n++)
    drops.update(1 / 120, p, new WeaponSystem(), l.solids);
  const item = drops.items[0];
  assert.equal(item.active, true);
  assert.equal(item.y, l.groundY(item.x) + 10);
});
test("ground props have level pads and no enemy starts buried below terrain", () => {
  const l = new LevelController();
  for (const o of l.objects.objects.filter((o) => o.y < 200)) {
    assert.ok(
      Math.abs(l.groundY(o.x) - l.groundY(o.x + o.w)) < 0.001,
      o.id + " spans a slope",
    );
    assert.equal(o.y, l.groundY(o.x + o.w / 2));
  }
  for (const e of l.data.enemies) assert.ok(e.y >= l.groundY(e.x));
});
test("running stance foot stays planted in world space, swing clears floor and slope soles track it", () => {
  const a = new StickmanAnimator(),
    sample = (stride, slope = 0) =>
      structuredClone(
        a.sample("Run", 0, 0, true, 0, 0, {
          stride,
          groundSlope: slope,
          facing: 1,
        }),
      );
  const p = sample(0.1),
    q = sample(0.3);
  assert.ok(Math.abs(p.rightAnkle.x - (q.rightAnkle.x + 0.2 * 96)) < 1e-6);
  assert.equal(p.rightAnkle.y, 0);
  assert.ok(sample(0.78).rightAnkle.y > 13);
  const hill = sample(0.2, 0.25);
  assert.equal(hill.rightAnkle.y, hill.rightAnkle.x * 0.25);
  assert.ok(
    Math.abs(
      Math.hypot(
        hill.rightKnee.x - hill.rightHip.x,
        hill.rightKnee.y - hill.rightHip.y,
      ) - 23,
    ) < 0.001,
  );
});
