const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  InputManager,
} = require("../.test-build/assets/scripts/core/InputManager.js");
const {
  TouchInputManager,
} = require("../.test-build/assets/scripts/core/TouchInputManager.js");
const {
  controlLayout,
} = require("../.test-build/assets/scripts/ui/ControlLayout.js");
function router() {
  const i = new InputManager(),
    t = new TouchInputManager(i);
  t.configure(1558, 720, controlLayout(undefined, 1558, 720, 390), {
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
  });
  t.enabled = true;
  return t;
}
test("any left blank point anchors a neutral floating stick; moving outside base continues input", () => {
  const t = router();
  t.start(1, 410, 380);
  assert.equal(t.input.joystick.axis, 0);
  assert.equal(t.originX, 410);
  t.move(1, 1100, 380);
  assert.equal(t.input.joystick.axis, 1);
  t.end(1, 1100, 380);
  assert.equal(t.input.joystick.axis, 0);
  assert.equal(t.owners.size, 0);
});
test("edge clamping changes only visuals; another finger cannot steal or release the stick", () => {
  const t = router();
  t.start(0, 2, 4);
  assert.ok(t.baseX > 100 && t.baseY > 100);
  t.move(0, 62, 4);
  assert.ok(t.input.joystick.axis > 0.5);
  t.start(2, 300, 200);
  t.move(2, 500, 200);
  t.end(2, 500, 200);
  assert.equal(t.input.joystick.owner, 0);
  t.end(0, 62, 4, true);
  assert.equal(t.input.joystick.owner, null);
});
test("UI, jump and grenade hits suppress blank shooting; each finger releases only itself", () => {
  const t = router();
  t.setRegions([
    { id: "menu", priority: 0, bounds: { x: 1450, y: 650, w: 100, h: 60 } },
    {
      id: "jump",
      priority: 1,
      action: "jump",
      bounds: { x: 1200, y: 300, w: 100, h: 100 },
    },
    {
      id: "grenade",
      priority: 2,
      action: "grenade",
      bounds: { x: 1400, y: 300, w: 100, h: 100 },
    },
  ]);
  t.start(1, 350, 250);
  t.move(1, 450, 250);
  t.start(2, 1000, 200);
  t.start(3, 1250, 350);
  const f = t.input.consume();
  assert.equal(f.shoot, true);
  assert.equal(f.jump, true);
  assert.ok(f.axis > 0.9);
  t.end(3, 1250, 350);
  assert.equal(t.input.isHeld("shoot"), true);
  assert.equal(t.input.joystick.owner, 1);
  t.end(2, 1000, 200);
  assert.equal(t.input.isHeld("shoot"), false);
  assert.equal(t.input.joystick.owner, 1);
  t.start(4, 1450, 350);
  assert.equal(t.input.consume().grenade, true);
  assert.equal(t.input.consume().shoot, false);
  t.start(5, 1480, 680);
  assert.equal(t.end(5, 1480, 680), "menu");
  assert.equal(t.input.joystick.owner, 1);
  t.clear();
  assert.equal(t.owners.size, 0);
  assert.equal(t.input.joystick.owner, null);
});
test("a short blank tap queues one normal shot even when released before the simulation frame", () => {
  const t = router();
  t.start(1, 1000, 250);
  t.end(1, 1000, 250);
  assert.equal(t.input.consume().shoot, true);
  assert.equal(t.input.consume().shoot, false);
});
