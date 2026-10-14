const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  PlayerController,
} = require("../.test-build/assets/scripts/player/PlayerController.js");
const {
  LevelController,
} = require("../.test-build/assets/scripts/level/LevelController.js");
const {
  InputManager,
} = require("../.test-build/assets/scripts/core/InputManager.js");
const {
  StickmanAnimator,
} = require("../.test-build/assets/scripts/render/StickmanAnimator.js");
const {
  CameraFollow,
} = require("../.test-build/assets/scripts/camera/CameraFollow.js");
const { segmentRect } = require("../.test-build/assets/scripts/core/Types.js");
const idle = { axis: 0, jump: false, shoot: false };
test("ground is stable for ten seconds", () => {
  const p = new PlayerController(),
    l = new LevelController();
  for (let i = 0; i < 1200; i++) p.update(1 / 120, idle, l);
  assert.equal(p.y, 150);
  assert.equal(p.grounded, true);
});
test("one jump, no second air jump, predictable apex and landing", () => {
  const p = new PlayerController(),
    l = new LevelController();
  let peak = p.y;
  p.update(1 / 120, { ...idle, jump: true }, l);
  for (let i = 0; i < 150; i++) {
    p.update(1 / 120, { ...idle, jump: i === 24 }, l);
    peak = Math.max(peak, p.y);
  }
  assert.ok(peak > 270 && peak < 278);
  assert.equal(p.y, 150);
  assert.equal(p.grounded, true);
});
test("walking stops at a crate, jumping clears it", () => {
  const p = new PlayerController(),
    l = new LevelController();
  p.x = 360;
  p.y = l.groundY(p.x);
  for (let i = 0; i < 100; i++) p.update(1 / 120, { ...idle, axis: 1 }, l);
  assert.equal(p.x, 407);
  for (let i = 0; i < 120; i++)
    p.update(1 / 120, { ...idle, axis: 1, jump: i === 0 }, l);
  assert.ok(p.x > 600);
  assert.equal(p.y, 150);
});
test("ceiling collision cancels upward speed and lands on elevated platform", () => {
  const p = new PlayerController(),
    l = new LevelController();
  p.x = 1220;
  p.y = l.groundY(p.x);
  p.update(1 / 120, { ...idle, jump: true }, l);
  for (let i = 0; i < 40; i++) p.update(1 / 120, idle, l);
  assert.equal(p.y, l.groundY(p.x));
  p.x = 1190;
  p.y = 330;
  p.vy = -60;
  p.grounded = false;
  for (let i = 0; i < 80; i++) p.update(1 / 120, idle, l);
  assert.equal(p.y, 262);
  assert.equal(p.grounded, true);
});
test("multitouch/key aliases have independent ownership and edges", () => {
  const input = new InputManager();
  input.press("a", "left");
  input.press("arrow", "left");
  input.release("a");
  input.press("touch1", "shoot");
  input.press("touch2", "jump");
  const { axis, shoot, jump } = input.consume();
  assert.deepEqual(
    { axis, shoot, jump },
    { axis: -1, shoot: true, jump: true },
  );
  assert.equal(input.consume().jump, false);
  input.release("touch1");
  assert.equal(input.consume().shoot, false);
  input.clear();
  assert.equal(input.consume().axis, 0);
});
test("swept fast projectile detects first intersected surface", () => {
  assert.equal(
    segmentRect(
      { x: 0, y: 10 },
      { x: 1000, y: 10 },
      { x: 500, y: 0, w: 20, h: 20 },
    ),
    0.5,
  );
  assert.equal(
    segmentRect(
      { x: 0, y: 30 },
      { x: 1000, y: 30 },
      { x: 500, y: 0, w: 20, h: 20 },
    ),
    null,
  );
});
test("camera clamps both map edges", () => {
  const c = new CameraFollow();
  c.update(-10, 1, 4000);
  assert.equal(c.x, 0);
  for (let i = 0; i < 100; i++) c.update(4000, 0.1, 4000);
  assert.ok(c.x <= 2720 && c.x > 2719);
});
test("all procedural joints are finite through every state and death", () => {
  const a = new StickmanAnimator();
  for (const s of ["Idle", "Run", "Jump", "Fall", "Shoot", "Hit", "Dead"]) {
    for (const j of Object.values(a.sample(s, 1.3, 0.7, true, 0.7)))
      assert.ok(Number.isFinite(j.x) && Number.isFinite(j.y));
  }
});
