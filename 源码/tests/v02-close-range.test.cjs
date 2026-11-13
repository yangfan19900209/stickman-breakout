const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  WeaponSystem,
} = require("../.test-build/assets/scripts/combat/WeaponSystem.js");
const {
  ProjectileManager,
} = require("../.test-build/assets/scripts/combat/ProjectileManager.js");
const {
  ParticlePool,
} = require("../.test-build/assets/scripts/combat/ParticlePool.js");
const {
  EnemyController,
} = require("../.test-build/assets/scripts/enemy/EnemyController.js");
test("an enemy between the character and muzzle is hit at point-blank range", () => {
  const pm = new ProjectileManager(new ParticlePool()),
    w = new WeaponSystem(),
    enemy = new EnemyController({
      id: "close",
      kind: "melee",
      x: 118,
      y: 150,
      patrol: 0,
    });
  const player = {
    x: 110,
    y: 150,
    alive: true,
    bounds: { x: 97, y: 153, w: 26, h: 65 },
    facing: 1,
    animation: "Idle",
    animationTime: 0,
    recoil: 0,
    deadTime: 0,
    takeDamage() {
      return false;
    },
  };
  w.fire(player, pm, "player");
  pm.update(1 / 120, player, [enemy], []);
  assert.equal(enemy.health, 2);
  assert.equal(pm.hits, 1);
});
