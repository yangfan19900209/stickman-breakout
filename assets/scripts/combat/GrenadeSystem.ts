import { GameConfig as C } from "../core/GameConfig";
import { PlayerController } from "../player/PlayerController";
import { LevelController } from "../level/LevelController";
import { ExplosionSystem } from "./ExplosionSystem";
export interface Grenade {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  fuse: number;
  spin: number;
}
export class GrenadeSystem {
  readonly items: Grenade[] = Array.from({ length: 8 }, () => ({
    active: false,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    fuse: 0,
    spin: 0,
  }));
  cooldown = 0;
  thrown = 0;
  reset(): void {
    for (const g of this.items) g.active = false;
    this.cooldown = this.thrown = 0;
  }
  throw(player: PlayerController): boolean {
    if (this.cooldown > 0 || player.grenades <= 0 || !player.alive)
      return false;
    const g = this.items.find((g) => !g.active);
    if (!g) return false;
    Object.assign(g, {
      active: true,
      x: player.x + player.facing * 20,
      y: player.y + 44,
      vx: player.facing * C.grenade.speed,
      vy: C.grenade.upward,
      fuse: C.grenade.fuse,
      spin: 0,
    });
    player.grenades--;
    this.thrown++;
    this.cooldown = C.grenade.interval;
    return true;
  }
  update(
    dt: number,
    level: LevelController,
    explosions: ExplosionSystem,
  ): void {
    this.cooldown = Math.max(0, this.cooldown - dt);
    for (const g of this.items) {
      if (!g.active) continue;
      g.fuse -= dt;
      g.spin += dt * 9;
      if (g.fuse <= 0) {
        g.active = false;
        explosions.enqueue(
          g.x,
          g.y,
          C.grenade.radius,
          C.grenade.damage,
          "player",
        );
        continue;
      }
      const oldX = g.x,
        oldY = g.y;
      g.vy -= C.grenade.gravity * dt;
      g.x += g.vx * dt;
      g.y += g.vy * dt;
      for (const r of level.solids) {
        if (
          g.x + 5 > r.x &&
          g.x - 5 < r.x + r.w &&
          oldY - 5 >= r.y + r.h &&
          g.y - 5 <= r.y + r.h
        ) {
          g.y = r.y + r.h + 5;
          g.vy = Math.abs(g.vy) * 0.3;
          g.vx *= 0.65;
        } else if (
          g.y + 5 > r.y &&
          g.y - 5 < r.y + r.h &&
          ((oldX + 5 <= r.x && g.x + 5 >= r.x) ||
            (oldX - 5 >= r.x + r.w && g.x - 5 <= r.x + r.w))
        ) {
          g.x = oldX;
          g.vx *= -0.35;
        }
      }
    }
  }
}
