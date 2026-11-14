const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  OceanSession,
} = require("../.test-build/assets/scripts/ocean/OceanSession.js");
const {
  enemyPattern,
} = require("../.test-build/assets/scripts/ocean/OceanEnemyPatterns.js");
const idle = { axis: 0, vertical: 0, jump: false, shoot: false };
const tick = (s, n, input = idle) => {
  for (let i = 0; i < n; i++) s.update(1 / 120, input);
};
function scene() {
  const s = new OceanSession();
  s.finishEntry();
  s.player.x = 1100;
  s.player.y = 350;
  s.camera.visibleWidth = 1400;
  s.camera.x = 700;
  for (const e of s.enemies) e.hp = 0;
  return s;
}
function foe(s, x, role = "harpoon") {
  const e = s.enemies.find((e) => e.kind === "diver" && e.hp === 0);
  Object.assign(e, {
    x,
    homeX: x,
    y: 350,
    homeY: 350,
    hp: 40,
    maxHp: 40,
    active: true,
    mode: "rest",
    timer: 0,
    role,
    serial: 0,
    attackCounts: {},
    burstLeft: 0,
  });
  return e;
}
test("harpoon is unlimited; finite drops equip and the final shot returns to the same default", () => {
  const s = scene();
  assert.equal(s.weapon, "harpoon");
  tick(s, 150, { ...idle, shoot: true });
  assert.ok(s.shots >= 4);
  assert.equal(s.ammo, 0);
  for (const [weapon, ammo] of [
    ["sonar", 24],
    ["torpedo", 8],
  ]) {
    s.drops.push({
      x: s.player.x,
      y: s.player.y + 30,
      vy: 0,
      kind: weapon,
      active: true,
      source: "fixture-" + weapon,
    });
    tick(s, 1);
    assert.equal(s.weapon, weapon);
    assert.equal(s.ammo, ammo);
    const count = s.shots;
    tick(s, ammo * 90, { ...idle, shoot: true });
    assert.ok(s.shots >= count + ammo);
    assert.equal(s.weapon, "harpoon");
    assert.equal(s.ammo, 0);
  }
});
test("harpoon stops at one target, sonar crosses three targets with exactly one damage event each", () => {
  for (const weapon of ["harpoon", "sonar"]) {
    const s = scene();
    s.weapon = weapon;
    s.ammo = 24;
    const targets = [1240, 1320, 1400].map((x) => {
      const e = foe(s, x);
      e.kind = "turret";
      e.timer = 999;
      return e;
    });
    tick(s, 1, { ...idle, shoot: true });
    tick(s, 115);
    assert.equal(s.shots, 1);
    assert.deepEqual(
      targets.map((e) => e.hp),
      weapon === "harpoon" ? [39, 40, 40] : [38, 38, 38],
    );
  }
});
test("harpoon diver warns then fires one dart in a committed direction without an automatic second shot", () => {
  const s = scene(),
    e = foe(s, 1450);
  tick(s, 1);
  assert.equal(e.mode, "tell");
  tick(s, 70);
  assert.equal(
    s.projectiles.filter((p) => p.active && p.owner === "enemy").length,
    0,
  );
  tick(s, 18);
  const locked = e.angle;
  s.player.y += 90;
  tick(s, 27);
  const shots = s.projectiles.filter((p) => p.active && p.owner === "enemy");
  assert.equal(shots.length, 1);
  assert.ok(
    shots.every((p) => Math.abs(Math.atan2(p.vy, p.vx) - locked) < 1e-6),
  );
  assert.equal(e.burstLeft, 0);
  tick(s, 45);
  assert.equal(e.mode, "rest");
  assert.equal(e.attackCounts.harpoon, 1);
});
test("sonar and torpedo divers telegraph their actual weapons; torpedoes have bounded steering", () => {
  for (const role of ["sonar", "torpedo"]) {
    const s = scene(),
      e = foe(s, 1450, role);
    tick(s, 1);
    assert.equal(e.attack, role);
    tick(s, Math.floor(e.tellDuration*120)-1);
    assert.equal(
      s.projectiles.filter((p) => p.active && p.owner === "enemy").length,
      0,
    );
    tick(s, 14);
    const shot = s.projectiles.find((p) => p.active && p.owner === "enemy");
    assert.ok(shot);
    assert.equal(shot.kind, role);
    if (role === "torpedo") {
      const a = Math.atan2(shot.vy, shot.vx);
      s.player.y += 180;
      tick(s, 12);
      const b = Math.atan2(shot.vy, shot.vx);
      assert.ok(
        Math.abs(Math.atan2(Math.sin(b - a), Math.cos(b - a))) <= 0.06001,
      );
    }
  }
});
test("attack budget caps overlapping warnings and captain cycles charge, spread and torpedoes", () => {
  const s = scene();
  [1360, 1420, 1480].forEach((x) => foe(s, x));
  tick(s, 1);
  assert.equal(
    s.enemies.filter((e) => e.hp > 0 && e.mode === "tell").length,
    2,
  );
  assert.deepEqual(
    [0, 1, 2, 3, 4, 5].map((serial) => enemyPattern({ ...s.mini, serial })),
    ["torpedo", "sweep", "dive", "sonar", "dash", "torpedo"],
  );
});
test("ordinary weapon roles drop no ammunition; hit flash expires while the explosion expands and then clears", () => {
  const s = scene(),
    e = foe(s, 1400, "torpedo");
  s.damageEnemy(e, 100);
  s.damageEnemy(e, 100);
  assert.equal(
    s.drops.filter((d) => d.source === e.id && d.kind === "torpedo").length,
    0,
  );
  const blast = s.effects.find((f) => f.kind === "blast");
  assert.ok(blast && blast.size >= 85);
  s.effect(1200, 400, "hit", 30);
  tick(s, 40);
  assert.equal(
    s.effects.some((f) => f.kind === "hit"),
    false,
  );
  assert.ok(s.effects.includes(blast));
  tick(s, 100);
  assert.equal(s.effects.includes(blast), false);
});
