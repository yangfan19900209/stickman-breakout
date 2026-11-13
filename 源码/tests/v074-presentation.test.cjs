const { test } = require("node:test"),
  assert = require("node:assert/strict");
const {
  OceanSession,
} = require("../.test-build/assets/scripts/ocean/OceanSession.js");
const {
  OceanEntry: E,
} = require("../.test-build/assets/scripts/ocean/OceanEntry.js");
const {
  oceanMuzzle,
} = require("../.test-build/assets/scripts/ocean/OceanPose.js");
const {
  landGroundTiles,
  landPlatformTiles,
  landExposedEdges,
} = require("../.test-build/assets/scripts/render/LandTerrainPlan.js");
const {
  terrainSurface,
} = require("../.test-build/assets/scripts/render/TerrainSurface.js");
const {
  AbandonedBase,
} = require("../.test-build/assets/scripts/level/LevelData.js");
const {
  ComicFrames,
} = require("../.test-build/assets/scripts/render/ComicFrames.js");
const idle = { axis: 0, vertical: 0, jump: false, shoot: false },
  tick = (s, n, f = idle) => {
    for (let i = 0; i < n; i++) s.update(1 / 120, f);
  };
test("held movement stops at the chest, opening is visible before taking gear, then the hero walks to the ledge", () => {
  const s = new OceanSession();
  tick(s, 120, { ...idle, axis: 1 });
  assert.equal(s.player.x, E.stopX);
  assert.ok(s.player.x < E.chestX - 35);
  const stages = new Set(),
    chest = new Set();
  let walked = false;
  while (s.stage !== "swimming") {
    const old = s.player.x;
    tick(s, 1, { ...idle, axis: 1 });
    const frame = s.snapshot();
    stages.add(frame.entryPhase);
    chest.add(frame.chest.phase);
    if (s.introTime < E.walkAt) assert.equal(s.player.x, E.stopX);
    if (s.introTime > E.walkAt && s.introTime < E.leapAt) {
      assert.ok(s.player.x >= old && s.player.x <= E.ledgeX);
      walked |= s.player.x > old;
    }
  }
  assert.deepEqual([...chest], [0, 1, 2]);
  for (const phase of [
    "reach",
    "open",
    "take",
    "mask",
    "tank",
    "ready",
    "walk",
    "dive",
  ])
    assert.ok(stages.has(phase));
  assert.ok(walked);
  assert.equal(s.player.x, 840);
  assert.equal(s.player.health, 5);
});
test("pausing an open chest freezes both actor and lid; retry closes the same chest", () => {
  const s = new OceanSession();
  tick(s, 180, { ...idle, axis: 1 });
  assert.equal(s.snapshot().chest.phase, 1);
  s.pause();
  const before = s.snapshot();
  tick(s, 240, { ...idle, axis: 1 });
  assert.equal(s.introTime, before.introTime);
  assert.equal(s.player.x, before.player.x);
  assert.deepEqual(s.snapshot().chest, before.chest);
  s.resume();
  tick(s, 80);
  assert.equal(s.snapshot().chest.phase, 2);
  s.reset();
  assert.equal(s.snapshot().chest.phase, 0);
});
test("torpedo fins animate while moving with and without firing, sharing each complete pose muzzle", () => {
  for (const shooting of [false, true]) {
    const s = new OceanSession();
    s.finishEntry();
    s.enemies.forEach((e) => (e.hp = 0));
    s.weapon = "torpedo";
    s.ammo = 200;
    const poses = new Set();
    for (let i = 0; i < 110; i++) {
      tick(s, 1, { ...idle, axis: 1, shoot: shooting });
      const pose = s.heldPose();
      poses.add(pose.frame);
      assert.deepEqual(
        s.muzzle(),
        oceanMuzzle(s.player.x, s.player.y, s.aim, "torpedo", pose, s.player.recoil),
      );
    }
    assert.equal([...poses].filter((p) => p.includes(".swim.")).length, 3);
    tick(s, 1, { ...idle, axis: 1, jump: true });
    assert.ok(s.heldPose().frame.endsWith(".boost"));
  }
});
test("illustrated ground covers all authored terraces down past the viewport and every crop is inside its source", () => {
  const spans = terrainSurface(AbandonedBase.solids),
    tiles = landGroundTiles(spans);
  for (const t of tiles) {
    const [x, y, w, h] = t.crop,
      d = ComicFrames[t.id];
    assert.ok(
      x >= 0 &&
        y >= 0 &&
        w > 0 &&
        h > 0 &&
        x + w <= d.size[0] + 0.001 &&
        y + h <= d.size[1] + 0.001,
      t.id,
    );
  }
  for (const s of spans)
    for (const x of [s.x + 0.1, s.x + s.w / 2, s.x + s.w - 0.1])
      for (const y of [-200, 0, s.top - 25])
        assert.ok(
          tiles.some(
            (t) =>
              x >= t.x - 0.001 &&
              x <= t.x + t.crop[2] * t.scale + 0.001 &&
              y >= t.y - 0.001 &&
              y <= t.y + t.crop[3] * t.scale + 0.001,
          ),
          `hole at ${x},${y}`,
        );
});
test("catwalk art matches both collision faces and preserves full width across endcaps and repeating cores", () => {
  for (const s of AbandonedBase.solids.filter((s) => s.kind === "platform")) {
    const tiles = landPlatformTiles(s.x, s.y + s.h, s.w, s.h);
    assert.ok(
      Math.abs(tiles.reduce((n, t) => n + t.crop[2] * t.scale, 0) - s.w) < 1e-6,
    );
    for (const t of tiles) {
      assert.ok(Math.abs(t.y + (217 - 78) * t.scale - s.y - s.h) < 1e-6);
      assert.ok(Math.abs(t.y + (217 - 124) * t.scale - s.y) < 1e-6);
    }
  }
});

