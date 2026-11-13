const { test } = require('node:test');
const assert = require('node:assert/strict');
const load = p => require('../.test-build/assets/scripts/' + p + '.js');
const { FlightSession } = load('flight/FlightSession');
const { FlightLevel: L } = load('flight/FlightLevel');
const { projectileProfile } = load('combat/ProjectileProfile');
const { overlaps } = load('core/Types');
const idle = { axis: 0, vertical: 0, jump: false, shoot: false };
const dt = 1 / 120;
function session() { const s = new FlightSession(); s.finishEntry(); return s; }
function advance(s, seconds, input = idle, hz = 120) {
  for (let n = 0; n < Math.round(seconds * hz); n++) { s.update(1 / hz, input); s.updateCamera(1 / hz, 720); }
}
function enemy(s, kind = 'rifle') {
  for (const e of s.enemies) e.hp = 0;
  const e = s.enemies.find(e => e.kind === kind);
  Object.assign(e, { hp: 3, x: 800, y: 280, active: true, mode: 'tell', timer: 999 });
  s.player.x = 600; s.player.y = 280; s.camera.x = 0;
  return e;
}
function bossArena() {
  const s = session(); s.player.x = 4100; s.player.y = 300;
  s.camera.x = 3700; s.update(dt, idle); return s;
}

test('flight axes have equal 300 speed at 30/60/120 Hz; release brakes then hovers without fuel or gravity', () => {
  for (const hz of [30, 60, 120]) for (const [x, y] of [[1, 0], [0, 1], [1, 1]]) {
    const s = session(), p = s.player, start = { x: p.x, y: p.y };
    advance(s, .5, { ...idle, axis: x, vertical: y }, hz);
    assert.ok(Math.abs(Math.hypot(p.x - start.x, p.y - start.y) - 150) < 1e-6);
    assert.ok(Math.abs(Math.hypot(p.vx, p.vy) - 300) < 1e-6);
    advance(s, .15, idle, hz); assert.equal(p.vx, 0); assert.equal(p.vy, 0);
    const rest = { x: p.x, y: p.y }; advance(s, 1, idle, hz);
    assert.equal(p.x, rest.x); assert.equal(p.y, rest.y);
    assert.equal(p.health, 5); assert.equal(p.grenades, 3);
  }
});

test('dodge normalizes diagonals, travels 115.2, is a press edge, and adds no invulnerability', () => {
  for (const direction of [[1, 0], [1, 1], [0, -1]]) {
    const s = session(); s.player.y = 380; const start = { x: s.player.x, y: s.player.y };
    s.update(.1, { ...idle, axis: direction[0], vertical: direction[1], jump: true });
    s.update(.08, { ...idle, axis: direction[0], vertical: direction[1], jump: true });
    assert.ok(Math.abs(Math.hypot(s.player.x - start.x, s.player.y - start.y) - 115.2) < 1e-5);
    assert.equal(s.dodgeSerial, 1); assert.equal(s.player.invincible, 0);
    advance(s, 3, { ...idle, jump: true }); assert.equal(s.dodgeSerial, 1);
    s.update(dt, idle); s.update(dt, { ...idle, jump: true }); assert.equal(s.dodgeSerial, 2);
  }
});

test('dodge and normal flight stop at a thin bridge while tangential and reverse travel remain possible', () => {
  for (const direction of [-1, 1]) {
    const s = session(), p = s.player, wall = L.obstacles.find(r => r.id === 'bridge-a');
    p.x = direction > 0 ? wall.x - 60 : wall.x + wall.w + 60; p.y = wall.y;
    s.update(.1, { ...idle, axis: direction, jump: true });
    assert.ok(!overlaps({ x: p.x - p.halfWidth, y: p.y, w: p.halfWidth * 2, h: p.height }, wall));
    assert.equal(s.dodgeTime, 0);
    const x = p.x; advance(s, .1, { ...idle, axis: -direction });
    assert.ok((p.x - x) * -direction > 20);
    advance(s, .3, { ...idle, vertical: 1 }); assert.ok(p.y > wall.y + wall.h);
  }
});

