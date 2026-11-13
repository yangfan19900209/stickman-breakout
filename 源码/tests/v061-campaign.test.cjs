const { test } = require("node:test");
const assert = require("node:assert/strict");
const { AbandonedBase } = require("../.test-build/assets/scripts/level/LevelData.js");
const { LevelController } = require("../.test-build/assets/scripts/level/LevelController.js");
const { PlayerController } = require("../.test-build/assets/scripts/player/PlayerController.js");
const { GameSession } = require("../.test-build/assets/scripts/core/GameSession.js");
const { GameConfig } = require("../.test-build/assets/scripts/core/GameConfig.js");
const { surfaceY } = require("../.test-build/assets/scripts/core/Types.js");
const idle = { axis: 0, jump: false, shoot: false };

test("three complete encounters separate the tank from the relocated final arena", () => {
  const level = AbandonedBase;
  const mini = level.enemies.find((e) => e.encounter === "mini");
  const final = level.enemies.find((e) => e.encounter === "final");
  assert.ok(level.width >= 8200 * 1.5);
  assert.ok(final.x - mini.x >= 5500);
  const middle = level.zones.filter((z) => z.start > mini.x && z.end <= level.arena.start);
  assert.equal(middle.length, 3);
  assert.equal(level.zones[0].start, 0);
  assert.equal(level.zones.at(-1).end, level.width);
  level.zones.slice(1).forEach((z, i) => assert.equal(z.start, level.zones[i].end));
  for (const zone of middle) {
    const enemies = level.enemies.filter((e) => e.x >= zone.start && e.x < zone.end);
    assert.ok(enemies.length >= 4, zone.name + " has a real encounter");
    assert.ok(new Set(enemies.map((e) => e.kind)).size >= 3);
    assert.ok(enemies.some((e) => e.onPlatform));
    assert.ok(level.solids.some((s) => s.kind === 'platform' && s.x >= zone.start && s.x < zone.end));
    // Recovery is now placed at the end of the costly stretch / before a boss,
    // rather than requiring a health-filled crate at every zone entrance.
    assert.ok(level.recoveryPoints.some((p) => p.x >= zone.start && p.x <= zone.end + 220));
    assert.ok(level.objects.some((o) => o.x >= zone.start && o.x < zone.end && o.kind === 'barrel'));
  }
  assert.ok(final.x > level.arena.start && final.x < level.arena.end);
  assert.ok(level.exit.x > final.x && level.exit.x < level.width);
});

test("new elevated soldiers and caches have real support and standing clearance below decks", () => {
  const level = new LevelController();
  const upper = [
    ...level.data.enemies.filter((e) => e.x >= 6740 && e.onPlatform).map((e) => ({ id: e.id, x: e.x, y: e.y })),
    ...level.data.objects.filter((o) => o.x >= 6740 && o.y > 220 && o.kind !== "rope").map((o) => ({ id: o.id, x: o.x + o.w / 2, y: o.y })),
  ];
  assert.ok(upper.length >= 5);
  for (const item of upper) {
    assert.ok(level.staticSolids.some((r) => item.x > r.x && item.x < r.x + r.w && Math.abs(item.y - surfaceY(r, item.x)) < 0.01), item.id + " has no support");
  }
  for (const deck of level.staticSolids.filter((r) => r.x >= 6740 && r.kind === "platform")) {
    for (let x = deck.x + 1; x < deck.x + deck.w; x += 10) {
      const cover = level.objects.objects.filter((o) => o.solid && x >= o.x && x <= o.x + o.w && o.y < deck.y);
      const floor = Math.max(level.groundY(x), ...cover.map((o) => o.y + o.h));
      assert.ok(deck.y - floor >= GameConfig.player.height + 8, `standing trap under deck at ${x}`);
    }
  }
});

