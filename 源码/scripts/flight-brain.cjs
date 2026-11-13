/** Read-only policy: a snapshot enters, ordinary keyboard/touch actions leave. */
class FlightBrain {
  constructor(options = {}) { this.observeBoss = options.observeBoss ?? 0; }
  next(s) {
    const none = { axis: 0, vertical: 0, shoot: false, jump: false, grenade: false };
    if (s.stage !== 'flying' || s.state !== 'playing' || s.victory.active) return none;
    const p = s.player, boss = s.boss;
    let axis = 1, targetY = 310, shoot = true, jump = false, grenade = false;
    const target = s.enemies.filter(e => e.alive && e.active && Math.abs(e.x - p.x) < 620)
      .sort((a, b) => Math.abs(a.x - p.x) - Math.abs(b.x - p.x))[0];
    if (target && !boss.active) {
      const direction = target.x > p.x ? 1 : -1, gap = Math.abs(target.x - p.x);
      axis = gap > 420 ? direction : gap < 220 ? -direction : 0;
      targetY = target.y;
      if (target.mode === 'tell') {
        const key = target.id + '/' + Object.values(target.attackCounts).reduce((a, b) => a + b, 0);
        if (key !== this.enemyKey) {
          this.enemyKey = key; this.dodgeY = p.y > 460 ? 290 : 590;
          this.dodgeUntil = s.time + target.timer + 1.25;
        }
      }
      if (s.time < this.dodgeUntil) targetY = this.dodgeY;
    }
    if (boss.active && boss.alive) {
      this.bossAt ??= s.time;
      axis = p.x < boss.x - 490 ? 1 : p.x > boss.x - 390 ? -1 : 0;
      targetY = 380;
      if (boss.mode === 'tell') {
        const key = Object.values(boss.attackCounts).reduce((a, b) => a + b, 0);
        if (key !== this.bossKey) {
          this.bossKey = key;
          this.bossDodgeY = Math.sin(boss.angle) > .05 || p.y > 470 ? 140 : 630;
          this.bossDodgeUntil = s.time + boss.timer + 1.6;
        }
      }
      if (s.time < this.bossDodgeUntil) targetY = this.bossDodgeY;
      if (s.time - this.bossAt < this.observeBoss) shoot = false;
      // Deliberately reserve airbursts for a close committed pass.
      grenade = shoot && Math.hypot(boss.x - p.x, boss.y - p.y) < 330 && s.time > (this.nextGrenade ?? 0);
      if (grenade) this.nextGrenade = s.time + 1.2;
    }
    // After the encounter, actually collect the guaranteed reward before exiting.
    const supplies = (s.pickups ?? []).filter(d => d.active &&
      ((d.kind === 'medkit' && p.health < 5) || (d.kind === 'rocket' && s.ammo < 6)) &&
      Math.abs(d.x - p.x) < (boss.alive ? 330 : 1800));
    const supply = supplies.sort((a, b) => Math.abs(a.x - p.x) - Math.abs(b.x - p.x))[0];
    if (supply && (!boss.active || !boss.alive)) {
      axis = Math.abs(supply.x - p.x) > 24 ? Math.sign(supply.x - p.x) : 0;
      targetY = supply.y - 35;
    }
    // Navigate real solids rather than teleporting through the authored decks.
    for (const r of s.obstacles ?? []) {
      const near = axis > 0 ? r.x - p.x : p.x - (r.x + r.w);
      if (!axis || near < -15 || near > 140 || p.y + 74 < r.y || p.y > r.y + r.h) continue;
      const above = r.y + r.h + 22, below = r.y - 96;
      targetY = below < 100 || Math.abs(above - p.y) < Math.abs(below - p.y) ? above : below;
      if (near < 60) axis = 0;
    }
    // React to in-flight shots even when their emitter has just been defeated.
    for (const shot of s.projectileStates ?? []) {
      if (shot.owner !== 'enemy') continue;
      const dx = p.x - shot.x, dy = p.y + 35 - shot.y, speed2 = shot.vx ** 2 + shot.vy ** 2;
      const time = (dx * shot.vx + dy * shot.vy) / speed2;
      if (time < .08 || time > .55 || Math.hypot(dx - shot.vx * time, dy - shot.vy * time) > (shot.kind === 'rocket' ? 72 : 36)) continue;
      this.shotLane = p.y > 420 ? Math.max(110, p.y - 140) : Math.min(660, p.y + 140);
      this.shotUntil = s.time + .6;
      if (s.dodgeCooldown <= 0 && Math.abs(this.shotLane - p.y) > 80) jump = true;
    }
    if (s.time < this.shotUntil) targetY = this.shotLane;
    targetY = Math.max(100, Math.min(660, targetY));
    const vertical = Math.abs(targetY - p.y) > 15 ? Math.sign(targetY - p.y) : 0;
    return { axis, vertical, shoot, jump, grenade };
  }
}
module.exports = { FlightBrain };
