const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  GameSession,
} = require("../.test-build/assets/scripts/core/GameSession.js");
const {
  LevelController,
} = require("../.test-build/assets/scripts/level/LevelController.js");
const {
  WeaponSystem,
} = require("../.test-build/assets/scripts/combat/WeaponSystem.js");
const {
  ProjectileManager,
} = require("../.test-build/assets/scripts/combat/ProjectileManager.js");
const {
  ParticlePool,
} = require("../.test-build/assets/scripts/combat/ParticlePool.js");
const {
  EnemyController,
} = require("../.test-build/assets/scripts/enemy/EnemyController.js");
const idle = { axis: 0, jump: false, shoot: false };
const tick = (s, n, input = idle) => {
  for (let t = 0; t < n; t++) s.update(1 / 120, input);
};
test("wood has progressive damage, destroys exactly once and removes the real collider", () => {
  const s = new GameSession();
  s.reset();
  const o = s.level.objects.objects.find((o) => o.id === "crate-01");
  assert.equal(o.health, 3);
  o.takeDamage(1, 1);
  s.update(1 / 120, idle);
  assert.equal(o.health, 2);
  assert.ok(o.hitTime > 0);
  assert.equal(o.solid, true);
  o.takeDamage(2, 1);
  s.update(1 / 120, idle);
  assert.equal(o.alive, false);
  assert.equal(
    s.level.solids.some((r) => r.entityId === o.id),
    false,
  );
  const count = s.level.objects.destroyed;
  assert.equal(o.takeDamage(1, 1), false);
  tick(s, 10);
  assert.equal(s.level.objects.destroyed, count);
});
test("real rifle collision breaks a supply box and walking collects shotgun", () => {
  const s = new GameSession();
  s.reset();
  tick(s, 170, { ...idle, shoot: true });
  assert.equal(
    s.level.objects.objects.find((o) => o.id === "shotgun-cache").alive,
    false,
  );
  s.player.x = 326;
  tick(s, 100);
  assert.equal(s.weapon.id, "shotgun");
  assert.equal(s.player.weaponId, "shotgun");
  assert.ok(s.weapon.ammo > 0);
});
test("barrel damage creates a bounded chain that kills nearby enemies", () => {
  const s = new GameSession();
  s.reset();
  const near = new EnemyController({
    id: "near",
    kind: "melee",
    x: 675,
    y: 150,
    patrol: 0,
  });
  s.spawner.enemies.push(near);
  const first = s.level.objects.objects.find((o) => o.id === "barrel-01"),
    second = s.level.objects.objects.find((o) => o.id === "barrel-02");
  first.takeDamage(3, 1);
  s.update(1 / 120, idle);
  assert.equal(first.solid, false);
  assert.equal(s.explosions.total, 0);
  assert.equal(second.alive, true);
  tick(s, 12);
  assert.equal(second.alive, false);
  assert.equal(near.alive, false);
  assert.ok(near.vy > 0);
  assert.equal(s.explosions.total, 1);
  tick(s, 12);
  assert.equal(s.explosions.total, 2);
  tick(s, 180);
  assert.equal(s.explosions.total, 2);
  assert.equal(s.explosions.dropped, 0);
});
test("shotgun emits six distinct trajectories and close shots knock back", () => {
  const w = new WeaponSystem("shotgun"),
    pm = new ProjectileManager(new ParticlePool());
  const shooter = {
    x: 0,
    y: 150,
    facing: 1,
    animation: "Idle",
    animationTime: 0,
    recoil: 0,
    deadTime: 0,
    weaponId: "shotgun",
  };
  assert.equal(w.fire(shooter, pm, "player"), true);
  const p = pm.items.filter((p) => p.active);
  assert.equal(p.length, 6);
  assert.equal(new Set(p.map((p) => p.vy)).size, 6);
  assert.equal(w.ammo, 17);
  const enemy = new EnemyController({
    id: "target",
    kind: "melee",
    x: 120,
    y: 150,
    patrol: 0,
  });
  pm.update(
    0.12,
    {
      alive: false,
      bounds: { x: 0, y: 0, w: 1, h: 1 },
      takeDamage() {
        return false;
      },
    },
    [enemy],
    [],
  );
  assert.ok(enemy.health < 3);
  assert.ok(enemy.vx >= 160);
});
test("rocket travels slowly and its impact is a real area explosion", () => {
  const s = new GameSession();
  s.reset();
  s.level.objects.reset([]);
  s.level.refreshSolids();
  s.weapon.equip("rocket");
  s.player.weaponId = "rocket";
  const e = new EnemyController({
    id: "rocket-target",
    kind: "melee",
    x: 350,
    y: 150,
    patrol: 0,
  });
  s.spawner.enemies = [e, s.spawner.guard];
  s.update(1 / 120, { ...idle, shoot: true });
  const shot = s.projectiles.items.find((p) => p.active);
  assert.equal(shot.kind, "rocket");
  assert.ok(Math.abs(shot.vx) < 500);
  tick(s, 120);
  assert.ok(s.explosions.total > 0);
  assert.equal(e.alive, false);
  assert.equal(s.weapon.ammo, 5);
});
test("grenades are limited, use ballistic gravity, bounce and explode", () => {
  const s = new GameSession();
  s.reset();
  s.update(1 / 120, { ...idle, grenade: true });
  assert.equal(s.player.grenades, 2);
  assert.equal(s.grenades.thrown, 1);
  const g = s.grenades.items.find((g) => g.active),
    before = g.vy;
  tick(s, 15);
  assert.ok(g.vy < before);
  tick(s, 180);
  assert.ok(s.explosions.total > 0);
  assert.equal(g.active, false);
  for (let i = 0; i < 5; i++) {
    s.update(1 / 120, { ...idle, grenade: true });
    tick(s, 90);
  }
  assert.equal(s.player.grenades, 0);
  assert.equal(s.grenades.thrown, 3);
});
test("hanging cargo really falls, crashes and removes its physical collider", () => {
  const s = new GameSession();
  s.reset();
  const o = s.level.objects.objects.find((o) => o.kind === "hanging");
  o.takeDamage(2, 1);
  tick(s, 90);
  assert.equal(o.triggered, true);
  assert.ok(o.y < 410);
  assert.equal(o.falling, false);
  assert.equal(o.solid, false);
  assert.equal(
    s.level.solids.some((r) => r.entityId === o.id),
    false,
  );
});
test("level state is private per run; destruction and pickups reset fully", () => {
  const a = new LevelController(),
    b = new LevelController();
  a.objects.objects[0].takeDamage(99, 1);
  a.objects.flushHits();
  a.refreshSolids();
  assert.equal(b.objects.objects[0].alive, true);
  const s = new GameSession();
  s.reset();
  s.weapon.equip("rocket");
  s.player.grenades = 0;
  s.reset();
  assert.equal(s.weapon.id, "rifle");
  assert.equal(s.player.grenades, 3);
  assert.equal(s.explosions.total, 0);
  assert.equal(s.level.objects.objects[0].alive, true);
});
