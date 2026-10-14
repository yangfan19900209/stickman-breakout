const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  GameSession,
} = require("../.test-build/assets/scripts/core/GameSession.js");
const {
  EnemyController,
} = require("../.test-build/assets/scripts/enemy/EnemyController.js");
const idle = { axis: 0, jump: false, shoot: false };
test("rocket backblast and rear trail precede a tagged damaging blast; pool reuse resets presentation", () => {
  const s = new GameSession();
  s.reset();
  s.level.objects.reset([]);
  s.level.refreshSolids();
  s.weapon.equip("rocket");
  s.player.weaponId = "rocket";
  const e = new EnemyController({
    id: "target",
    kind: "melee",
    x: 350,
    y: 150,
    patrol: 0,
  });
  s.spawner.enemies = [e, s.spawner.guard];
  s.update(1 / 120, { ...idle, shoot: true });
  const rocket = s.projectiles.items.find(
    (p) => p.active && p.kind === "rocket",
  );
  assert.ok(rocket);
  const smoke = s.particles.items.filter((p) => p.active && p.kind === "smoke");
  assert.ok(smoke.length >= 6);
  assert.ok(
    smoke.every((p) => p.x < rocket.x - 20),
    "smoke must not cover the nose",
  );
  for (let n = 0; n < 120 && !s.explosions.total; n++) s.update(1 / 120, idle);
  assert.equal(e.alive, false);
  assert.ok(s.explosions.items.some((b) => b.active && b.style === "rocket"));
  assert.equal(s.explosions.dropped, 0);
  s.reset();
  assert.equal(
    s.particles.items.some((p) => p.active),
    false,
  );
  assert.equal(
    s.explosions.items.some((b) => b.active),
    false,
  );
  s.update(1 / 120, { ...idle, grenade: true });
  for (let n = 0; n < 150 && !s.explosions.total; n++) s.update(1 / 120, idle);
  assert.ok(s.explosions.items.some((b) => b.active && b.style === "grenade"));
  assert.equal(
    s.explosions.items.some((b) => b.active && b.style === "rocket"),
    false,
  );
});
