const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  VirtualJoystick,
} = require("../.test-build/assets/scripts/core/VirtualJoystick.js");
const {
  InputManager,
} = require("../.test-build/assets/scripts/core/InputManager.js");
const {
  PlayerController,
} = require("../.test-build/assets/scripts/player/PlayerController.js");
const {
  LevelController,
} = require("../.test-build/assets/scripts/level/LevelController.js");
const R = require("../.test-build/assets/scripts/core/GameConfig.js").GameConfig
  .input.joystickRadius;
const idle = { axis: 0, jump: false, shoot: false };
test("stick has a dead zone, analog mapping, radius clamp and automatic recenter", () => {
  const s = new VirtualJoystick();
  s.start(0, 5, 0);
  assert.equal(s.axis, 0);
  s.move(0, R * 0.61, 0);
  assert.ok(s.axis > 0.4 && s.axis < 0.65);
  s.move(0, 999, 0);
  assert.equal(s.axis, 1);
  assert.equal(s.x, R);
  s.end(0);
  assert.equal(s.owner, null);
  assert.equal(s.axis, 0);
  assert.equal(s.x, 0);
});
test("only the owning touch can move or release the stick", () => {
  const s = new VirtualJoystick();
  s.start(1, R, 0);
  assert.equal(s.start(2, -R, 0), false);
  s.move(2, -R, 0);
  s.end(2);
  assert.equal(s.axis, 1);
  s.end(1);
  assert.equal(s.axis, 0);
});
test("stick and independent shooting/jumping fingers coexist; down/up have distinct semantics", () => {
  const i = new InputManager();
  i.joystick.start(1, R * 0.83, 0);
  i.press("touch:2", "shoot");
  i.press("touch:3", "jump");
  let f = i.consume();
  assert.ok(f.axis > 0.7);
  assert.equal(f.shoot, true);
  assert.equal(f.jump, true);
  assert.equal(f.jumpHeld, true);
  i.release("touch:3");
  f = i.consume();
  assert.equal(f.jumpHeld, false);
  assert.equal(f.shoot, true);
  i.joystick.move(1, 0, -R);
  f = i.consume();
  assert.equal(f.crouch, true);
  assert.equal(f.jump, false);
  i.joystick.move(1, 0, R);
  f = i.consume();
  assert.equal(f.aimY, 1);
  assert.equal(f.jump, false);
  i.consumePause();
  assert.equal(i.joystick.owner, 1);
  i.clear();
  assert.equal(i.joystick.owner, null);
  assert.equal(i.consume().shoot, false);
});
test("half analog input yields half running speed with immediate acceleration", () => {
  const p = new PlayerController(),
    l = new LevelController();
  for (let t = 0; t < 30; t++) p.update(1 / 120, { ...idle, axis: 0.5 }, l);
  assert.equal(p.vx, 140);
  assert.ok(p.x > 135 && p.x < 150);
});
test("release makes a genuinely smaller jump, not another air jump", () => {
  function apex(heldTicks) {
    const p = new PlayerController(),
      l = new LevelController();
    let peak = 150;
    for (let t = 0; t < 150; t++) {
      p.update(1 / 120, { ...idle, jump: t === 0, jumpHeld: t < heldTicks }, l);
      peak = Math.max(peak, p.y);
    }
    return peak;
  }
  const short = apex(2),
    long = apex(60);
  assert.ok(long - short > 55);
  assert.ok(long > 270);
  assert.ok(short > 180 && short < 220);
});
test("coyote jump and buffered landing both retain exactly one takeoff", () => {
  const p = new PlayerController(),
    l = new LevelController();
  l.solids.splice(0, l.solids.length, {
    x: 0,
    y: 50,
    w: 100,
    h: 100,
    kind: "ground",
  });
  p.x = 115;
  p.update(1 / 120, idle, l);
  assert.equal(p.grounded, false);
  p.update(1 / 120, { ...idle, jump: true }, l);
  assert.ok(p.vy > 500);
  const q = new PlayerController(),
    k = new LevelController();
  q.y = 160;
  q.vy = -200;
  q.grounded = false;
  q.update(1 / 120, { ...idle, jump: true }, k);
  for (let t = 0; t < 10; t++) q.update(1 / 120, idle, k);
  assert.ok(q.vy > 300);
});
test("crouch reduces movement/collision height; releasing cannot stand through a ceiling", () => {
  const p = new PlayerController(),
    l = new LevelController();
  p.update(1 / 120, { ...idle, crouch: true }, l);
  assert.equal(p.height, 43);
  assert.equal(p.bounds.h, 36);
  l.solids.push({ x: 50, y: 195, w: 150, h: 16, kind: "platform" });
  p.update(1 / 120, idle, l);
  assert.equal(p.crouched, true);
  p.x = 260;
  p.update(1 / 120, idle, l);
  assert.equal(p.crouched, false);
});
