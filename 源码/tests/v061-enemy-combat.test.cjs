const { test } = require("node:test");
const assert = require("node:assert/strict");
const load = (p) => require(`../.test-build/assets/scripts/${p}.js`);
const { EnemyController } = load("enemy/EnemyController");
const { TankBoss } = load("enemy/TankBoss");
const { PlayerController } = load("player/PlayerController");
const { LevelController } = load("level/LevelController");
const { ProjectileManager } = load("combat/ProjectileManager");
const { ParticlePool } = load("combat/ParticlePool");
const { GameConfig: C } = load("core/GameConfig");

function fixture(kind, dist = 200) {
  const level = new LevelController({
    name: "combat fairness", width: 2400, spawn: { x: 300, y: 150 },
    solids: [{ x: 0, y: 0, w: 2400, h: 150, kind: "ground" }],
    objects: [], enemies: [], exit: { x: 2300, y: 150 },
  });
  const p = new PlayerController();
  p.reset(300, 150);
  const data = { id: "test", kind, x: 300 + dist, y: 150, patrol: 30, encounter: "mini" };
  const e = kind === "guard" ? new TankBoss(data) : new EnemyController(data);
  const shots = new ProjectileManager(new ParticlePool());
  return { e, p, level, shots, tick(n) { for (let i=0;i<n;i++) e.update(1/120,p,level,shots); } };
}

test("rocket soldier commits to the warned direction when the player crosses behind it", () => {
  const f = fixture("turret");
  f.e.attackCooldown = 0;
  f.tick(1);
  assert.equal(f.e.action, "lock");
  const pitch = f.e.aimPitch;
  f.p.x = f.e.x + 200;
  for (let i=0;i<150 && f.shots.fired===0;i++) {
    assert.equal(f.e.facing,-1);
    f.tick(1);
  }
  const round = f.shots.items.find(p => p.active);
  assert.ok(round && round.vx < 0);
  assert.equal(f.e.facing, -1);
  assert.equal(f.e.aimPitch, pitch);
  assert.ok(Math.abs(Math.hypot(round.vx,round.vy)-240)<1e-8);
});

test("knife and shield attacks cannot hit through cover or turn into a player who dodged behind", () => {
  for (const kind of ["melee", "shield"]) for (const dodge of [false,true]) {
    const f = fixture(kind,44);
    f.e.attackCooldown = 0;
    f.tick(1);
    assert.ok(["swing","bash"].includes(f.e.action));
    if (dodge) f.p.x = f.e.x + 40;
    else f.level.solids.push({x:315,y:150,w:12,h:70,kind:"step"});
    f.tick(58);
    assert.equal(f.p.health,5,`${kind}, dodge=${dodge}`);
  }
  const clear = fixture("melee",44);
  clear.e.attackCooldown = 0;
  clear.tick(50);
  assert.equal(clear.p.health,4,"unobstructed committed strike still damages");
});

test("a rocket muzzle beyond newly inserted cover cannot spawn a shot through that cover", () => {
  const f = fixture("turret");
  f.e.attackCooldown = 0;
  f.tick(1);
  const wall={x:480,y:150,w:6,h:100,kind:"step"};
  f.level.solids.push(wall);
  f.tick(130);
  const shot = f.shots.items.find(p=>p.active);
  assert.ok(shot && shot.x < wall.x);
  assert.equal(shot.originX,500);
  f.shots.update(1/120,f.p,[],f.level.solids);
  assert.equal(shot.active,false);
  assert.equal(f.p.health,5);
});

test("rifle soldiers telegraph, fire two slower separated rounds and leave a reload window", () => {
  const f = fixture("ranged");
  f.tick(80);
  assert.equal(f.shots.fired,0);
  f.tick(54);
  assert.equal(f.shots.fired,2);
  for (const p of f.shots.items.filter(p=>p.active)) {
    assert.ok(Math.abs(Math.hypot(p.vx,p.vy)-360)<1e-8);
    assert.equal(p.range,900);
  }
  f.tick(25);
  assert.equal(f.e.action,"reload");
  f.tick(150);
  assert.equal(f.shots.fired,2);
});

test("the mini tank closes distance, cycles its four attacks, and fires a locked burst with recovery", () => {
  const f=fixture("guard",500), modes=new Set();
  let previous=0, burstCount=0, locked;
  for(let i=0;i<120*18;i++) {
    f.tick(1);
    if(f.e.windup>0) {
      modes.add(f.e.attack);
      if(f.e.attack==="burst" && locked===undefined) {
        locked=f.e.aimPitch;
        f.p.y+=110;
      }
    }
    if(f.shots.fired>previous) {
      const shot=f.shots.items.filter(p=>p.active).at(-1);
      if(f.e.attack==="burst" && f.e.attackCounts.burst===1) {
        burstCount++;
        assert.equal(f.e.aimPitch,locked);
        assert.equal(shot.gravity,0);
        assert.equal(shot.blastRadius,0);
        assert.ok(Math.abs(Math.hypot(shot.vx,shot.vy)-300)<1e-8);
        assert.ok(f.e.attackCooldown>0.35,"tank exposes a recovery window after firing");
      }
      previous=f.shots.fired;
    }
  }
  assert.deepEqual([...modes].sort(),["bombard","burst","fan","ram"]);
  assert.equal(burstCount,2);
  f.p.x=2000;
  f.tick(1);
  assert.equal(f.e.warningTime,0);
  assert.equal(f.e.windup,0);
  assert.equal(f.e.warningPoints.length,0);
});

test("phase-two tank shells use each marked landing height on uneven ground", () => {
  const f=fixture("guard",500);
  const ground=[{x:0,y:0,w:160,h:150,kind:"ground"},
    {x:160,y:0,w:90,h:210,kind:"ground"},{x:250,y:0,w:2150,h:150,kind:"ground"}];
  f.level.staticSolids.splice(0,f.level.staticSolids.length,...ground);
  f.level.solids.splice(0,f.level.solids.length,...ground);
  f.e.health=f.e.maxHealth/2;
  f.e.attackCooldown=0;
  f.e.pendingAttack="bombard";
  f.tick(1);
  const targets=f.e.warningPoints.map(p=>({...p}));
  assert.equal(targets.length,2);
  assert.notEqual(targets[0].y,targets[1].y);
  f.tick(135);
  const shots=f.shots.items.filter(p=>p.active);
  assert.equal(shots.length,2);
  for(let i=0;i<2;i++) {
    const s=shots[i], t=C.boss.shellFlight;
    assert.ok(Math.abs(s.x+s.vx*t-targets[i].x)<1e-8);
    assert.ok(Math.abs(s.y+s.vy*t-.5*s.gravity*t*t-targets[i].y)<1e-8);
  }
});
