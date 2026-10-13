const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  GameSession,
} = require("../.test-build/assets/scripts/core/GameSession.js");
const {
  ProjectileManager,
} = require("../.test-build/assets/scripts/combat/ProjectileManager.js");
const {
  ParticlePool,
} = require("../.test-build/assets/scripts/combat/ParticlePool.js");
const {
  EnemyController,
} = require("../.test-build/assets/scripts/enemy/EnemyController.js");
const {
  GameConfig: C,
} = require("../.test-build/assets/scripts/core/GameConfig.js");
const idle = { axis: 0, jump: false, shoot: false };
const legacy = require("./fixtures/legacy-level.cjs");
const {
  GameSession: BaseSession,
} = require("../.test-build/assets/scripts/core/GameSession.js");
// The original V0.1 combat route stays a regression fixture as the shipped level evolves.
const createSession = () => new BaseSession(legacy);
function step(s, n, input = idle) {
  for (let i = 0; i < n; i++) s.update(1 / 120, input);
}
test("holding rifle respects 0.14s interval and pools stay bounded", () => {
  const s = createSession();
  s.reset();
  step(s, 120, { ...idle, shoot: true });
  assert.ok(s.projectiles.fired >= 7 && s.projectiles.fired <= 8);
  assert.equal(s.projectiles.dropped, 0);
  assert.ok(s.projectiles.peak < 20);
});
test("nearest wall absorbs bullet before enemy, nearest enemy consumes it once", () => {
  const fx = new ParticlePool(),
    pm = new ProjectileManager(fx);
  let hits = 0;
  const target = {
    x: 80,
    y: 0,
    alive: true,
    bounds: { x: 80, y: 0, w: 20, h: 100 },
    takeDamage() {
      hits++;
      return true;
    },
  };
  const shot = {
    owner: "player",
    x: 0,
    y: 40,
    direction: 1,
    speed: 1000,
    damage: 1,
    range: 1000,
  };
  pm.spawn(shot);
  pm.update(0.1, target, [target], [{ x: 50, y: 0, w: 10, h: 100 }]);
  assert.equal(hits, 0);
  pm.spawn(shot);
  pm.update(0.1, target, [target], []);
  assert.equal(hits, 1);
  pm.update(0.1, target, [target], []);
  assert.equal(hits, 1);
});
test("pool reuses slots, expiry recycles, overload is bounded", () => {
  const pm = new ProjectileManager(new ParticlePool()),
    shot = {
      owner: "player",
      x: 0,
      y: 100,
      direction: 1,
      speed: 1000,
      damage: 1,
      range: 20,
    };
  for (let i = 0; i < 100; i++) pm.spawn(shot);
  assert.equal(pm.items.filter((p) => p.active).length, 96);
  assert.equal(pm.dropped, 4);
  const dummy = {
    x: 0,
    y: 0,
    alive: false,
    bounds: { x: 0, y: 0, w: 1, h: 1 },
    takeDamage() {
      return false;
    },
  };
  pm.update(0.1, dummy, [], []);
  assert.equal(pm.items.filter((p) => p.active).length, 0);
  assert.equal(pm.spawn(shot), true);
});
test("player has 5 health, invincibility blocks repeated hits, death and restart reset session", () => {
  const s = createSession();
  s.reset();
  assert.equal(s.player.health, 5);
  assert.equal(s.player.takeDamage(1, 1), true);
  assert.equal(s.player.takeDamage(1, 1), false);
  for (let i = 0; i < 4; i++) {
    s.player.invincible = 0;
    s.player.takeDamage(1, 1);
  }
  step(s, 140);
  assert.equal(s.state, "gameover");
  assert.equal(s.player.animation, "Dead");
  s.reset();
  assert.equal(s.player.health, 5);
  assert.equal(s.spawner.kills, 0);
  assert.equal(s.projectiles.fired, 0);
  assert.equal(s.state, "playing");
});
test("pause freezes simulation and resumes original state", () => {
  const s = createSession();
  s.reset();
  step(s, 60);
  const before = s.snapshot();
  s.pause();
  step(s, 240, { ...idle, axis: 1, shoot: true });
  assert.equal(s.player.x, before.player.x);
  assert.equal(s.time, before.time);
  s.resume();
  step(s, 30, { ...idle, axis: 1 });
  assert.ok(s.player.x > before.player.x);
});
test("melee and ranged enemies both damage player through their attack pipeline", () => {
  for (const kind of ["melee", "ranged"]) {
    const s = createSession();
    s.reset();
    s.level.objects.reset([]);
    s.level.refreshSolids();
    s.spawner.enemies = [
      new EnemyController({
        id: "test",
        kind,
        x: kind === "melee" ? 140 : 340,
        y: 150,
        patrol: 0,
      }),
      s.spawner.guard,
    ];
    step(s, 480);
    assert.ok(s.player.health < 5, `${kind} did not attack`);
  }
});
test("exit stays locked while guard lives, killing guard unlocks completion", () => {
  const s = createSession();
  s.reset();
  s.player.x = 3870;
  step(s, 1);
  assert.equal(s.state, "playing");
  s.spawner.guard.takeDamage(99, 1);
  step(s, 1);
  assert.equal(s.state, "complete");
});
test("a full 4000-unit route is winnable using movement/jump/fire only", () => {
  const s = createSession();
  s.reset();
  let jumps = 0;
  for (let tick = 0; tick < 120 * 50 && s.state === "playing"; tick++) {
    const p = s.player;
    const obstruction = s.level.solids.some(
      (r) =>
        r.kind !== "ground" &&
        r.x > p.x &&
        r.x - p.x < 76 &&
        r.y < p.y + p.height &&
        r.y + r.h > p.y + 2,
    );
    // Wait outside the guard firing line while the rifle clears the checkpoint.
    const wait = p.x > 3180 && s.spawner.guard.alive;
    const jump = p.grounded && obstruction && !wait;
    if (jump) jumps++;
    s.update(1 / 120, { axis: wait ? 0 : 1, jump, shoot: true });
  }
  assert.equal(s.state, "complete", JSON.stringify(s.snapshot()));
  assert.ok(jumps >= 4);
  assert.ok(s.player.health > 0);
  assert.equal(s.projectiles.dropped, 0);
});
test("hundreds of reset/combat cycles leave fixed pool capacity", () => {
  const s = createSession();
  for (let run = 0; run < 100; run++) {
    s.reset();
    step(s, 120, { ...idle, shoot: true });
  }
  assert.equal(s.projectiles.items.length, C.pools.projectiles);
  assert.equal(s.particles.items.length, C.pools.particles);
  assert.equal(s.spawner.enemies.length, 10);
});