test('a regular flyer needs exactly three rifle hits; one rocket and one knife are lethal', () => {
  const rifle = session(), e = enemy(rifle);
  rifle.update(dt, { ...idle, shoot: true }); advance(rifle, .24);
  assert.equal(e.hp, 2);
  rifle.update(dt, { ...idle, shoot: true }); advance(rifle, .24); assert.equal(e.hp, 1);
  rifle.update(dt, { ...idle, shoot: true }); advance(rifle, .24); assert.equal(e.hp, 0); assert.equal(rifle.shots, 3);
  const rocket = session(), r = enemy(rocket); rocket.weapon = rocket.storedWeapon = 'rocket'; rocket.ammo = 6;
  rocket.update(dt, { ...idle, shoot: true }); advance(rocket, .6);
  assert.equal(r.hp, 0); assert.equal(rocket.ammo, 5); assert.equal(rocket.shots, 1);
  const knife = session(), k = enemy(knife); k.x = 670; knife.weapon = 'knife';
  knife.update(dt, { ...idle, shoot: true }); assert.equal(k.hp, 3);
  advance(knife, .08); assert.equal(k.hp, 0); assert.equal(knife.knifeSerial, 1); assert.equal(knife.shots, 0);
});

test('rifle cadence, rocket ammo restoration after knife, and pool reuse preserve common projectile tiers', () => {
  const s = session(); advance(s, 1, { ...idle, shoot: true }); assert.equal(s.shots, 5);
  s.weapon = s.storedWeapon = 'rocket'; s.ammo = 2;
  s.update(dt, { ...idle, switchWeapon: true }); assert.equal(s.weapon, 'knife');
  s.update(dt, idle); s.update(dt, { ...idle, switchWeapon: true }); assert.equal(s.weapon, 'rocket'); assert.equal(s.ammo, 2);
  const q = s.projectiles; q.reset();
  for (const tier of ['standard', 'mini', 'boss']) for (const owner of ['player', 'enemy']) {
    q.spawn({ owner, x: 4000, y: 400, direction: 1, speed: 300, damage: 1, range: 1000, kind: 'rocket', tier });
    const shot = q.items.find(x => x.active); const spec = projectileProfile(shot);
    const reference = projectileProfile({ ...shot, owner: owner === 'player' ? 'enemy' : 'player' });
    assert.deepEqual(spec, reference); shot.active = false;
  }
  q.spawn({ owner: 'player', x: 4000, y: 400, direction: 1, speed: 300, damage: 1, range: 1000, kind: 'rocket' });
  assert.equal(q.items.find(x => x.active).tier, 'standard');
});

test('airbursts consume one charge per press and detonate in midair without a floor', () => {
  const s = session(), e = enemy(s); e.x = 950;
  s.update(dt, { ...idle, grenade: true }); assert.equal(s.player.grenades, 2); assert.equal(s.airburstThrown, 1);
  advance(s, 1, { ...idle, grenade: true });
  assert.equal(s.airburstThrown, 1); assert.equal(s.airbursts.length, 0); assert.equal(e.hp, 0); assert.equal(s.blastCount, 1);
});

test('a lethal projectile and medkit in the same simulation step cannot revive the player', () => {
  const s = session(); s.player.x = 600; s.player.y = 300; s.player.health = 1;
  s.drops.push({ x: 600, y: 335, kind: 'medkit', source: 'lethal-frame', active: true, age: 0 });
  s.projectiles.spawn({ owner: 'enemy', x: 580, y: 335, direction: 1, speed: 760, damage: 1, range: 1000 });
  s.update(1 / 30, idle);
  assert.equal(s.player.health, 0); assert.equal(s.state, 'dying');
  assert.equal(s.drops.find(d => d.source === 'lethal-frame').active, true);
});

