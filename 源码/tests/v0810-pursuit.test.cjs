const { test } = require("node:test"),
  assert = require("node:assert/strict");
const load = (p) => require(`../.test-build/assets/scripts/${p}.js`);
const { EnemyController } = load("enemy/EnemyController"),
  { TankBoss } = load("enemy/TankBoss"),
  { PlayerController } = load("player/PlayerController"),
  { LevelController } = load("level/LevelController"),
  { ProjectileManager } = load("combat/ProjectileManager"),
  { ParticlePool } = load("combat/ParticlePool");
const dt = 1 / 120;
function fixture(kind, x = 900, y = 150, solids = []) {
  const level = new LevelController({
    name: "pursuit",
    width: 3000,
    spawn: { x: 700, y: 150 },
    exit: { x: 2900, y: 150 },
    objects: [],
    enemies: [],
    solids: [{ x: 0, y: 0, w: 3000, h: 150, kind: "ground" }, ...solids],
  });
  const e =
    kind === "guard"
      ? new TankBoss({ id: "mini", kind, x, y, patrol: 30, encounter: "mini" })
      : new EnemyController({
          id: "soldier",
          kind,
          x,
          y,
          patrol: 30,
          onPlatform: true,
        });
  const p = new PlayerController();
  p.reset(700, 150);
  const shots = new ProjectileManager(new ParticlePool());
  return {
    e,
    p,
    level,
    shots,
    tick(n = 1) {
      for (let i = 0; i < n; i++) {
        p.invincible = 1;
        e.update(dt, p, level, shots);
      }
    },
  };
}

test("mini boss telegraphs a real jump onto the player deck then follows down and beyond its former leash", () => {
  const f = fixture("guard", 1050, 150, [
    { x: 700, y: 236, w: 300, h: 24, kind: "platform", oneWay: true },
  ]);
  f.p.reset(820, 260);
  let tell = 0,
    air = false,
    land = false,
    maxY = 0;
  for (let n = 0; n < 120 * 5; n++) {
    f.tick();
    if (f.e.mode === "jump-tell") {
      tell += dt;
      assert.equal(f.e.y, 150);
    }
    if (f.e.mode === "jumping") {
      air = true;
      maxY = Math.max(maxY, f.e.y);
    }
    if (air && f.e.grounded && f.e.y === 260) {
      land = true;
      break;
    }
  }
  assert.ok(
    tell >= 0.25 && air && land,
    JSON.stringify({ tell, air, land, y: f.e.y, x: f.e.x }),
  );
  assert.ok(maxY > 300);
  assert.equal(f.e.jumpCount, 1);
  f.p.reset(440, 150);
  f.tick(120 * 7);
  assert.ok(f.e.x < 570, `should follow beyond spawn - 480: ${f.e.x}`);
  assert.equal(f.e.y, 150);
  assert.ok(f.e.grounded);
});

test("mini boss can drop off a deck when the target stands directly underneath", () => {
  const f = fixture("guard", 850, 260, [
    { x: 700, y: 236, w: 300, h: 24, kind: "platform", oneWay: true },
  ]);
  f.p.reset(850, 150);
  f.tick(120 * 5);
  assert.equal(f.e.y, 150);
  assert.ok(f.e.grounded);
  assert.ok(f.e.x < 616 || f.e.x > 1084);
});

test("mobile soldiers escape solid cover in both directions, including platform-posted and rocket troops", () => {
  for (const kind of ["melee", "ranged", "shield", "turret"])
    for (const direction of [-1, 1]) {
      const f = fixture(kind, direction === 1 ? 800 : 1040, 150, [
        { x: 900, y: 150, w: 72, h: 104, kind: "step" },
      ]);
      f.p.reset(direction === 1 ? 1080 : 760, 150);
      let landed = false,
        progress = 0;
      for (let n = 0; n < 120 * 8; n++) {
        f.tick();
        if (f.e.grounded && f.e.y === 254) landed = true;
        progress = Math.max(progress, (f.e.x - f.e.spawn.x) * direction);
      }
      assert.ok(
        f.e.jumpCount > 0 && landed,
        JSON.stringify({
          kind,
          direction,
          x: f.e.x,
          y: f.e.y,
          jumps: f.e.jumpCount,
          landed,
        }),
      );
      assert.ok(progress > 65, `${kind} ${direction} ${progress}`);
    }
});

