import { Color } from "cc";
import { GameSession } from "../core/GameSession";
import { WeaponSystem } from "../combat/WeaponSystem";
import { Ink, colors } from "./Ink";
export class CombatRenderer {
  private tint = new Color(24, 24, 24);
  draw(ink: Ink, session: GameSession): void {
    ink.clear();
    const cam = session.camera.x;
    for (const m of session.projectiles.marks)
      if (m.active && m.x > cam - 10 && m.x < cam + 1290) {
        ink.circle(m.x - cam, m.y, 1.6, colors.muted, colors.muted, 1);
        ink.segment(
          m.x - cam - 3,
          m.y + 3,
          m.x - cam + 2,
          m.y - 2,
          1,
          colors.muted,
        );
      }
    const boss = session.spawner.guard;
    if (boss.active && boss.warningTime > 0) {
      for (let n = 0; n < (boss.phase === 2 ? 2 : 1); n++) {
        const x = boss.warningX - cam + n * 75;
        ink.ellipse(x, 154, 85, 10, colors.ink, undefined, 2);
        ink.segment(x - 35, 157, x + 35, 157, 2);
        ink.segment(x - 50, 175, x - 40, 183, 2);
        ink.segment(x + 50, 175, x + 40, 183, 2);
      }
    }
    for (const p of session.projectiles.items)
      if (p.active && p.x > cam - 30 && p.x < cam + 1310) {
        const x = p.x - cam,
          length = Math.hypot(p.vx, p.vy) || 1,
          trail = p.kind === "rocket" ? 24 : 15;
        ink.line(
          [
            {
              x: x - (p.vx / length) * trail,
              y: p.y - (p.vy / length) * trail,
            },
            { x, y: p.y },
          ],
          p.kind === "rocket"
            ? 5
            : p.kind === "pellet"
              ? 2
              : p.owner === "player"
                ? 3
                : 2,
          colors.ink,
        );
        if (p.owner === "enemy")
          ink.circle(
            x,
            p.y,
            p.kind === "cannon" ? 6 : 2,
            colors.ink,
            p.kind === "cannon" ? colors.paper : colors.ink,
            2,
          );
      }
    for (const g of session.grenades.items)
      if (g.active) {
        const x = g.x - cam;
        ink.circle(x, g.y, 6, colors.ink, colors.paper, 2);
        ink.line(
          [
            { x, y: g.y + 6 },
            { x: x + Math.cos(g.spin) * 5, y: g.y + 10 },
          ],
          2,
        );
      }
    for (const b of session.explosions.items)
      if (b.active && b.x > cam - b.radius && b.x < cam + 1280 + b.radius) {
        const x = b.x - cam,
          amount = b.age / 0.65,
          shade = new Color(80, 80, 76, Math.max(0, 1 - amount) * 160);
        ink.circle(
          x,
          b.y,
          b.radius * (0.15 + amount * 0.8),
          shade,
          undefined,
          2,
        );
        for (let n = 0; n < 7; n++) {
          const angle = (n * Math.PI * 2) / 7,
            r = b.radius * amount * 0.35;
          ink.circle(
            x + Math.cos(angle) * r,
            b.y + Math.sin(angle) * r + amount * 30,
            12 + amount * 25,
            shade,
            new Color(235, 235, 230, (1 - amount) * 155),
            1.5,
          );
        }
        if (amount < 0.35)
          for (let n = 0; n < 8; n++) {
            const a = (n * Math.PI) / 4;
            ink.line(
              [
                { x: x + Math.cos(a) * 12, y: b.y + Math.sin(a) * 12 },
                { x: x + Math.cos(a) * 55, y: b.y + Math.sin(a) * 55 },
              ],
              3,
            );
          }
      }
    for (const p of session.particles.items)
      if (p.active && p.x > cam - 80 && p.x < cam + 1360) {
        const color = this.tint,
          amount = 1 - p.life / p.maxLife;
        color.set(
          p.kind === "smoke" ? 140 : 24,
          p.kind === "smoke" ? 140 : 24,
          p.kind === "smoke" ? 135 : 24,
          (255 * p.life) / p.maxLife,
        );
        if (p.kind === "smoke" || p.kind === "dust")
          ink.ellipse(
            p.x - cam,
            p.y,
            p.size + amount * (p.kind === "smoke" ? 14 : 7),
            p.size * 0.65 + amount * 5,
            color,
            undefined,
            1.5,
          );
        else if (p.kind === "shell" || p.kind === "wood") {
          const length = p.kind === "shell" ? 3 : 7;
          ink.segment(
            p.x - cam - Math.cos(p.spin) * length,
            p.y - Math.sin(p.spin) * length,
            p.x - cam + Math.cos(p.spin) * length,
            p.y + Math.sin(p.spin) * length,
            p.size,
            color,
          );
        } else
          ink.segment(
            p.x - cam,
            p.y,
            p.x - cam - p.vx * 0.018,
            p.y - p.vy * 0.018,
            p.size,
            color,
          );
      }
    const flash = (weapon: WeaponSystem) => {
      if (weapon.flash <= 0) return;
      const x = weapon.flashX - cam,
        y = weapon.flashY,
        d = weapon.flashFacing;
      const size =
        weapon.id === "rifle" ? 1 : weapon.id === "shotgun" ? 1.6 : 1.3;
      ink.line(
        [
          { x: x + 3 * d, y: y + 5 },
          { x: x + 23 * d * size, y },
          { x: x + 3 * d, y: y - 5 },
          { x: x + 7 * d, y },
          { x: x + 3 * d, y: y + 5 },
        ],
        2,
        colors.ink,
      );
      ink.line(
        [
          { x: x + 18 * d, y: y + 7 },
          { x: x + 24 * d, y: y + 9 },
        ],
        1,
        colors.muted,
      );
    };
    flash(session.weapon);
    for (const e of session.spawner.enemies) {
      if (e.x < cam - 60 || e.x > cam + 1340) continue;
      flash(e.weapon);
      if (e.windup > 0 && e.alive) {
        const x = e.x - cam,
          y = e.y + 91;
        ink.line(
          [
            { x, y: y + 6 },
            { x, y: y + 16 },
          ],
          2,
        );
        ink.circle(x, y, 1, colors.ink, colors.ink, 1);
      }
      if (e.alive && e.health < e.maxHealth) {
        ink.rect(
          e.x - cam - 18,
          e.y + 84,
          36,
          3,
          colors.muted,
          colors.paper,
          1,
        );
        ink.rect(
          e.x - cam - 18,
          e.y + 84,
          (36 * e.health) / e.maxHealth,
          3,
          colors.ink,
          colors.ink,
          1,
        );
      }
    }
  }
}
