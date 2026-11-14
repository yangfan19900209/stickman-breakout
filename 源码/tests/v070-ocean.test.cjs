const { test } = require("node:test"),
  assert = require("node:assert/strict");
const {
  OceanSession,
} = require("../.test-build/assets/scripts/ocean/OceanSession.js");
const {
  OceanLevel,
} = require("../.test-build/assets/scripts/ocean/OceanLevel.js");
const {
  oceanMuzzle,
  OceanGunPoses,
} = require("../.test-build/assets/scripts/ocean/OceanPose.js");
const { OceanBrain } = require("../scripts/ocean-brain.cjs");
const { writeFileSync } = require("node:fs");
const idle = { axis: 0, vertical: 0, jump: false, shoot: false };
const tick = (s, n, input = idle) => {
  for (let i = 0; i < n; i++) s.update(1 / 120, input);
};
const swim = () => {
  const s = new OceanSession();
  s.finishEntry();
  s.camera.visibleWidth = 1400;
  return s;
};
test("sea entry is safe, pausable and retry skip restores the identical swim state", () => {
  const s = new OceanSession();
  tick(s, 160, { ...idle, axis: 1 });
  assert.equal(s.stage, "equipping");
  s.pause();
  const t = s.introTime;
  tick(s, 200);
  assert.equal(s.introTime, t);
  s.resume();
  tick(s, 900);
  assert.equal(s.stage, "swimming");
  assert.equal(s.player.health, 5);
  s.reset();
  assert.equal(s.introSeen, true);
  tick(s, 160, { ...idle, axis: 1 });
  s.skipEntry();
  assert.equal(s.player.x, 840);
  assert.equal(s.player.y, 360);
  assert.equal(s.player.vx, 0);
});
test("swim diagonal speed is normalized, release brakes and boost cannot cross rock", () => {
  const a = swim(),
    b = swim();
  a.enemies = b.enemies = [];
  // Isolated movement fixtures do not run the combat session's required captain lookup.
  a.enemies = [{ ...new OceanSession().mini, hp: 0 }];
  b.enemies = [{ ...new OceanSession().mini, hp: 0 }];
  tick(a, 50, { ...idle, axis: 1 });
  tick(b, 50, { ...idle, axis: 1, vertical: 1 });
  assert.ok(
    Math.abs(
      Math.hypot(a.player.vx, a.player.vy) -
        Math.hypot(b.player.vx, b.player.vy),
    ) < 0.001,
  );
  tick(a, 70);
  assert.ok(Math.abs(a.player.vx) < 0.01);
  a.player.x = OceanLevel.landforms[0].x-70;
  a.player.y = 150;
  tick(a, 70, { ...idle, axis: 1, jump: true });
  const form=OceanLevel.landforms[0];
  const wall = Math.min(...OceanLevel.obstacles.filter(o => o.art===form.art && o.x>=form.x && o.x<form.x+form.w && o.y<a.player.y+68 && o.y+o.h>a.player.y).map(o=>o.x));
  assert.ok(a.player.x<=wall-18+.01,'boost stops at actual reef silhouette');

});
test("sonar collision stops at the nearest wall and charged waves hit each enemy only once", () => {
  const s = swim();
  s.player.x = 1550;
  s.player.y = 130;
  s.enemies.forEach((e) => (e.active = false));
  s.camera.x = 1200;
  tick(s, 100, { ...idle, shoot: true });
  assert.ok(
    s.projectiles
      .filter((p) => p.active && p.owner === "player")
      .every((p) => p.x < 1650),
  );
  const t = swim();
  t.player.x = 1100;
  t.player.y = 350;
  t.weapon = "sonar";
  t.ammo = 12;
  const e = t.enemies[0];
  e.x = 1280;
  e.y = e.homeY = 350;
  e.hp = e.maxHp = 30;
  e.timer = 100;
  tick(t, 1, { ...idle, shoot: true });
  tick(t, 100);
  assert.equal(e.hp, 28); // One contact, two health pips under the shared weapon rule.
});
test("contextual knife protects the entire held press across crate destruction and weapon collection", () => {
  const s = swim();
  s.player.x = 1130;
  s.player.y = 90;
  s.weapon = s.storedWeapon = "torpedo";
  s.ammo = 6;
  tick(s, 240, { ...idle, shoot: true });
  assert.equal(s.crates[0].hp, 0);
  assert.equal(s.shots, 0);
  assert.ok(s.knifeSerial > 0);
  tick(s, 1);
  s.player.x = 1300;
  tick(s, 60, { ...idle, shoot: true });
  assert.ok(s.shots > 0);
});
test("medical drops are conditional, unique and settle on actual support", () => {
  const s = swim();
  s.player.x = 8410;
  tick(s, 1);
  assert.equal(s.recoveryUsed.size, 0);
  s.player.health = 3;
  tick(s, 1);
  assert.equal(s.recoveryUsed.size, 1);
  s.player.x = 8610;
  tick(s, 500);
  assert.equal(s.drops.filter((d) => d.kind === "medkit").length, 1);
  const d = s.drops.find((d) => d.kind === "medkit");
  if (d.active) assert.equal(d.y, 90);
  s.reset();
  assert.equal(s.recoveryUsed.size, 0);
});
test("all aimed cannon muzzle positions are rotated and mirrored with the complete held pose", () => {
  for (const weapon of ["harpoon", "sonar", "torpedo"])
    for (const angle of [
      0,
      Math.PI / 4,
      Math.PI / 2,
      -Math.PI / 2,
      Math.PI,
      Math.PI * 1.25,
    ]) {
      const p = oceanMuzzle(100, 200, angle, weapon),
        d = OceanGunPoses[weapon];
      assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y));
      const along =
        (p.x - 100) * Math.cos(angle) + (p.y - 238) * Math.sin(angle);
      assert.ok(Math.abs(along - (d.muzzle[0] - d.pivot[0]) * d.scale) < 0.001);
    }
});
test("submarine parts do not revive, laser stops immediately and one blast cannot multiply hull damage", () => {
  const s = swim();
  s.player.x = 11300;
  s.boss.active = true;
  s.boss.beamActive = true;
  s.boss.attack = "laser";
  s.damageBoss(30, s.boss.x - 70, s.boss.y + 140, "laserHp");
  assert.equal(s.boss.laserHp, 0);
  assert.equal(s.boss.beamActive, false);
  const before = s.boss.hp;
  s.blastQueue.push({
    x: s.boss.x - 70,
    y: s.boss.y + 105,
    r: 300,
    damage: 10,
    owner: "player",
  });
  s.flushBlasts();
  assert.equal(s.boss.hp, before - 10);
  s.boss.hp = 30;
  tick(s, 1500);
  assert.equal(s.boss.laserHp, 0);
  assert.equal(s.boss.attackCounts.laser, undefined);
  assert.equal(s.boss.attackCounts.sweep, undefined);
});
test("victory clears threats, freezes clear time, pauses and cannot consume held weapons", () => {
  const s = swim();
  s.boss.active = true;
  s.boss.hp = 0;
  tick(s, 1);
  const time = s.time,
    health = s.player.health;
  assert.equal(s.victory.active, true);
  assert.equal(s.projectiles.filter((p) => p.active).length, 0);
  s.pause();
  tick(s, 120);
  assert.equal(s.victory.time, 0);
  s.resume();
  tick(s, 850, { ...idle, shoot: true, grenade: true, jump: true });
  assert.equal(s.state, "complete");
  assert.equal(s.time, time);
  assert.equal(s.player.health, health);
  assert.equal(s.player.grenades, 3);
  assert.equal(s.victory.impactSerial, 5);
});
test("submarine cycles through five warned attacks and collision blocks both sides without teleportation", () => {
  const s = swim();
  s.player.x = OceanLevel.arena + 100;
  s.player.y = 220;
  s.player.invincible = 100;
  s.boss.active = true;
  s.boss.hp = 55;
  tick(s, 120 * 45);
  for (const attack of ["cannon", "fan", "torpedo", "laser", "sweep"])
    assert.ok(s.boss.attackCounts[attack] > 0, attack);
  s.boss.timer = 100;
  s.boss.mode = "rest";
  s.player.x = s.boss.x + 350;
  s.player.y = s.boss.y;
  tick(s, 70, { ...idle, axis: -1 });
  assert.ok(
    s.player.x >= s.boss.x + 317,
    "Right face keeps the player on the right",
  );
  s.player.x = s.boss.x - 350;
  tick(s, 70, { ...idle, axis: 1 });
  assert.ok(
    s.player.x <= s.boss.x - 317,
    "Left face keeps the player on the left",
  );
});
test("the last torpedo retains its held pose and spawn socket when ammunition falls back to harpoon", () => {
  const s = swim();
  s.weapon = "torpedo";
  s.ammo = 1;
  tick(s, 1, { ...idle, shoot: true });
  assert.equal(s.weapon, "harpoon");
  assert.equal(s.lastShotWeapon, "torpedo");
  const shot = s.projectiles.find((p) => p.active && p.owner === "player");
  assert.equal(shot.kind, "torpedo");
  assert.ok(
    Math.hypot(shot.x - s.lastShotMuzzle.x, shot.y - s.lastShotMuzzle.y) < 5,
  );
});
test("fixed sea enemies share the actual visible supporting surface",()=>{
  const s=swim();for(const e of s.enemies.filter(e=>e.kind==='turret'))assert.ok(Math.abs(e.y-s.supportY(e.x,e.y))<1e-7,e.id);
});
test("chapter has full-length encounters and is completable with normal input only", () => {
  assert.equal(OceanLevel.width, 16400);
  assert.ok(
    OceanLevel.enemies.filter((e) => e[1] > 6200 && e[1] < 10800).length >= 10,
  );
  const s = new OceanSession(),
    brain = new OceanBrain(),
    checkpoints = [];
  let zone = "";
  for (
    let i = 0;
    i < 120 * 240 &&
    s.state !== "gameover" &&
    !(s.state === "complete" && s.victory.resultsReady);
    i++
  ) {
    s.camera.x = Math.max(0, s.player.x - 400);
    s.camera.visibleWidth = 1400;
    s.updateCamera(1 / 120, 600);
    s.update(1 / 120, brain.next(s.snapshot()));
    if (s.zone.name !== zone) {
      zone = s.zone.name;
      checkpoints.push({
        zone,
        time: s.time,
        hp: s.player.health,
        x: s.player.x,
      });
    }
  }
  writeFileSync(
    "../开发进度/验证记录/current-ocean-model-playtest.json",
    JSON.stringify({ checkpoints, final: s.snapshot() }, null, 2),
  );
  assert.equal(s.state, "complete");
  assert.ok(s.player.health > 0);
  assert.equal(s.boss.hp, 0);
  assert.equal(s.mini.hp, 0);
});