test("pursuit rejects a jump with no headroom and does not phase through a tall wall", () => {
  for (const kind of ["guard", "melee", "ranged", "shield", "turret"]) {
    const f = fixture(kind, 820, 150, [
      { x: 930, y: 150, w: 70, h: 105, kind: "step" },
      { x: 680, y: 310, w: 450, h: 24, kind: "platform" },
    ]);
    f.p.reset(1100, 150);
    f.tick(120 * 8);
    assert.equal(f.e.jumpCount, 0, kind);
    assert.equal(f.e.y, 150);
    assert.ok(f.e.x + f.e.halfWidth <= 930 + 0.01, kind);
  }
});

test("jumping mini boss remains vulnerable and falls onto real support when destroyed in midair", () => {
  const f = fixture("guard", 1050, 150, [
    { x: 700, y: 236, w: 300, h: 24, kind: "platform", oneWay: true },
  ]);
  f.p.reset(820, 260);
  for (let n = 0; n < 120 * 5 && f.e.y < 220; n++) f.tick();
  assert.ok(f.e.y >= 220 && !f.e.grounded);
  assert.equal(f.e.takeDamage(999, 1, "rocket"), true);
  f.tick(120 * 2);
  assert.ok(f.e.grounded);
  assert.ok(f.e.y === 150 || f.e.y === 260);
  assert.equal(f.e.health, 0);
});

test("pursuit preserves the locked shot commitment when a player jumps up during a burst tell", () => {
  const f = fixture("guard", 1100, 150, [
    { x: 700, y: 236, w: 300, h: 24, kind: "platform", oneWay: true },
  ]);
  f.p.reset(750, 150);
  for (let n = 0; n < 120 * 4 && f.e.windup === 0; n++) f.tick();
  assert.ok(f.e.windup > 0);
  const x = f.e.x,
    facing = f.e.facing,
    warning = f.e.warningX;
  f.p.reset(800, 260);
  while (f.e.windup > 0) {
    f.tick();
    assert.equal(f.e.x, x);
    assert.equal(f.e.facing, facing);
    assert.equal(f.e.warningX, warning);
    assert.equal(f.e.jumpCount, 0);
  }
  assert.ok(f.shots.fired > 0);
  f.tick(120 * 5);
  assert.ok(f.e.jumpCount > 0);
});

test("mini boss reaches the real chapter catwalk from its authored spawn without a teleport", () => {
  const { GameSession } = load("core/GameSession"),
    s = new GameSession();
  s.reset();
  const e = s.spawner.miniBoss,
    p = s.player;
  const deck = s.level.solids.find(
    (r) => r.kind === "platform" && r.x === 5520,
  );
  assert.ok(deck);
  p.reset(5580, deck.y + deck.h);
  let landed = false,
    last = e.x;
  for (let n = 0; n < 120 * 10; n++) {
    p.invincible = 1;
    e.update(dt, p, s.level, s.projectiles);
    assert.ok(
      Math.abs(e.x - last) <= 3,
      "movement is bounded by physical velocity",
    );
    last = e.x;
    if (e.jumpCount > 0 && e.grounded && e.y === deck.y + deck.h) {
      landed = true;
      break;
    }
  }
  assert.ok(landed, JSON.stringify({ x: e.x, y: e.y, jumps: e.jumpCount }));
  assert.ok(e.x < e.spawn.x - 480);
});

test("a rifle soldier posted on a platform can leave its patrol boundary to pursue a player below", () => {
  const f = fixture("ranged", 850, 260, [
    { x: 700, y: 236, w: 300, h: 24, kind: "platform", oneWay: true },
  ]);
  f.p.reset(850, 150);
  let landed = false;
  for (let n = 0; n < 120 * 8; n++) {
    f.tick();
    if (f.e.grounded && f.e.y === 150) landed = true;
  }
  assert.ok(landed);
  assert.ok(Math.abs(f.e.x - f.e.spawn.x) > f.e.spawn.patrol);
});