test("route collision geometry supports movement and jumping in both directions", () => {
  for (const axis of [1, -1]) {
    const level = new LevelController();
    const player = new PlayerController();
    // Geometry fixture bypasses only progression, never physical collision.
    level.movePlayer = (body, dt) => level.move(body, dt);
    player.reset(axis > 0 ? 6750 : 13400, 150);
    const {DeckTraversal}=require("../scripts/deck-traversal.cjs");
    const route=new DeckTraversal();
    let arrived = false;
    for (let tick = 0; tick < 120 * 65; tick++) {
      level.updateWorld(1 / 120, player, []);
      player.update(1 / 120, { ...idle, axis, jump: player.grounded, jumpHeld: true,
        ...(route.next({player,time:tick/120,terrain:level.solids},axis)??{}) }, level);
      assert.ok(player.alive, `fell out of route at ${player.x}`);
      if (axis > 0 ? player.x > 13400 : player.x < 6750) { arrived = true; break; }
    }
    assert.ok(arrived, `route blocked going ${axis}, at ${player.x},${player.y}`);
  }
});

test("new bridge lands on the upper ground edge and freight now has a fixed high route", () => {
  const level = new LevelController();
  const bridge = level.mechanisms.find((m) => m.data.id === "bridge-F");
  const rope = level.objects.objects.find((o) => o.id === "bridge-rope-F");
  const player = new PlayerController();
  rope.takeDamage(10, 1);
  for (let tick = 0; tick < 240; tick++) level.updateWorld(1 / 120, player, []);
  assert.ok(bridge.released && bridge.landed);
  assert.equal(bridge.rect.y, Math.max(level.groundY(bridge.rect.x), level.groundY(bridge.rect.x + bridge.rect.w)));
  assert.ok(!level.mechanisms.some(m=>m.data.kind==='lift'));
  const high=level.staticSolids.find(r=>r.kind==='platform'&&r.x===7780);
  assert.equal(high.y+high.h,348);
});

test("a standing player can enter and leave beneath the intact new bridge", () => {
  for (const axis of [1, -1]) {
    const level = new LevelController();
    const bridge = level.mechanisms.find((m) => m.data.id === "bridge-F");
    const floor = level.groundY(bridge.rect.x + bridge.rect.w);
    assert.ok(bridge.rect.y - floor >= GameConfig.player.height + 8);
    const player = new PlayerController();
    const left=bridge.rect.x-40,right=bridge.rect.x+bridge.rect.w+40;
    player.reset(axis > 0 ? left : right, floor);
    let passed = false;
    for (let tick = 0; tick < 120 * 5; tick++) {
      level.updateWorld(1 / 120, player, []);
      player.update(1 / 120, { ...idle, axis, jump:false }, level);
      assert.equal(player.crouched, false);
      if (player.x < bridge.rect.x + bridge.rect.w)
        assert.ok(player.y + player.height <= bridge.rect.y + 0.01, "must use the lower route, not cross on the deck");
      if (axis > 0 ? player.x >= right : player.x <= left) { passed = true; break; }
    }
    assert.ok(passed, `bridge underpass blocked going ${axis} at ${player.x},${player.y}`);
    assert.equal(bridge.released, false);
  }
});

test("final battle starts only after the new encounters and still permits retreat and completion", () => {
  const session = new GameSession();
  session.reset();
  session.spawner.miniBoss.active=true;
  session.spawner.miniBoss.takeDamage(999,1,'explosion');
  session.update(1/120,idle);
  const entrance = session.level.data.arena.start;
  for (const zone of session.level.data.zones.filter((z) => ['E','F','G'].includes(z.id))) {
    session.player.x = zone.start + 120;
    session.update(1 / 120, idle);
    assert.equal(session.level.zone.id, zone.id);
    assert.equal(session.spawner.guard.active, false);
    assert.equal(session.level.reachedExit(session.player.x), false);
  }
  session.player.x = entrance + 50;
  session.update(1 / 120, idle);
  assert.ok(session.spawner.guard.active);
  session.spawner.guard.takeDamage(12, 1);
  const health = session.spawner.guard.health;
  session.player.x = entrance - 100;
  session.update(1 / 120, idle);
  assert.equal(session.spawner.guard.active, true);
  session.player.x = entrance + 50;
  session.update(1 / 120, idle);
  assert.equal(session.spawner.guard.health, health);
  session.player.x = session.level.data.exit.x;
  session.spawner.guard.takeDamage(1000, 1, "explosion");
  for (let tick = 0; tick < 850; tick++) session.update(1 / 120, idle);
  assert.equal(session.state, "complete");
  assert.ok(session.spawner.enemies.some((e) => e.alive && e.spawn.x >= 6740 && e.spawn.x < entrance));
});
