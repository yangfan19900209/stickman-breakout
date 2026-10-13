const fs = require("node:fs");
const {
  GameSession,
} = require("../.test-build/assets/scripts/core/GameSession.js");
const { PlaytestBrain } = require("./playtest-brain.cjs");
const s = new GameSession(),
  brain = new PlaytestBrain();
s.reset();
let input,
  trace = [];
for (let tick = 0; tick < 120 * 300 && s.state === "playing"; tick++) {
  if (tick % 4 === 0) {
    input = brain.next(s.snapshot());
    if (tick % (120 * 5) === 0)
      trace.push({
        time: s.time,
        x: s.player.x,
        y: s.player.y,
        health: s.player.health,
        kills: s.spawner.kills,
        zone: s.level.zone?.id,
        weapon: s.weapon.id,
        boss: s.spawner.guard.health,
        input,
      });
  }
  s.update(1 / 120, {
    ...input,
    jump: tick % 4 === 0 && input.jump,
    grenade: tick % 4 === 0 && input.grenade,
  });
}
const result = { snapshot: s.snapshot(), trace };
fs.writeFileSync(
  "reports/v02-model-playtest.json",
  JSON.stringify(result, null, 2),
);
console.log(
  JSON.stringify(
    {
      state: s.state,
      time: s.time,
      x: s.player.x,
      y: s.player.y,
      health: s.player.health,
      kills: s.spawner.kills,
      boss: s.spawner.guard.health,
      trace: trace.slice(-10),
    },
    null,
    2,
  ),
);
if (s.state !== "complete") process.exitCode = 1;