test("deep ground uses only interior material and each exposed terrace side has one full contour",()=>{
  const spans=[{x:3950,w:90,top:200},{x:4040,w:150,top:125},{x:4190,w:80,top:240}],tiles=landGroundTiles(spans);
  for(const s of spans){
    const center=s.x+s.w/2;
    const caps=tiles.filter(t=>t.x<=center&&t.x+t.crop[2]*t.scale>center&&!t.id.startsWith('land.fill.'));
    assert.equal(caps.length,1,'surface art must not repeat vertically');
    for(const y of [-200,-100,0,s.top-40]){
      const covering=tiles.filter(t=>t.x<=center&&t.x+t.crop[2]*t.scale>center&&t.y<=y&&t.y+t.crop[3]*t.scale>y);
      assert.ok(covering.length>0);assert.ok(covering.every(t=>t.id==='land.fill.concrete'));
    }
  }
  const edges=landExposedEdges(spans);
  assert.deepEqual(edges.filter(e=>e.x===4040).map(e=>[e.top,e.bottom,e.inward]),[[200,125,-1]]);
  assert.deepEqual(edges.filter(e=>e.x===4190).map(e=>[e.top,e.bottom,e.inward]),[[240,125,1]]);
  assert.equal(landExposedEdges([{x:0,w:100,top:150},{x:100,w:100,top:150}]).filter(e=>e.x===100).length,0);
});

test("sea surface spans behind the cliff and outside both camera edges with continuous animated swell",()=>{
  const {seaSurfacePoints}=require('../.test-build/assets/scripts/ocean/OceanSurface.js');
  for(const cx of [-80,0,300,460,700]){
    const a=seaSurfacePoints(cx,300,1280,1,650),b=seaSurfacePoints(cx,300,1280,1.5,650);
    assert.ok(a[0].x<-30&&a.at(-1).x>1310);
    assert.ok(a.every(p=>p.y>344&&p.y<356));
    assert.ok(a.some((p,i)=>Math.abs(p.y-b[i].y)>.2));
    assert.deepEqual(a,seaSurfacePoints(cx,300,1280,1,650),'paused time preserves the surface');
    for(let i=1;i<a.length;i++)assert.ok(Math.abs(a[i].y-a[i-1].y)<3);
  }
});