test('mini missiles acquire after tube exit, turn slowly for 0.9 seconds, then continue straight', () => {
  const s = bossArena(), b = s.boss; s.player.invincible = 100;
  b.x = 5100; b.y = 300; b.mode = 'tell'; b.timer = 999; b.attack = 'missiles'; b.angle = Math.PI; b.shotsLeft = 2;
  s.player.x = 4050; s.player.y = 620; s.fireEnemy(b);
  const shot = s.projectiles.items.find(p => p.active); assert.ok(shot.homing); assert.equal(shot.tier, 'mini');
  advance(s, .1); assert.ok(Math.abs(shot.vy) < 1e-8);
  advance(s, .5); assert.ok(shot.vy > 20);
  const turn = Math.abs(Math.atan2(Math.sin(Math.atan2(shot.vy, shot.vx) - Math.PI), Math.cos(Math.atan2(shot.vy, shot.vx) - Math.PI)));
  assert.ok(turn <= .95 * .5 + .01); assert.ok(Math.abs(Math.hypot(shot.vx, shot.vy) - 290) < 1e-6);
  advance(s, .5); const v = { x: shot.vx, y: shot.vy }; s.player.y = 100; advance(s, .3);
  assert.equal(shot.vx, v.x); assert.equal(shot.vy, v.y);
});

test('locked targeting releases occluded or offscreen enemies and visibly turns to rear targets', () => {
  const s = session(), e = enemy(s);
  advance(s, .1, { ...idle, shoot: true }); assert.equal(s.aimTarget, e.id);
  e.x = 1900; e.y = 420; s.player.x = 1600; s.player.y = 420; s.camera.x = 1400;
  s.update(dt, { ...idle, shoot: true }); assert.equal(s.aimTarget, '');
  e.x = 1450; e.y = 600; e.hp = 999; s.player.y = 600; s.cooldown = 999;
  advance(s, .4, { ...idle, shoot: true }); assert.equal(s.aimTarget, e.id); assert.equal(s.player.facing, -1);
  s.camera.x = 2000; s.update(dt, { ...idle, shoot: true }); assert.equal(s.aimTarget, '');
});

test('helicopter stays engaged while retreating, follows in two axes, and shows four committed attacks', () => {
  const s = bossArena(), b = s.boss; s.player.invincible = 100; const hp = b.hp, start = b.x;
  s.player.x = 3500; s.player.y = 600;
  advance(s, 18);
  assert.equal(b.active, true); assert.equal(b.hp, hp); assert.ok(b.x < start - 350); assert.ok(b.travel > 600);
  for (const attack of ['burst', 'missiles', 'sweep', 'dive']) assert.ok(b.attackCounts[attack] >= 1, attack);
  assert.ok(b.y > 220 && b.y < 550);
  const snapshot = s.snapshot(); assert.equal(snapshot.boss.active, true); assert.equal(snapshot.miniBoss.hp, hp);
});

test('boss warnings and bullet firing hold the emitter still, and upper/lower lanes fit the player at both ends', () => {
  const s = bossArena(), b = s.boss; s.player.invincible = 100;
  s.prepareAttack(b); const x = b.x, y = b.y;
  advance(s, .9); assert.equal(b.x, x); assert.equal(b.y, y);
  for (const side of [-1, 1]) for (const height of [100, 690]) {
    const t = bossArena(), boss = t.boss;
    boss.x = side < 0 ? L.arenaStart + 125 : L.arenaEnd - 125;
    boss.y = height < 300 ? 220 : 520; boss.mode = 'tell'; boss.timer = 999;
    t.player.x = boss.x + side * 190; t.player.y = height; t.player.invincible = 100;
    const start = t.player.x;
    advance(t, 1.3, { ...idle, axis: -side });
    assert.ok((t.player.x - start) * -side > 350); assert.equal(t.player.health, 5);
    assert.ok(!overlaps(t.player.bounds, boss.bounds));
  }
});

