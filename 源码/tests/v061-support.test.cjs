const { test } = require('node:test');
const assert = require('node:assert/strict');
const load = p => require('../.test-build/assets/scripts/' + p + '.js');
const { LevelController } = load('level/LevelController');
const { GameSession } = load('core/GameSession');
const { DestructibleManager } = load('world/DestructibleManager');
const { PlayerController } = load('player/PlayerController');
const { PickupSystem } = load('world/PickupSystem');
const { WeaponSystem } = load('combat/WeaponSystem');
const { ParticlePool } = load('combat/ParticlePool');
const { objectPresentation, objectSolid } = load('render/ObjectPresentation');
const dt = 1 / 120;
const idle = { axis: 0, shoot: false, jump: false };
const floor = { x: 0, y: 0, w: 1200, h: 150, kind: 'ground' };
function level(objects = [], solids = [floor]) {
  return new LevelController({ name: 'support regression', width: 1200,
    spawn: { x: 50, y: 150 }, exit: { x: 1150, y: 150 }, enemies: [], objects, solids });
}

test('all campaign props retain their calibrated solid body through damage', () => {
  const l = new LevelController();
  for (const o of l.objects.objects.filter(o => o.kind !== 'rope')) {
    const visual = objectPresentation(o), collider = { ...o.bounds };
    const solid=objectSolid(o);
    assert.ok(Math.abs(o.bounds.h - solid.height) < 1e-8, o.id);
    assert.ok(Math.abs(o.bounds.w - solid.width) < 1e-8, o.id);
    assert.ok(Math.abs(o.bounds.x + o.bounds.w / 2 - (o.x + o.w / 2)) < 1e-8, o.id);
    o.takeDamage(1, 1);
    assert.deepEqual(o.bounds, collider, o.id);
    assert.equal(objectPresentation(o).height, visual.height, o.id);
  }
});

test('a player stands on the drawn cover top and falls when the supporting crate breaks', () => {
  const l = level([{ id: 'crate', kind: 'wood', x: 250, y: 150, w: 64, h: 64 }]);
  const box = l.objects.objects[0], p = new PlayerController();
  p.reset(282, box.y + objectPresentation(box).height);
  for (let n = 0; n < 20; n++) p.update(dt, idle, l);
  assert.equal(p.grounded, true);
  assert.equal(p.y, box.y + objectPresentation(box).height);
  box.takeDamage(99, 1); l.objects.flushHits(); l.refreshSolids();
  p.update(dt, idle, l);
  assert.equal(p.grounded, false);
  for (let n = 0; n < 120; n++) p.update(dt, idle, l);
  assert.equal(p.y, 150);
  assert.equal(p.grounded, true);
});

test('unsupported live crates and elevated wrecks fall to the first actual surface', () => {
  const l = level([{ id: 'air-crate', kind: 'wood', x: 250, y: 420, w: 56, h: 48 }],
    [floor, { x: 200, y: 230, w: 180, h: 18, kind: 'platform' }]);
  const box = l.objects.objects[0];
  l.objects.update(dt, l.solids);
  assert.equal(box.falling, true);
  assert.ok(box.y < 420);
  box.takeDamage(99, 1); l.objects.flushHits(); l.refreshSolids();
  for (let n = 0; n < 180; n++) l.objects.update(dt, l.solids);
  assert.equal(box.y, 248);
  assert.equal(box.falling, false);
  assert.equal(box.solid, false);
  assert.equal(l.objects.destroyed, 1);
});

test('a stack loses its destroyed support immediately even before the solids cache refreshes', () => {
  const l = level([{ id: 'lower', kind: 'wood', x: 250, y: 150, w: 64, h: 64 }]);
  const top = l.objects.objects[0].bounds.y + l.objects.objects[0].bounds.h;
  l.objects.reset([
    { id: 'lower', kind: 'wood', x: 250, y: 150, w: 64, h: 64 },
    { id: 'upper', kind: 'wood', x: 258, y: top, w: 48, h: 44 },
  ]);
  l.refreshSolids();
  const [lower, upper] = l.objects.objects;
  l.objects.update(dt, l.solids);
  assert.equal(upper.y, top);
  lower.takeDamage(99, 1);
  l.objects.update(dt, l.solids);
  assert.ok(upper.y < top);
  assert.equal(l.objects.destroyed, 1);
  for (let n = 0; n < 150; n++) l.objects.update(dt, l.solids);
  assert.equal(upper.y, 150);
  assert.equal(upper.bounds.y, 150);
});

test('hanging cargo stays attached until released and dead cargo no longer hangs in place', () => {
  const m = new DestructibleManager();
  m.reset([{ id: 'cargo', kind: 'hanging', x: 250, y: 440, w: 54, h: 48 }]);
  const box = m.objects[0];
  for (let n = 0; n < 120; n++) m.update(dt, [floor]);
  assert.equal(box.y, 440);
  box.takeDamage(99, 1); m.update(dt, [floor]);
  assert.equal(box.triggered, true);
  assert.ok(box.y < 440);
  box.takeDamage(99, 1);
  for (let n = 0; n < 180; n++) m.update(dt, [floor]);
  assert.equal(box.alive, false);
  assert.equal(box.y, 150);
  assert.equal(m.destroyed, 1);
});

