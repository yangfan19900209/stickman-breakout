const { test } = require("node:test"),
  assert = require("node:assert/strict");
const {
  OceanSession,
} = require("../.test-build/assets/scripts/ocean/OceanSession.js");
const {
  OceanLevel: L,
} = require("../.test-build/assets/scripts/ocean/OceanLevel.js");
const {
  oceanEnemyPose,
  oceanShotVisual,
} = require("../.test-build/assets/scripts/ocean/OceanEnemyPose.js");
const {
  EnemyPoses,
  CombatRegions,
} = require("../.test-build/assets/scripts/ocean/OceanCombatFrames.js");
const { overlaps } = require("../.test-build/assets/scripts/core/Types.js");
const { FeedbackRegions } = require("../.test-build/assets/scripts/ocean/OceanFeedbackFrames.js");
const idle = { axis: 0, vertical: 0, jump: false, shoot: false },
  dt = 1 / 120;
function scene() {
  const s = new OceanSession();
  s.finishEntry();
  s.player.x = 1100;
  s.player.y = 350;
  s.camera.x = 700;
  s.camera.visibleWidth = 1400;
  for (const e of s.enemies) e.hp = 0;
  return s;
}
function foe(s, kind = "diver", x = 1450, y = 350) {
  const e = s.enemies.find((e) => e.kind === kind);
  Object.assign(e, {
    x,
    y,
    homeX: x,
    homeY: y,
    hp: 60,
    maxHp: 60,
    active: true,
    mode: "rest",
    timer: 0,
    angle: Math.PI,
    dodgeCooldown: 0,
    attackCounts: {},
    serial: 0,
  });
  return e;
}
function tick(s, n, input = idle) {
  for (let i = 0; i < n; i++) s.update(dt, input);
}
test("all diver loadouts fire their visible weapon from the same rotated/mirrored socket", () => {
  for (const role of ["harpoon", "sonar", "torpedo"])
    for (const angle of [0, Math.PI, 0.7, 2.4]) {
      const s = scene(),
        e = foe(s);
      Object.assign(e, {
        role,
        attack: role,
        mode: "attack",
        angle,
        burstLeft: 1,
      });
      const pose = oceanEnemyPose(e, s.time);
      s.fireEnemy(e);
      const shot = s.projectiles.find((p) => p.active);
      assert.equal(shot.kind, role);
      assert.match(pose.id, new RegExp("enemy." + role));
      assert.ok(
        Math.hypot(shot.x - pose.muzzle.x, shot.y - pose.muzzle.y) < 1e-6,
      );
      assert.ok(Math.abs(Math.atan2(shot.vy, shot.vx) - angle) < 1e-6);
    }
});
test("fish charge reaches a stationary player from its full warning range, while a late lateral dodge succeeds", () => {
  for (const evade of [false, true]) {
    const s = scene(),
      e = foe(s, "fish", 1525, 350);
    s.player.health = 5;
    tick(s, 1);
    assert.equal(e.mode, "tell");
    while (!e.locked) tick(s, 1);
    tick(s, 130, evade ? { ...idle, vertical: 1 } : idle);
    assert.equal(s.player.health, evade ? 5 : 4);
    assert.ok(e.attackCounts.dash >= 1);
  }
});
test("fish swept charge stops against a real reef without damaging a player on the other side", () => {
  const s = scene(),
    e = foe(s, "fish", 2040, 100);
  s.player.x = 1450;
  s.player.y = 100;
  Object.assign(e, {
    mode: "attack",
    attack: "dash",
    vx: -625,
    vy: 0,
    timer: 1,
    angle: Math.PI,
  });
  for (let i = 0; i < 100; i++) s.updateEnemy(e, dt);
  assert.equal(s.player.health, 5);
  assert.ok(e.x > 1700);
  assert.notEqual(e.mode, "attack");
});
test("diver reacts after delay, makes one bounded dodge, remains vulnerable and cannot cancel a committed warning", () => {
  const s = scene(),
    e = foe(s, "diver", 1390, 350);
  s.spawnShot("player", "harpoon", 1120, 382, 720, 0, 3, 2);
  tick(s, 1);
  assert.equal(e.dodges, 0);
  // Hold recovery to observe perception before starting an attack.
  Object.assign(e, { mode: "rest", timer: 2 });
  const start = { x: e.x, y: e.y };
  tick(s, 25);
  assert.equal(e.dodges, 1);
  assert.equal(e.mode, "dodge");
  const hp = e.hp;
  s.damageEnemy(e, 3);
  assert.equal(e.hp, hp - 3);
  tick(s, 30);
  assert.ok(Math.hypot(e.x - start.x, e.y - start.y) < 110);
  assert.equal(e.dodges, 1);
  assert.ok(e.dodgeCooldown > .9);
  Object.assign(e, {
    mode: "tell",
    timer: 0.5,
    tellDuration: 0.7,
    dodgeCooldown: 0,
  });
  s.spawnShot("player", "harpoon", e.x - 220, e.y + 32, 720, 0, 3, 2);
  tick(s, 16);
  assert.equal(e.mode, "tell");
  assert.equal(e.dodges, 1);
});
test("actor scale is fixed across movement, tells, fire, evasions and death; projectile families share size", () => {
  const s = scene(),
    e = foe(s);
  for (const role of ["harpoon", "sonar", "torpedo"])
    for (const mode of ["rest", "tell", "attack", "dodge", "dead"])
      for (const time of [0, 0.2, 0.4]) {
        Object.assign(e, { role, mode, vx: 60, vy: 0 });
        const pose = oceanEnemyPose(e, time);
        assert.equal(pose.scale, 0.235);
        assert.ok(CombatRegions[pose.id]);
        assert.ok(EnemyPoses[pose.id].muzzle.every(Number.isFinite));
      }
  for (const kind of ["harpoon", "sonar", "torpedo"]) {
    const p = oceanShotVisual(kind, "player"),
      e = oceanShotVisual(kind, "enemy");
    assert.equal(p.width, e.width);
    assert.ok(Math.max(p.width, p.height) >= 34);
    assert.ok((FeedbackRegions[p.id] || CombatRegions[p.id]) && (FeedbackRegions[e.id] || CombatRegions[e.id]));
  }
});
test("longer route adds populated post-captain encounters with readable spaces and valid floor supports", () => {
  assert.equal(L.width, 16400);
  assert.equal(L.arena, 15200);
  assert.equal(L.enemies.length, 44);
  for (const z of L.zones.filter((z) =>
    ["海沟伏击", "船坞外环"].includes(z.name),
  )) {
    assert.ok(
      L.enemies.filter((e) => e[1] >= z.start && e[1] < z.end).length >= 6,
    );
    assert.ok(
      L.landforms.filter((r) => r.x >= z.start && r.x < z.end).length >= 3,
    );
  }
  const s = new OceanSession();
  assert.equal(s.boss.x, L.arena + 660);
  for (const e of s.enemies.filter(
    (e) => e.homeX > 10800 && e.kind === "diver",
  ))
    assert.ok(
      !L.obstacles.some((r) => overlaps(s.enemyBounds(e), r)),
      e.id + " starts inside cover",
    );
});
test("coordinated fire stays bounded even when a crowd is ready, and reset clears dodge state", () => {
  const s = scene();
  for (let i = 0; i < 20; i++) {
    const e = s.enemies[i];
    Object.assign(e, {
      kind: "diver",
      role: "harpoon",
      attack: "harpoon",
      x: 1350,
      y: 350,
      angle: Math.PI,
      burstLeft: 1,
    });
    s.fireEnemy(e);
  }
  assert.equal(
    s.projectiles.filter((p) => p.active && p.owner === "enemy").length,
    14,
  );
  assert.equal(s.projectiles.length, 96);
  s.enemies[0].dodges = 7;
  s.reset();
  assert.ok(s.enemies.every((e) => e.dodges === 0 && e.reaction === 0));
});
