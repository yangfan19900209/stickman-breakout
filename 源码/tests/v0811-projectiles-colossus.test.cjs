const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  vm = require("node:vm"),
  path = require("node:path");
const root = path.resolve(".test-build/assets/scripts"),
  load = (p) => require(path.join(root, p + ".js"));
const { ColossusBoss } = load("enemy/ColossusBoss"),
  { PlayerController } = load("player/PlayerController"),
  { LevelController } = load("level/LevelController"),
  { ProjectileManager } = load("combat/ProjectileManager"),
  { ParticlePool } = load("combat/ParticlePool");
const { projectileProfile } = load("combat/ProjectileProfile"),
  { colossusPresentation, colossusSocket } = load(
    "render/ColossusPresentation",
  ),
  { GameConfig: C } = load("core/GameConfig");
const dt = 1 / 120;
function fixture(sequence = 0) {
  const level = new LevelController({
    name: "final fight",
    width: 3000,
    spawn: { x: 1320, y: 150 },
    exit: { x: 2900, y: 150 },
    arena: { start: 0, end: 3000 },
    objects: [],
    enemies: [],
    solids: [{ x: 0, y: 0, w: 3000, h: 150, kind: "ground" }],
  });
  level.arenaEntered = true;
  const b = new ColossusBoss({
      id: "boss",
      kind: "colossus",
      x: 1800,
      y: 150,
      patrol: 0,
      encounter: "final",
    }),
    p = new PlayerController(),
    shots = new ProjectileManager(new ParticlePool());
  p.reset(1320, 150);
  b.introduced = true;
  b.sequence = sequence;
  b.movedBeforeAttack = true;
  b.attackCooldown = 0;
  return {
    b,
    p,
    shots,
    level,
    tick() {
      b.update(dt, p, level, shots);
    },
    until(predicate, limit = 120 * 10) {
      for (let n = 0; n < limit; n++) {
        b.update(dt, p, level, shots);
        if (predicate()) return;
      }
      assert.fail("state not reached " + b.mode);
    },
  };
}
function moduleWith(file, overrides) {
  const exports = {};
  vm.runInNewContext(fs.readFileSync(path.join(root, file + ".js"), "utf8"), {
    exports,
    require: (p) =>
      p in overrides
        ? overrides[p]
        : require(path.resolve(root, path.dirname(file), p)),
  });
  return exports;
}

test("actual comic rendering uses the same projectile family for both sides and larger boss ammunition", () => {
  const { ComicCombatArt } = moduleWith("render/ComicCombatArt", {
    cc: { UITransform: "size", Color: class {} },
    "./Ink": {},
    "./ComicAssets": { ComicAssets: { enabled: true } },
  });
  const art = new ComicCombatArt();
  const tints=[];
  art.batch = {
    tintLast(rgb) { tints.push([...rgb]); },
    put(id, x, y, w, h, angle) {
      return {
        position: { x, y },
        angle,
        getComponent: () => ({ contentSize: { width: w, height: h } }),
      };
    },
    putRegion(id, x, y, scale, crop, angle) {
      const transform = {contentSize:{width:crop[2]*scale,height:crop[3]*scale},setContentSize(w,h){this.contentSize={width:w,height:h};}};
      return {
        position: { x, y },
        angle,
        getComponent: () => transform,
      };
    },
  };
  for (const owner of ["player", "enemy"])
    for (const kind of ["bullet", "rocket", "cannon"]) {
      for (const tier of ["standard", "mini", "boss"])
        art.projectile(
          {
            owner,
            kind,
            tier,
            x: 900,
            y: 200,
            vx: -400,
            vy: 0,
            age: 1,
            distance: 500,
            visual: owner === "enemy" ? "mech-shell" : undefined,
          },
          0,
        );
    }
  const records = art.renderedProjectiles;
  assert.equal(tints.length,0,'physical ammunition retains the monochrome art for every owner and tier');
  for (const kind of ["bullet", "rocket", "cannon"]) {
    const a = records.find(
        (r) => r.owner === "player" && r.kind === kind && r.tier === "standard",
      ),
      e = records.find(
        (r) => r.owner === "enemy" && r.kind === kind && r.tier === "standard",
      );
    assert.equal(a.frame, e.frame);
    assert.equal(a.width, e.width);
    assert.equal(a.height, e.height);
    const mini = records.find(
        (r) => r.owner === "enemy" && r.kind === kind && r.tier === "mini",
      ),
      boss = records.find(
        (r) => r.owner === "enemy" && r.kind === kind && r.tier === "boss",
      );
    assert.ok(Math.abs(mini.width / a.width - 1.15) < 1e-9);
    assert.ok(Math.abs(boss.width / a.width - 1.25) < 1e-9);
  }
  assert.equal(
    records.find((r) => r.kind === "cannon").frame,
    "projectile.rocket",
  );
});

