import { Color } from "cc";
import { GameSession } from "../core/GameSession";
import { WeaponSystem } from "../combat/WeaponSystem";
import { Ink, colors } from "./Ink";
export class CombatRenderer {
  draw(ink: Ink, session: GameSession): void {
    ink.clear();
    const cam = session.camera.x;
    for (const p of session.projectiles.items)
      if (p.active && p.x > cam - 30 && p.x < cam + 1310) {
        const x = p.x - cam,
          dir = p.vx > 0 ? 1 : -1;
        ink.line(
          [
            { x: x - dir * 15, y: p.y },
            { x, y: p.y },
          ],
          p.owner === "player" ? 3 : 2,
          colors.ink,
        );
        if (p.owner === "enemy")
          ink.circle(x, p.y, 2, colors.ink, colors.ink, 1);
      }
    for (const p of session.particles.items)
      if (p.active) {
        const color = new Color(24, 24, 24, (255 * p.life) / p.maxLife);
        ink.line(
          [
            { x: p.x - cam, y: p.y },
            { x: p.x - cam - p.vx * 0.018, y: p.y - p.vy * 0.018 },
          ],
          p.size,
          color,
        );
      }
    const flash = (weapon: WeaponSystem) => {
      if (weapon.flash <= 0) return;
      const x = weapon.flashX - cam,
        y = weapon.flashY,
        d = weapon.flashFacing;
      ink.line(
        [
          { x: x + 3 * d, y: y + 5 },
          { x: x + 15 * d, y },
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
