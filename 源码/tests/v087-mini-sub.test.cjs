const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs");
const { PNG } = require("pngjs");
const {
  OceanSession,
} = require("../.test-build/assets/scripts/ocean/OceanSession.js");
const {
  miniSubPose,
  miniSubBounds,
  MINI_SUB,
} = require("../.test-build/assets/scripts/ocean/OceanMiniSub.js");
const {
  oceanEnemyPose,
  oceanShotVisual,
} = require("../.test-build/assets/scripts/ocean/OceanEnemyPose.js");
const {
  OceanFrames,
} = require("../.test-build/assets/scripts/ocean/OceanFrames.js");
const {
  StaticRectIndex,
} = require("../.test-build/assets/scripts/core/StaticRectIndex.js");
function scene() {
  const s = new OceanSession();
  s.finishEntry();
  s.player.x = 1100;
  s.player.y = 350;
  s.camera.x = 700;
  s.camera.visibleWidth = 1400;
  for (const e of s.enemies) e.hp = 0;
  const e = s.mini;
  Object.assign(e, {
    x: 1450,
    y: 330,
    homeX: 1450,
    homeY: 330,
    hp: 84,
    maxHp: 84,
    mode: "rest",
    timer: 0,
    deadTime: 0,
    angle: Math.PI,
    attackCounts: {},
    serial: 0,
  });
  return { s, e };
}
test("redesigned harpoon keeps a dark narrow shaft and complete backward barbs", () => {
  const p=PNG.sync.read(fs.readFileSync('../素材/游戏美术/source/v0818/harpoon.png'));
  const r=JSON.parse(fs.readFileSync('../开发进度/验证记录/v0818-art.json')).records.find(r=>r.id==='shot.shared.harpoon');
  const [x,y,w,h]=r.crop;let shaft=0;
  for(let iy=y;iy<y+h;iy++)if(p.data[(iy*p.width+Math.floor(x+w*.5))*4+3]>200)shaft++;
  const v=oceanShotVisual('harpoon','player');
  assert.equal(v.id,oceanShotVisual('harpoon','enemy').id);
  assert.equal(v.thickness,1);assert.equal(v.width,72);
  assert.ok(r.darkPixelRatio>.8);assert.ok(shaft/w<.06);
  assert.ok(shaft*v.width/w*390/600>=1,'at least one phone pixel along the narrow shaft');
  assert.ok(v.height>10&&v.height<11);assert.equal(OceanFrames[v.id].file,'combat-v0818');
});
test("mini boss uses a distinct piloted hull in every state, with stable original-pixel scale and footprint", () => {
  const { s, e } = scene();
  const ids = new Set();
  for (const mode of ["rest", "tell", "attack", "dead"])
    for (const hp of [84, 25, 0])
      for (const a of [0, Math.PI]) {
        Object.assign(e, { mode, hp, angle: a });
        const p = oceanEnemyPose(e, 0.2);
        ids.add(p.id);
        assert.match(p.id, /^minisub\./);
        assert.equal(p.scale, 0.28);
        assert.ok(p.width > 185 && p.width < 195);
        assert.ok(p.height > 118 && p.height < 124);
        assert.ok(Math.abs(p.angle) < 1e-8);
        const b = miniSubBounds(e);
        assert.ok(b.w > 170 && b.h > 100);
        assert.ok(p.width > b.w && p.height > b.h);
      }
  assert.ok(ids.has("minisub.wreck"));
  assert.ok(ids.has("minisub.damaged"));
});
test("twin torpedoes leave two visible tubes on both headings; sonar uses the nose emitter", () => {
  for (const heading of [0, Math.PI])
    for (const attack of ["torpedo", "sonar"]) {
      const { s, e } = scene();
      e.angle = heading;
      e.attack = attack;
      e.mode = "attack";
      s.fireEnemy(e);
      const shots = s.projectiles.filter((p) => p.active),
        pose = miniSubPose(e, 0);
      assert.equal(shots.length, attack === "torpedo" ? 2 : 5);
      shots.forEach((p, i) => {
        const m = pose.sockets[attack === "torpedo" ? i + 1 : 0];
        assert.equal(p.kind, attack);
        assert.ok(Math.hypot(p.x - m.x, p.y - m.y) < 1e-6);
        assert.ok(Math.sign(p.vx) === Math.sign(Math.cos(heading)));
      });
      if (attack === "torpedo") {
        assert.ok(Math.abs(shots[0].y - shots[1].y) > 14);
        assert.equal(shots[0].vx, shots[1].vx);
      }
    }
});
test("mini submarine cycles five readable committed attacks without a humanoid harpoon burst", () => {
  const { s, e } = scene();
  s.player.health = 100;
  s.player.maxHealth = 100;
  s.terrainIndex = new StaticRectIndex([]);
  for (let i = 0; i < 4200; i++) {
    s.player.x = e.x - 355;
    s.player.y = 350;
    s.camera.x = e.x - 600;
    s.updateEnemy(e, 1 / 120);
  }
  for (const k of ["torpedo", "sweep", "dive", "sonar", "dash"])
    assert.ok(e.attackCounts[k] > 0, JSON.stringify(e.attackCounts));
  assert.equal(e.attackCounts.harpoon, undefined);
  Object.assign(e, {
    mode: "tell",
    attack: "dash",
    angle: Math.PI,
    timer: 0.2,
    tellDuration: 1.05,
    locked: true,
  });
  s.player.x = e.x + 120;
  s.updateEnemy(e, 0.01);
  assert.equal(e.angle, Math.PI);
});
test("submarine ram reaches a stationary player; moving above the locked hull avoids it", () => {
  for (const dodge of [false, true]) {
    const { s, e } = scene();
    Object.assign(e, { mode: "tell", attack: "dash", timer: 0, locked: true });
    s.player.x = e.x - 350;
    s.player.y = dodge ? e.y + 150 : e.y + 20;
    s.updateEnemy(e, 1 / 120);
    for (let i = 0; i < 150; i++) s.updateEnemy(e, 1 / 120);
    assert.equal(s.player.health, dodge ? 5 : 4);
  }
});
test("wide hull stops at terrain and projectile sockets cannot shoot through intervening walls", () => {
  const { s, e } = scene();
  s.terrainIndex = new StaticRectIndex([{ x: 1280, y: 200, w: 40, h: 400 }]);
  Object.assign(e, {
    mode: "attack",
    attack: "dash",
    timer: 1,
    vx: -430,
    vy: 0,
  });
  for (let i = 0; i < 60; i++) s.updateEnemy(e, 1 / 120);
  assert.ok(e.x >= 1320 + MINI_SUB.halfWidth - 1);
  e.x = 1370;
  e.attack = "torpedo";
  s.fireEnemy(e);
  assert.equal(s.projectiles.filter((p) => p.active).length, 0);
});
test("mini wreck stages two secondary bursts and awards its reward exactly once", () => {
  const { s, e } = scene();
  const before = s.kills;
  s.damageEnemy(e, 999);
  for (let i = 0; i < 25; i++) s.updateEnemy(e, 0.1);
  s.damageEnemy(e, 999);
  assert.equal(s.kills, before + 1);
  assert.equal(s.drops.filter(d=>d.source===e.id+"-recovery").length,1);
  assert.equal(s.drops.filter((d) => d.source === e.id).length, 0);
  assert.equal(s.effects.filter((f) => f.kind === "blast").length, 3);
  assert.equal(miniSubPose(e, s.time).id, "minisub.wreck");
  assert.ok(e.deadTime > MINI_SUB.deathDuration);
});
