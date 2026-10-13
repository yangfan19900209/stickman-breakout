const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  GameSession,
} = require("../.test-build/assets/scripts/core/GameSession.js");
const {
  LevelController,
} = require("../.test-build/assets/scripts/level/LevelController.js");
const {
  EnemyController,
} = require("../.test-build/assets/scripts/enemy/EnemyController.js");
const { TankBoss } = require("../.test-build/assets/scripts/enemy/TankBoss.js");
const {
  PlayerController,
} = require("../.test-build/assets/scripts/player/PlayerController.js");
const {
  ProjectileManager,
} = require("../.test-build/assets/scripts/combat/ProjectileManager.js");
const {
  ParticlePool,
} = require("../.test-build/assets/scripts/combat/ParticlePool.js");
const {
  controlLayout,
} = require("../.test-build/assets/scripts/ui/ControlLayout.js");
const idle = { axis: 0, jump: false, shoot: false };
test("shield absorbs front hits, rear shots bypass it, explosions bypass armor", () => {
  const e = new EnemyController({
    id: "shield",
    kind: "shield",
    x: 500,
    y: 150,
    patrol: 0,
  });
  e.takeDamage(1, 1);
  assert.equal(e.shieldHealth, 7);
  assert.ok(e.health > 5.7);
  const before = e.health;
  e.takeDamage(1, -1);
  assert.equal(e.shieldHealth, 7);
  assert.equal(e.health, before - 1);
  e.takeDamage(7, 1, "explosion");
  assert.equal(e.alive, false);
});
test("shield soldier has a visible turn delay instead of instant front immunity", () => {
  const e = new EnemyController({
      id: "shield",
      kind: "shield",
      x: 400,
      y: 150,
      patrol: 0,
    }),
    p = new PlayerController(),
    l = new LevelController(),
    pm = new ProjectileManager(new ParticlePool());
  p.x = 500;
  for (let t = 0; t < 10; t++) e.update(0.01, p, l, pm);
  assert.equal(e.facing, -1);
  for (let t = 0; t < 40; t++) e.update(0.01, p, l, pm);
  assert.equal(e.facing, 1);
});
test("infantry moves while firing; turret remains fixed and emits slow explosive rounds", () => {
  const p = new PlayerController();
  p.x = 450;
  const l = new LevelController(),
    pm = new ProjectileManager(new ParticlePool());
  const rifle = new EnemyController({
    id: "rifle",
    kind: "ranged",
    x: 800,
    y: 150,
    patrol: 0,
  });
  for (let t = 0; t < 300; t++) rifle.update(1 / 120, p, l, pm);
  assert.notEqual(rifle.x, 800);
  assert.ok(rifle.weapon.shots > 0);
  pm.reset();
  const turret = new EnemyController({
    id: "turret",
    kind: "turret",
    x: 720,
    y: 150,
    patrol: 0,
  });
  for (let t = 0; t < 300; t++) turret.update(1 / 120, p, l, pm);
  assert.equal(turret.x, 720);
  const shot = pm.items.find((p) => p.active);
  assert.equal(shot.kind, "cannon");
  assert.ok(Math.hypot(shot.vx, shot.vy) < 300);
  assert.equal(shot.damage, 2);
});
test("cutting the bridge rope drops the real deck; lift motion carries a grounded player", () => {
  const s = new GameSession();
  s.reset();
  const bridge = s.level.mechanisms.find((m) => m.data.kind === "bridge");
  const rope = s.level.objects.objects.find((o) => o.id === "bridge-rope");
  rope.takeDamage(2, 1);
  for (let t = 0; t < 130; t++) s.update(1 / 120, idle);
  assert.equal(bridge.released, true);
  assert.equal(bridge.landed, true);
  assert.equal(bridge.rect.y, 150);
  const lift = s.level.mechanisms.find((m) => m.data.kind === "lift");
  s.player.x = lift.rect.x + 50;
  s.player.y = lift.rect.y + lift.rect.h;
  s.player.grounded = true;
  const before = s.player.y;
  s.level.updateWorld(0.1, s.player, s.spawner.enemies);
  assert.notEqual(s.player.y, before);
  assert.equal(s.player.y, lift.rect.y + lift.rect.h);
});
test("encounter gate blocks the player until actual assigned enemies die", () => {
  const s = new GameSession();
  s.reset();
  const z = s.level.data.zones[0];
  assert.ok(s.level.solids.some((r) => r.entityId === "gate:A"));
  for (const e of s.spawner.enemies)
    if (e.spawn.x < z.end) e.takeDamage(500, 1, "explosion");
  s.update(1 / 120, idle);
  assert.ok(s.level.clearedZones.has("A"));
  assert.equal(
    s.level.solids.some((r) => r.entityId === "gate:A"),
    false,
  );
});
test("boss locks a landing point, fires ballistic shells, changes phase, and cannot be stun-locked", () => {
  const boss = new TankBoss({
      id: "boss",
      kind: "guard",
      x: 7700,
      y: 150,
      patrol: 0,
    }),
    p = new PlayerController(),
    l = new LevelController(),
    pm = new ProjectileManager(new ParticlePool());
  l.arenaEntered = true;
  p.x = 7000;
  for (let t = 0; t < 310; t++) boss.update(1 / 120, p, l, pm);
  assert.equal(boss.mode, "aiming");
  assert.ok(boss.windup > 0);
  const warning = boss.warningX;
  p.x = 7300;
  boss.takeDamage(1, 1);
  assert.ok(boss.windup > 0);
  for (let t = 0; t < 90; t++) boss.update(1 / 120, p, l, pm);
  assert.ok(
    pm.items.some((p) => p.active && p.kind === "cannon" && p.gravity > 0),
  );
  assert.equal(boss.warningX, warning);
  boss.takeDamage(50, 1);
  assert.equal(boss.phase, 2);
  const before = pm.fired;
  for (let t = 0; t < 120 * 6; t++) boss.update(1 / 120, p, l, pm);
  assert.ok(pm.fired - before >= 4);
});
test("boss really summons bounded reinforcement waves", () => {
  const s = new GameSession();
  s.reset();
  s.level.arenaEntered = true;
  s.player.x = 7020;
  // Exercise the actual spawner callback while leaving collision/damage to other tests.
  for (let t = 0; t < 120 * 80; t++)
    s.spawner.guard.update(1 / 120, s.player, s.level, s.projectiles);
  const extra = s.spawner.enemies.filter((e) => e.id.startsWith("reinforce"));
  assert.ok(extra.length >= 2 && extra.length <= 4);
  assert.ok(s.spawner.guard.summons <= 8);
});
test("tank defeat has an explosion sequence, then unlocks a reachable exit and restart", () => {
  const s = new GameSession();
  s.reset();
  s.player.x = s.level.data.exit.x - 15;
  s.level.arenaEntered = true;
  s.update(1 / 120, idle);
  s.spawner.guard.takeDamage(1000, 1, "explosion");
  s.update(1 / 120, idle);
  assert.equal(s.state, "playing");
  for (let t = 0; t < 260; t++) s.update(1 / 120, idle);
  assert.equal(s.state, "complete");
  assert.ok(s.explosions.total >= 5);
  assert.equal(s.level.guardDefeated, true);
  s.reset();
  assert.equal(s.state, "playing");
  assert.equal(s.spawner.guard.health, 90);
  assert.equal(s.level.arenaEntered, false);
});
test("safe insets move touch controls inward without changing their ownership model", () => {
  const l = controlLayout({ left: 40, right: 30, top: 20, bottom: 10 });
  assert.equal(l.joystick.x, 180);
  assert.equal(l.shoot.x, 1132);
  assert.equal(l.jump.y, 180);
  assert.equal(l.pause.y, 666);
});
