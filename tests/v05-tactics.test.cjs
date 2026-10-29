const { test } = require("node:test");
const assert = require("node:assert/strict");
const load = (p) => require(`../.test-build/assets/scripts/${p}.js`);
const { GameSession } = load("core/GameSession");
const { EnemyController } = load("enemy/EnemyController");
const { ColossusBoss } = load("enemy/ColossusBoss");
const { PlayerController } = load("player/PlayerController");
const { LevelController } = load("level/LevelController");
const { ProjectileManager } = load("combat/ProjectileManager");
const { ParticlePool } = load("combat/ParticlePool");
function setup(kind, dist = 200) {
  const level = new LevelController({
    name: "tactics fixture",
    width: 2000,
    spawn: { x: 200, y: 150 },
    solids: [{ x: 0, y: 0, w: 2000, h: 150, kind: "ground" }],
    objects: [],
    enemies: [],
    exit: { x: 1950, y: 150 },
  });
  const p = new PlayerController();
  p.reset(300, 150);
  const e = new EnemyController({
    id: "fixture",
    kind,
    x: 300 + dist,
    y: 150,
    patrol: 30,
  });
  const shots = new ProjectileManager(new ParticlePool());
  return {
    e,
    p,
    level,
    shots,
    tick: (n) => {
      for (let i = 0; i < n; i++) e.update(1 / 120, p, level, shots);
    },
  };
}
test("rifle troops lock a two-shot burst, reload without firing, and seek cover", () => {
  const f = setup("ranged");
  f.tick(60);
  assert.equal(f.shots.fired, 0);
  assert.equal(f.e.action, "aim");
  f.tick(100);
  assert.equal(f.shots.fired, 2);
  assert.equal(f.e.action, "reload");
  const x = f.e.x;
  f.tick(100);
  assert.equal(f.shots.fired, 2);
  assert.notEqual(f.e.x, x);
  f.tick(300);
  assert.ok(f.shots.fired >= 4);
});
test("melee charge has a stationary tell, locked direction and recovery window; hit interrupts it", () => {
  const f = setup("melee", 130);
  f.e.attackCooldown = 0;
  f.tick(1);
  assert.equal(f.e.action, "chargeWindup");
  assert.equal(f.e.vx, 0);
  f.tick(75);
  assert.ok(["charge", "recover"].includes(f.e.action));
  f.tick(100);
  assert.ok(f.p.health < 5);
  assert.notEqual(f.e.action, "charge");
  f.e.takeDamage(1, 1);
  assert.equal(f.e.action, "recover");
});
test("mini tank and final colossus are separate; all six final attacks have a warning and phase transition", () => {
  const s = new GameSession();
  s.reset();
  assert.equal(s.spawner.miniBoss.maxHealth, 42);
  const boss = s.spawner.guard;
  assert.ok(boss instanceof ColossusBoss);
  assert.ok(boss.bounds.h > s.spawner.miniBoss.bounds.h * 2);
  s.level.arenaEntered = true;
  s.player.x = 7300;
  const attacks = new Set(),
    warnings = new Set();
  for (let n = 0; n < 120 * 24; n++) {
    boss.update(1 / 120, s.player, s.level, s.projectiles);
    if (boss.windup > 0) {
      attacks.add(boss.attack);
      warnings.add(boss.warningX);
    }
  }
  assert.deepEqual([...attacks].sort(), ["burst", "laser", "missiles", "salvo", "stomp", "sweep"]);
  assert.ok(boss.impactSerial > 0);
  assert.ok(s.projectiles.items.some((p) => p.kind === "shockwave"));
  boss.takeDamage(70, 1);
  assert.equal(boss.phase, 2);
  const health = boss.health;
  s.level.arenaEntered = false;
  boss.update(1 / 120, s.player, s.level, s.projectiles);
  assert.equal(boss.active, false);
  assert.equal(boss.windup, 0);
  s.level.arenaEntered = true;
  boss.update(1 / 120, s.player, s.level, s.projectiles);
  assert.equal(boss.health, health);
});

test("tank supply cannot start buried inside a step, and remains collectable", () => {
  const { PickupSystem } = load("world/PickupSystem"),
    { WeaponSystem } = load("combat/WeaponSystem");
  const items = new PickupSystem(),
    p = new PlayerController(),
    w = new WeaponSystem();
  p.reset(500, 200);
  items.spawn(500, 175, "rocket");
  items.update(1 / 120, p, w, [{ x: 400, y: 150, w: 200, h: 50 }]);
  assert.equal(items.collected, 1);
  assert.equal(w.id, "rocket");
});

test("current full campaign is winnable with input only, including mini tank and final boss", () => {
  const { PlaytestBrain } = require("../scripts/playtest-brain.cjs");
  const s = new GameSession(),
    brain = new PlaytestBrain();
  s.reset();
  let frame;
  // Terraces and infantry recovery change encounters; allow a longer fight
  // without changing health, damage or the real-input completion assertions.
  for (let tick = 0; tick < 120 * 240 && s.state === "playing"; tick++) {
    if (tick % 4 === 0) frame = brain.next(s.snapshot());
    s.update(1 / 120, {
      ...frame,
      jump: tick % 4 === 0 && frame.jump,
      grenade: tick % 4 === 0 && frame.grenade,
    });
  }
  assert.equal(s.state, "complete");
  assert.ok(s.player.health > 0);
  assert.equal(s.spawner.miniBoss.health, 0);
  assert.equal(s.spawner.guard.health, 0);
  assert.equal(s.projectiles.dropped, 0);
});