test('the full helicopter cabin and both missile sockets share the same art and projectile geometry', () => {
  const s = bossArena(), b = s.boss; b.x = 5000; b.y = 350; b.angle = Math.PI;
  assert.equal(b.bounds.w, 220); assert.equal(b.bounds.h, 150);
  b.attack = 'burst'; let muzzle = s.enemyMuzzle(b);
  assert.equal(muzzle.originY, b.y + 24); assert.equal(muzzle.x, b.x - 140);
  b.attack = 'missiles'; const high = s.enemyMuzzle(b, 0), low = s.enemyMuzzle(b, 1);
  assert.equal(high.originY, b.y + 50); assert.equal(low.originY, b.y + 20);
  assert.equal(high.x, b.x + 27); assert.equal(low.x, b.x + 27);
  assert.equal(s.enemyMuzzle(b, 0, false).originY, b.y + 24);
  assert.equal(s.enemyMuzzle(b, 0, false).x, b.x - 140);
  b.serial = 0; s.prepareAttack(b); muzzle = s.enemyMuzzle(b);
  const lock = Math.atan2(s.player.y + 35 - muzzle.y, s.player.x - muzzle.x);
  assert.ok(Math.abs(b.angle - lock) < 1e-10);
  b.shotsLeft = 3; s.fireEnemy(b);
  const shot = s.projectiles.items.find(p => p.active);
  assert.equal(shot.x, muzzle.x); assert.equal(shot.y, muzzle.y);
  assert.equal(shot.originX, muzzle.originX); assert.equal(shot.originY, muzzle.originY);
});

test('non-horizontal boss aim keeps both facing sockets on the body and crossing the boss cannot flip a committed volley', () => {
  for (const facing of [-1, 1]) {
    const s = bossArena(), b = s.boss; b.x = 4800; b.y = 350;
    s.player.x = b.x + facing * 400; s.player.y = 620; s.player.invincible = 100;
    b.serial = 0; s.prepareAttack(b);
    const m = s.enemyMuzzle(b), angle = b.angle;
    assert.equal(b.facing, facing); assert.equal(m.x, b.x + facing * 140); assert.equal(m.y, b.y + 24);
    assert.ok(Math.abs(Math.sin(angle)) > .2);
    s.player.x = b.x - facing * 400;
    advance(s, .9);
    assert.equal(b.facing, facing); assert.equal(b.angle, angle);
    assert.equal(s.enemyMuzzle(b).x, m.x); assert.equal(s.enemyMuzzle(b).y, m.y);
    const shots = s.projectiles.items.filter(p => p.active && p.owner === 'enemy');
    assert.ok(shots.length > 0);
    for (const shot of shots) {
      assert.equal(shot.originX, m.originX); assert.equal(shot.originY, m.originY);
      assert.ok(Math.abs(Math.atan2(shot.vy, shot.vx) - angle) < 1e-9);
    }
  }
});

test('boss kill opens the gate, cancels hostile shots, and creates exactly one reachable +2 medkit kept at full health', () => {
  const s = bossArena(), b = s.boss;
  s.projectiles.spawn({ owner: 'enemy', x: b.x - 200, y: b.y, direction: -1, speed: 200, damage: 1, range: 1000 });
  assert.equal(b.takeDamage(100, 1), true); assert.equal(b.takeDamage(100, 1), false);
  const d = s.drops.find(d => d.source === 'after-falcon'); assert.ok(d); assert.equal(s.recoveryUsed.size, 1);
  assert.equal(s.projectiles.items.filter(p => p.active && p.owner === 'enemy').length, 0);
  s.player.x = d.x; s.player.y = d.y - 35; advance(s, .5); assert.equal(d.active, true);
  s.player.health = 2; s.update(dt, idle); assert.equal(d.active, false); assert.equal(s.player.health, 4);
  s.player.health = 2; s.update(dt, idle); assert.equal(s.player.health, 2);
  s.player.x = L.gate.x - 40; s.player.y = 300; advance(s, .4, { ...idle, axis: 1 });
  assert.ok(s.player.x > L.gate.x + L.gate.w);
});

test('retreat wall is at the stopped camera edge; camera does not react to facing or small vertical changes', () => {
  const s = bossArena(); s.boss.timer = 999; s.player.invincible = 100;
  advance(s, 4, { ...idle, axis: -1 });
  assert.equal(s.camera.x, s.retreatLimit); assert.equal(s.player.x - s.camera.x, s.player.halfWidth);
  const x = s.camera.x, y = s.camera.y; s.player.facing *= -1; s.updateCamera(dt, 720);
  assert.equal(s.camera.x, x); assert.equal(s.camera.y, y);
  s.player.y += 2; s.updateCamera(dt, 720); assert.equal(s.camera.y, y);
});