test("enemy rocket reveal and smoke share the full-size tail contract, and pool reuse clears boss tier", () => {
  const q = new ProjectileManager(new ParticlePool()),
    target = { alive: false, bounds: { x: 0, y: 0, w: 1, h: 1 } };
  q.spawn({
    owner: "enemy",
    x: 1000,
    y: 600,
    direction: -1,
    speed: 300,
    damage: 1,
    range: 1000,
    kind: "rocket",
    tier: "boss",
  });
  const p = q.items[0],
    full = projectileProfile(p).width;
  for (let n = 0; n < 30; n++) q.update(dt, target, [], []);
  assert.ok(p.distance < full - 10);
  assert.equal(
    q.particles.items.filter((x) => x.active && x.kind === "smoke").length,
    0,
  );
  for (let n = 0; n < 35; n++) q.update(dt, target, [], []);
  const smoke = q.particles.items.find((x) => x.active && x.kind === "smoke");
  assert.ok(smoke);
  assert.ok(smoke.x > p.x + full - 4);
  p.active = false;
  q.spawn({
    owner: "enemy",
    x: 500,
    y: 200,
    direction: 1,
    speed: 360,
    damage: 1,
    range: 500,
  });
  assert.equal(q.items[0].tier, "standard");
  assert.equal(q.items[0].visual, undefined);
});

test("boss body, feet and every firing socket share one scale in both directions", () => {
  const f = fixture(),
    b = f.b;
  assert.equal(b.maxHealth, C.enemies.colossus.health);
  assert.equal(b.bounds.w, C.colossus.halfWidth * 2 * C.colossus.sizeScale);
  assert.equal(b.bounds.h, (C.colossus.height - C.colossus.hitInset * 2) * C.colossus.sizeScale);
  for (const action of [
    "walk",
    "laser",
    "missiles",
    "charge",
    "leap",
    "stomp",
  ]) {
    Object.assign(b, { attack: action, windup: 1, recoil: 0 });
    const v = colossusPresentation(b);
    assert.ok(v.scale > 0);
    for (const socket of ["muzzle", "core", "leftPod", "rightPod"]) {
      b.facing = -1;
      const l = colossusSocket(b, socket);
      b.facing = 1;
      const r = colossusSocket(b, socket);
      assert.ok(Math.abs(l.x + r.x - b.x * 2) < 1e-8);
      assert.equal(l.y, r.y);
    }
  }
});

test("armored charge has a locked tell, damages a stationary target and allows retreat from its committed endpoint", () => {
  for (const dodge of [false, true]) {
    const f = fixture(1);
    f.tick();
    assert.equal(f.b.attack, "charge");
    assert.ok(f.b.windup >= 1);
    const end = f.b.chargeEndX,
      start = f.b.x;
    while (f.b.windup > 0) {
      if (dodge) f.p.x -= C.player.speed * dt;
      f.tick();
      assert.equal(f.b.chargeEndX, end);
      assert.equal(f.b.x, start);
      assert.equal(f.p.health, 5);
    }
    for (let n = 0; n < 150 && f.b.mode === "charging"; n++) f.tick();
    assert.equal(f.b.mode, "recovering");
    assert.equal(f.p.health, dodge ? 5 : 4);
    assert.ok(f.b.x < start - 300);
    assert.ok(f.b.attackCooldown > 0.7);
  }
});

