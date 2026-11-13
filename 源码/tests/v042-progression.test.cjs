const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  GameSession,
} = require("../.test-build/assets/scripts/core/GameSession.js");
const idle = { axis: 0, jump: false, shoot: false };

test("a real-input campaign route leaves final soldiers alive and can retreat from the boss", () => {
  const { BypassBrain } = require("../scripts/bypass-brain.cjs");
  const s = new GameSession(),
    brain = new BypassBrain();
  s.reset();
  let frame;
  for (
    let tick = 0;
    tick < 120 * 240 && s.state === "playing" && brain.phase !== "done";
    tick++
  ) {
    if (tick % 4 === 0) frame = brain.next(s.snapshot());
    s.update(1 / 120, {
      ...frame,
      jump: tick % 4 === 0 && frame.jump,
      grenade: tick % 4 === 0 && frame.grenade,
    });
  }
  assert.equal(brain.phase, "done");
  assert.ok(brain.retreat.x < s.level.data.arena.start - 80);
  assert.equal(brain.retreat.active, true);
  assert.equal(brain.entries.length, 2);
  const bypassZone = s.level.data.zones.at(-2);
  const bypassEnemyIds = s.level.data.enemies
    .filter((e) => e.x >= bypassZone.start && e.x < bypassZone.end)
    .map((e) => e.id);
  assert.ok(
    brain.entries.every((e) =>
      e.skipped.some((id) => bypassEnemyIds.includes(id)),
    ),
  );
  assert.equal(s.level.clearedZones.has(bypassZone.id), false);
});

test("every uncleared zone boundary is passable in both directions", () => {
  const s = new GameSession();
  s.reset();
  s.spawner.miniBoss.health=0;
  s.spawner.releaseAfterMini();
  for (const z of s.level.data.zones.filter((z) => z.id !== "D")) {
    assert.ok(
      s.spawner.enemies.some(
        (e) => e.alive && e.spawn.x >= z.start && e.spawn.x < z.end,
      ),
    );
    for (const direction of [1, -1]) {
      s.player.x = z.end - direction * 35;
      // Normal jump height clears nearby supply crates, but not the old 380-high gate.
      s.player.y = 240;
      s.player.vx = direction * 280;
      s.player.vy = 0;
      s.level.move(s.player, 0.3);
      assert.ok(
        direction * (s.player.x - z.end) > s.player.halfWidth,
        `blocked at ${z.id}, direction ${direction}`,
      );
    }
  }
  assert.equal(s.level.clearedZones.size, 0);
});

test("boss activates with ALL ordinary enemies alive, retreat and re-entry preserve boss damage", () => {
  const s = new GameSession();
  s.reset();
  const entrance = s.level.data.arena.start;
  s.player.x = entrance + 50;
  s.update(1 / 120, idle);
  assert.equal(s.spawner.guard.active, true);
  assert.equal(s.level.zone.id, "D");
  assert.equal(s.level.clearedZones.size, 0);
  assert.ok(
    s.spawner.enemies.filter((e) => e.kind !== "guard" && e.kind !== "colossus").every((e) => e.alive),
  );
  s.spawner.guard.takeDamage(12, 1);
  const hp = s.spawner.guard.health;
  s.spawner.guard.windup = 0.3;
  s.player.vx = -280;
  s.player.vy = 0;
  s.level.move(s.player, 0.6);
  assert.ok(
    s.player.x < entrance - 80,
    "retreat must not clamp at arena entrance",
  );
  s.update(1 / 120, idle);
  assert.equal(s.level.arenaEntered, false);
  assert.equal(s.spawner.guard.active, true);
  assert.ok(s.spawner.guard.windup > 0);
  assert.equal(s.spawner.guard.warningTime, 0);
  s.player.x = entrance + 50;
  s.update(1 / 120, idle);
  assert.equal(s.spawner.guard.active, true);
  assert.equal(s.spawner.guard.health, hp);
  assert.equal(s.spawner.enemies.filter((e) => e.kind === "guard").length, 1);
});

test("defeating the boss opens the exit with skipped enemies still alive", () => {
  const s = new GameSession();
  s.reset();
  s.player.x = s.level.data.exit.x;
  s.update(1 / 120, idle);
  s.spawner.guard.takeDamage(1000, 1, "explosion");
  for (let i = 0; i < 850; i++) s.update(1 / 120, idle);
  assert.equal(s.state, "complete");
  assert.equal(s.level.clearedZones.size, 0);
  assert.ok(
    s.spawner.enemies.filter((e) => e.kind !== "guard" && e.kind !== "colossus").every((e) => e.alive),
  );
  s.reset();
  assert.equal(s.level.zone.id, "A");
  assert.equal(s.level.arenaEntered, false);
  assert.equal(s.spawner.guard.health, s.spawner.guard.maxHealth);
});