test('launch skip and normal entry match; pause freezes shots/dodge/AI; reset and settlement cannot duplicate rewards', () => {
  const a = new FlightSession(), b = new FlightSession(); a.skipEntry(); advance(b, L.launchDuration);
  assert.equal(a.stage, 'flying'); assert.equal(b.stage, 'flying');
  assert.equal(a.player.x, b.player.x); assert.equal(a.player.y, b.player.y); assert.equal(a.player.health, b.player.health);
  const s = bossArena(); s.update(dt, { ...idle, jump: true, shoot: true }); s.pause();
  const before = s.snapshot(); s.update(.1, { ...idle, axis: 1, grenade: true }); assert.deepEqual(s.snapshot(), before);
  s.resume(); s.boss.takeDamage(100, 1); s.player.x = L.exit.x; s.player.y = 280;
  advance(s, 10); assert.equal(s.state, 'complete'); assert.equal(s.victory.resultsReady, true);
  assert.equal(s.snapshot().buildStage, 'P0/P1-flight-slice'); assert.equal(s.recoveryUsed.size, 1);
  s.reset(); assert.equal(s.state, 'playing'); assert.equal(s.stage, 'launch'); assert.equal(s.boss.active, false);
  assert.equal(s.dodgeCooldown, 0); assert.equal(s.airbursts.length, 0); assert.equal(s.recoveryUsed.size, 0);
});

test('short landscape frames keep the whole helicopter below HUD before a new warning, without snapping back into view', () => {
  for (const zoom of [1, 1.15]) for (const cameraY of [20, 180]) {
    const s = bossArena(), b = s.boss, height = 720 / zoom;
    s.camera.zoom = zoom; s.camera.y = cameraY; s.updateCamera(0, height);
    b.x = 4750; b.y = 500; b.mode = 'recover'; b.timer = 0;
    s.player.x = 4350; s.player.y = 620; s.player.invincible = 100;
    const max = Math.min(520, cameraY + height - 100 / zoom - 224);
    let previous = b.y, warned = false;
    for (let n = 0; n < 120 * 5; n++) {
      s.update(dt, idle);
      assert.ok(Math.abs(b.y - previous) <= 200 * dt + 1e-8, 're-entry must use normal pursuit speed');
      previous = b.y;
      if (b.mode === 'tell') {
        assert.ok(b.y <= max + 1e-8); assert.ok(b.y >= 220);
        const band = s.snapshot().bossVisibleBand;
        assert.equal(band.max, max); assert.equal(band.bodyTopMargin, 224);
        assert.ok(b.y >= band.min && b.y <= band.max);
        assert.ok((b.y + 220 - cameraY) * zoom <= 720 - 100 - 4 * zoom + 1e-8);
        assert.ok(b.y - 37 >= cameraY + 4 - 1e-8);
        warned = true; break;
      }
      if (b.y > max) assert.equal(Object.keys(b.attackCounts).length, 0);
    }
    assert.ok(warned, `boss resumes visible attacks at zoom ${zoom}, camera ${cameraY}`);
  }
});

test('flight viewport changes preserve locked shot origins and cap subsequent up/down charges to visible bounds', () => {
  const s = bossArena(), b = s.boss; s.player.invincible = 100;
  b.x = 4750; b.y = 460; b.serial = 0; s.player.x = 4300; s.player.y = 600;
  s.prepareAttack(b); const muzzle = s.enemyMuzzle(b), position = { x: b.x, y: b.y };
  s.camera.zoom = 1.15; s.camera.y = 20; s.updateCamera(0, 720 / 1.15);
  for (let n = 0; n < 120; n++) {
    s.update(dt, idle);
    assert.equal(b.x, position.x); assert.equal(b.y, position.y);
    assert.deepEqual(s.enemyMuzzle(b), muzzle);
  }
  for (const direction of [-1, 1]) {
    b.mode = 'charge'; b.timer = .75; b.x = 4800; b.y = 280;
    b.vx = 0; b.vy = direction * 430;
    for (let n = 0; n < 60; n++) s.update(dt, idle);
    const max = 20 + 720 / 1.15 - 100 / 1.15 - 224;
    assert.ok(b.y >= 220 && b.y <= max + 1e-8);
    assert.ok((b.y + 220 - s.camera.y) * s.camera.zoom <= 620);
    assert.ok(b.y - 37 > s.camera.y);
  }
});