test("charge and leap stop at real geometry; leap locks its landing and emits impact only on touchdown", () => {
  const wall = { x: 1510, y: 150, w: 35, h: 600, kind: "step" };
  for (const sequence of [1, 3]) {
    const f = fixture(sequence);
    f.level.solids.push(wall);
    f.tick();
    const target = f.b.leapTargetX;
    if (sequence === 3) {
      f.p.x = 2450;
      assert.ok(f.b.windup > 0.8);
    }
    f.until(() => ["charging", "leaping"].includes(f.b.mode));
    const impact = f.b.impactSerial;
    if (sequence === 3) {
      assert.equal(f.b.leapTargetX, target);
      assert.equal(f.b.impactSerial, impact);
    }
    for (
      let n = 0;
      n < 240 && ["charging", "leaping"].includes(f.b.mode);
      n++
    ) {
      f.tick();
      assert.ok(f.b.x - f.b.halfWidth >= wall.x + wall.w - 0.01);
      if (!f.b.grounded) assert.equal(f.b.impactSerial, impact);
    }
    assert.equal(f.b.mode, "recovering");
    assert.equal(f.b.y, 150);
    assert.ok(f.b.grounded);
    assert.equal(f.b.impactSerial, impact + (sequence === 3 ? 1 : 0));
  }
});

test("phase two keeps vulnerability, switches to mobility combinations and preserves gravity on retreat or death", () => {
  const f = fixture();
  f.b.active = true;
  f.b.takeDamage(100, 1);
  f.tick();
  assert.equal(f.b.mode, "enraging");
  const hp = f.b.health;
  assert.ok(f.b.takeDamage(1, 1));
  assert.equal(f.b.health, hp - 1);
  f.until(() => f.b.mode === "leaping");
  assert.equal(f.b.attack, "leap");
  assert.equal(f.b.attackCounts.leap, 1);
  f.until(() => f.b.grounded);
  f.p.invincible = 1;
  f.until(() => f.b.windup > 0);
  assert.equal(f.b.attack, "burst");
  for (const reason of ["retreat", "death"]) {
    const g = fixture(3);
    g.until(() => g.b.y > 210);
    assert.ok(!g.b.grounded);
    const impacts = g.b.impactSerial;
    if (reason === "death") g.b.takeDamage(999, 1);
    else g.level.arenaEntered = false;
    for (let n = 0; n < 180; n++) g.tick();
    assert.equal(g.b.y, 150);
    assert.ok(g.b.grounded);
    assert.equal(g.b.impactSerial, impacts + (reason === "retreat" ? 1 : 0));
    assert.equal(g.b.beam.active, false);
  }
});

test('arena framing includes the enlarged body and warns of the full leap before takeoff', () => {
  const {colossusArenaZoom}=load('render/ColossusPresentation');
  const f=fixture(),b=f.b;
  for(const ceiling of [500,555,610]){
    Object.assign(b,{mode:'aiming',attack:'leap',windup:.95,y:150});
    const zoom=colossusArenaZoom(b,150,ceiling,220);
    const apex=C.colossus.leapVelocity**2/(2*C.player.gravity);
    for(const rise of [0,apex/2,apex]){
      Object.assign(b,{mode:'leaping',windup:0,y:150+rise});
      const pose=colossusPresentation(b);
      const top=220+(rise+pose.height*(1-pose.anchor[1]))*zoom;
      assert.ok(top<ceiling-12,'jump head overlaps HUD');
      assert.ok(220+264*C.colossus.sizeScale*zoom<ceiling);
    }
    Object.assign(b,{mode:'aiming',attack:'salvo',windup:1,y:150});
    const standing=colossusArenaZoom(b,150,ceiling,220);
    assert.ok(standing>zoom,'prepare wider framing specifically for the leap');
    assert.ok(220+(b.height+59)*standing<ceiling-12,'warning overlaps HUD');
  }
});
