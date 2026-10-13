import { Color } from "cc";
import { GameSession } from "../core/GameSession";
import { WeaponSystem } from "../combat/WeaponSystem";
import { Ink, colors } from "./Ink";
export class CombatRenderer {
  private tint = new Color(24, 24, 24);
  private smoke = new Color(30, 30, 30);
  private points = Array.from({ length: 25 }, () => ({ x: 0, y: 0 }));
  private shape(
    ink: Ink,
    x: number,
    y: number,
    rx: number,
    ry: number,
    seed: number,
    jagged: boolean,
    fill: Color,
    stroke = fill,
    width = 2,
  ): void {
    for (let n = 0; n < 24; n++) {
      const a = (n * Math.PI) / 12;
      const r = jagged
        ? n % 2
          ? 0.42
          : 1 + Math.sin(n * 2.4 + seed) * 0.18
        : 0.88 + Math.sin(n * 1.9 + seed) * 0.1;
      this.points[n].x = x + Math.cos(a) * rx * r;
      this.points[n].y = y + Math.sin(a) * ry * r;
    }
    this.points[24].x = this.points[0].x;
    this.points[24].y = this.points[0].y;
    ink.polygon(this.points, fill);
    ink.line(this.points, width, stroke);
  }
  draw(ink: Ink, session: GameSession): void {
    ink.clear();
    const cam = session.camera.x,
      visible = session.camera.visibleWidth;
    for (const m of session.projectiles.marks)
      if (m.active && m.x > cam - 10 && m.x < cam + visible + 10) {
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
      if (p.active && p.x > cam - 30 && p.x < cam + visible + 30) {
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
      if (b.active && b.x > cam - b.radius && b.x < cam + visible + b.radius) {
        const x = b.x - cam,
          age = b.age,
          t = age / 0.85,
          radius = b.radius;
        // A fast shock front separates from the slower, rising ink cloud.
        if (age < 0.34) {
          this.tint.set(24, 24, 24, 240 * (1 - age / 0.34));
          ink.circle(
            x,
            b.y,
            radius * Math.sqrt(age / 0.34),
            this.tint,
            undefined,
            7 * (1 - age / 0.34) + 1,
          );
          if (b.y - radius < 155)
            ink.ellipse(
              x,
              155,
              radius * Math.sqrt(age / 0.34),
              12 + age * 18,
              this.tint,
              undefined,
              4,
            );
        }
        if (age > 0.045)
          for (let n = 0; n < 6; n++) {
            const a = (n * Math.PI) / 3 + Math.sin(b.x) * 0.3;
            const reach = radius * (0.08 + t * 0.24),
              size = radius * (0.12 + t * 0.14);
            this.smoke.set(
              32 + n * 7,
              32 + n * 7,
              30 + n * 7,
              235 * Math.min(1, (0.85 - age) / 0.3),
            );
            this.shape(
              ink,
              x + Math.cos(a) * reach,
              b.y + Math.sin(a) * reach + t * 72,
              size,
              size * 1.05,
              n + b.x,
              false,
              this.smoke,
              this.smoke,
              2,
            );
          }
        if (age < 0.16) {
          const r = radius * (0.5 + age * 1.7);
          this.shape(ink, x, b.y, r, r * 0.9, b.x, true, colors.ink);
          this.shape(
            ink,
            x,
            b.y,
            r * 0.78,
            r * 0.7,
            b.x,
            true,
            colors.white,
            colors.white,
            1,
          );
          ink.circle(x, b.y, radius * 0.18, colors.white, colors.white, 1);
        }
        if (age < 0.24)
          for (let n = 0; n < 9; n++) {
            const a = (n * Math.PI * 2) / 9,
              r = radius * (0.35 + age * 1.8);
            ink.segment(
              x + Math.cos(a) * r,
              b.y + Math.sin(a) * r,
              x + Math.cos(a) * (r + 22),
              b.y + Math.sin(a) * (r + 22),
              4,
            );
          }
      }
    for (const p of session.particles.items)
      if (p.active && p.x > cam - 80 && p.x < cam + visible + 80) {
        const color = this.tint,
          amount = 1 - p.life / p.maxLife;
        color.set(
          p.kind === "smoke" ? 140 : 24,
          p.kind === "smoke" ? 140 : 24,
          p.kind === "smoke" ? 135 : 24,
          (255 * p.life) / p.maxLife,
        );
        if (p.kind === "impact") {
          const r = p.size * (0.5 + amount * 0.7);
          this.shape(
            ink,
            p.x - cam,
            p.y,
            r,
            p.material === "metal" ? r * 0.5 : r,
            p.spin,
            true,
            color,
          );
          this.shape(
            ink,
            p.x - cam,
            p.y,
            r * 0.55,
            r * 0.55,
            p.spin,
            true,
            colors.white,
          );
        } else if (p.kind === "smoke" || p.kind === "dust")
          ink.ellipse(
            p.x - cam,
            p.y,
            p.size + amount * (p.kind === "smoke" ? 14 : 7),
            p.size * 0.65 + amount * 5,
            color,
            color,
            2,
          );
        else if (p.kind === "wood" || p.kind === "metal") {
          const x = p.x - cam,
            y = p.y,
            cs = Math.cos(p.spin),
            sn = Math.sin(p.spin),
            r = p.size * 2.2;
          ink.polygon(
            [
              { x: x - r * cs, y: y - r * sn },
              { x: x + 3 * sn, y: y - 3 * cs },
              { x: x + r * cs, y: y + r * sn },
              { x: x - 3 * sn, y: y + 3 * cs },
            ],
            color,
          );
          if (p.kind === "wood")
            ink.segment(
              x - r * cs * 0.65,
              y - r * sn * 0.65,
              x + r * cs * 0.65,
              y + r * sn * 0.65,
              1,
              colors.paper,
            );
        } else if (p.kind === "shell") {
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
        4,
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
      if (e.x < cam - 60 || e.x > cam + visible + 60) continue;
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