test('props ride moving supports and resume falling when the support is removed', () => {
  const deck = { x: 200, y: 230, w: 200, h: 16 };
  const m = new DestructibleManager();
  m.reset([{ id: 'cargo', kind: 'wood', x: 250, y: 246, w: 54, h: 48 }]);
  m.update(dt, [floor, deck]);
  deck.y += 20; m.update(dt, [floor, deck]);
  assert.equal(m.objects[0].y, 266);
  m.update(dt, [floor]);
  assert.ok(m.objects[0].y < 266);
  for (let n = 0; n < 180; n++) m.update(dt, [floor]);
  assert.equal(m.objects[0].y, 150);
});

test('session registers an authored crate on a lift before its first upward tick, including after reset', () => {
  const s = new GameSession({ name: 'initial lift support', width: 1200,
    spawn: { x: 50, y: 150 }, exit: { x: 1150, y: 150 }, solids: [floor],
    objects: [{ id: 'lift-crate', kind: 'wood', x: 250, y: 166, w: 54, h: 48 }],
    enemies: [{ id: 'boss', kind: 'colossus', x: 1100, y: 150, patrol: 0, encounter: 'final' }],
    arena: { start: 1000, end: 1200 },
    mechanisms: [{ id: 'lift', kind: 'lift', x: 200, y: 150, w: 200, h: 16,
      minY: 150, maxY: 318, speed: 65 }],
  });
  for (let run = 0; run < 2; run++) {
    s.reset();
    for (let n = 0; n < 120; n++) {
      s.update(dt, idle);
      const crate = s.level.objects.objects[0], lift = s.level.mechanisms[0];
      assert.ok(Math.abs(crate.y - lift.rect.y - lift.rect.h) < 1e-8);
      assert.equal(crate.falling, false);
    }
    assert.ok(s.level.objects.objects[0].y > 225);
  }
});

test('supplies drop from a broken supporting crate and remain collectible on the floor', () => {
  const l = level([{ id: 'crate', kind: 'wood', x: 250, y: 150, w: 64, h: 64 }]);
  const box = l.objects.objects[0], drops = new PickupSystem(), player = new PlayerController(), weapon = new WeaponSystem();
  player.reset(50, 150);
  drops.spawn(282, box.y + box.bounds.h + 10, 'health');
  for (let n = 0; n < 180; n++) drops.update(dt, player, weapon, l.solids);
  assert.equal(drops.items[0].y, box.y + box.bounds.h + 10);
  box.takeDamage(99, 1); l.objects.flushHits(); l.refreshSolids();
  for (let n = 0; n < 180; n++) drops.update(dt, player, weapon, l.solids);
  assert.equal(drops.items[0].y, 160);
  player.health = 2; player.x = 282;
  drops.update(dt, player, weapon, l.solids);
  assert.equal(drops.items[0].active, false);
  assert.equal(player.health, 4);
});

test('physical wood fragments reach and bounce on terrain instead of passing through or vanishing in air', () => {
  const pool = new ParticlePool();
  pool.burst(500, 430, 8, 'wood');
  let contacted = 0;
  const contact = new Set();
  for (let n = 0; n < 240; n++) {
    pool.update(dt, [floor]);
    for (const p of pool.items.filter(p => p.active)) {
      assert.ok(p.y >= 153 - 1e-8);
      if (p.y === 153) contact.add(p);
    }
    contacted = Math.max(contacted, contact.size);
  }
  assert.equal(contacted, 8);
  assert.equal(pool.dropped, 0);
});

test('surface explosions resolve fragment radius overlap before gravity, including downward-emitted pieces', () => {
  const pool = new ParticlePool();
  pool.blast(500, 150, 85, 150);
  const pieces = pool.items.filter(p => p.active && (p.kind === 'metal' || p.kind === 'wood'));
  const downward = pieces.filter(p => p.vy < -85);
  assert.equal(pieces.length, 20);
  assert.ok(downward.length > 0);
  pool.update(dt, [floor]);
  for (const p of pieces) assert.ok(p.y >= 153 - 1e-8);
  for (const p of downward) assert.ok(p.vy > 0, 'downward ground fragments should bounce immediately');
  for (let n = 0; n < 240; n++) {
    pool.update(dt, [floor]);
    for (const p of pieces.filter(p => p.active)) assert.ok(p.y >= 153 - 1e-8);
  }
  assert.equal(pool.dropped, 0);
});

test('first-step fragment correction never pulls particles from beneath an overhead platform onto it', () => {
  const pool = new ParticlePool(), deck = { x: 400, y: 220, w: 200, h: 20 };
  pool.burst(500, 200, 12, 'wood');
  pool.update(dt, [floor, deck]);
  for (const p of pool.items.filter(p => p.active)) {
    assert.ok(p.y > 197 && p.y < 203, 'an airborne emitter below the deck must keep its height');
  }
});

test('fragments emitted above a platform still descend to and bounce off its actual top', () => {
  const pool = new ParticlePool(), deck = { x: 400, y: 220, w: 200, h: 20 };
  pool.burst(500, 340, 1, 'metal');
  const p = pool.items.find(p => p.active);
  p.vx = 0; p.vy = -80;
  pool.update(dt, [floor, deck]);
  assert.ok(p.y > 335 && p.y < 340, 'airborne fragments are not snapped down to a platform');
  let bounced = false, settled = false;
  for (let n = 0; n < 160 && p.active; n++) {
    pool.update(dt, [floor, deck]);
    assert.ok(p.y >= 243 - 1e-8);
    if (p.y === 243 && p.vy > 0) bounced = true;
    if (p.y === 243 && p.vy === 0) settled = true;
  }
  assert.equal(bounced, true);
  assert.equal(settled, true);
});
