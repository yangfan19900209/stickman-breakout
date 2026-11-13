const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  PlayerController,
} = require("../.test-build/assets/scripts/player/PlayerController.js");
const {
  LevelController,
} = require("../.test-build/assets/scripts/level/LevelController.js");
const {
  StickmanAnimator,
} = require("../.test-build/assets/scripts/render/StickmanAnimator.js");
const idle = { axis: 0, jump: false, shoot: false, jumpHeld: true };
test("a new air press jumps once, a third press cannot jump, landing restores it", () => {
  const p = new PlayerController(),
    l = new LevelController();
  p.update(1 / 120, { ...idle, jump: true }, l);
  for (let n = 0; n < 40; n++) p.update(1 / 120, idle, l);
  const before = p.y;
  p.update(1 / 120, { ...idle, jump: true }, l);
  assert.equal(p.jumpCount, 2);
  assert.equal(p.airJumpsRemaining, 0);
  assert.ok(p.vy > 480);
  p.update(1 / 120, idle, l);
  const vy = p.vy;
  p.update(1 / 120, { ...idle, jump: true }, l);
  assert.ok(p.vy < vy);
  let peak = p.y;
  for (let n = 0; n < 200; n++) {
    p.update(1 / 120, idle, l);
    peak = Math.max(peak, p.y);
  }
  assert.ok(peak > before + 90);
  assert.equal(p.grounded, true);
  assert.equal(p.airJumpsRemaining, 1);
});
test("holding a jump press never consumes the air jump and restart clears counters", () => {
  const p = new PlayerController(),
    l = new LevelController();
  for (let n = 0; n < 80; n++) p.update(1 / 120, { ...idle, jump: true }, l);
  assert.equal(p.jumpSerial, 1);
  assert.equal(p.airJumpsRemaining, 1);
  p.update(1 / 120, idle, l);
  p.update(1 / 120, { ...idle, jump: true }, l);
  assert.equal(p.jumpSerial, 2);
  p.reset(110, 150);
  assert.equal(p.jumpCount, 0);
  assert.equal(p.jumpSerial, 0);
  assert.equal(p.airJumpTime, 0);
});
test("walk-off ledges keep one air rescue; dead players cannot double jump", () => {
  const p = new PlayerController(),
    l = new LevelController();
  p.grounded = false;
  p.y = 300;
  p.vy = -100;
  p.update(1 / 120, { ...idle, jump: true }, l);
  assert.ok(p.vy > 480);
  assert.equal(p.airJumpsRemaining, 0);
  p.takeDamage(5, 1);
  p.update(1 / 120, idle, l);
  const before = p.vy;
  p.update(1 / 120, { ...idle, jump: true }, l);
  assert.ok(p.vy < before);
});
test("idle and running hips stay high, stance knees extend instead of permanent squat", () => {
  const a = new StickmanAnimator();
  const standing = structuredClone(a.sample("Idle", 0, 0, true));
  assert.ok(standing.rightHip.y >= 42);
  let min = 100,
    max = 0;
  for (let n = 0; n < 100; n++) {
    const pose = a.sample("Run", 0, 0, true, 0, 0, { stride: n / 100 });
    min = Math.min(min, pose.rightHip.y);
    max = Math.max(max, pose.rightHip.y);
    for (const joint of Object.values(pose))
      assert.ok(Number.isFinite(joint.x) && Number.isFinite(joint.y));
  }
  assert.ok(min > 36);
  assert.ok(max > 44);
  const pose = a.sample("Run", 0, 0, true, 0, 0, { stride: 0.28 });
  assert.ok(
    Math.abs(pose.rightKnee.x - (pose.rightHip.x + pose.rightAnkle.x) / 2) < 6,
  );
});
