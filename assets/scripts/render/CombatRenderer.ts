import { Color, Graphics } from "cc";
import { GameSession } from "../core/GameSession";
import { WeaponSystem } from "../combat/WeaponSystem";
import { Ink, colors } from "./Ink";
import { ProjectileArt } from "./ProjectileArt";
export class CombatRenderer {
  private projectileArt = new ProjectileArt();
  private tint = new Color(24, 24, 24);
  private smoke = new Color(30, 30, 30);
  private light = new Color(250, 249, 245);
  private points = Array.from({ length: 25 }, () => ({ x: 0, y: 0 }));
  /** Scalloped Bezier silhouette, not a pile of overlaid circles. */
  private cloud(
    ink: Ink,
    x: number,
    y: number,
    rx: number,
    ry: number,
    fill: Color,
    outline: Color,
    seed = 0,
    width = 2.8,
  ): void {
    const g = ink.g,
      count = 5,
      step = (Math.PI * 2) / count;
    g.moveTo(x + Math.cos(seed) * rx * 0.78, y + Math.sin(seed) * ry * 0.78);
    for (let n = 0; n < count; n++) {
      const a = seed + n * step,
        end = a + step;
      g.bezierCurveTo(
        x + Math.cos(a + step * 0.2) * rx * 1.32,
        y + Math.sin(a + step * 0.2) * ry * 1.32,
        x + Math.cos(a + step * 0.8) * rx * 1.32,
        y + Math.sin(a + step * 0.8) * ry * 1.32,
        x + Math.cos(end) * rx * 0.78,
        y + Math.sin(end) * ry * 0.78,
      );
    }
    g.close();
    g.fillColor = fill;
    g.fill();
    g.strokeColor = outline;
    g.lineWidth = width;
    g.stroke();
  }
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
    ink.g.lineCap = Graphics.LineCap.BUTT;
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
    for (const b of session.explosions.items)
      if (b.active && b.x > cam - b.radius && b.x < cam + visible + b.radius) {
        const x = b.x - cam,
          age = b.age,
          t = age / 0.85,
          radius = b.radius;
        const grenade = b.style === "grenade",
          shockTime = grenade ? 0.4 : 0.28;
        // A fast shock front separates from the slower, rising ink cloud.
        if (age < shockTime) {
          this.tint.set(24, 24, 24, 240 * (1 - age / shockTime));
          ink.circle(
            x,
            b.y,
            radius * Math.sqrt(age / shockTime),
            this.tint,
            undefined,
            7 * (1 - age / shockTime) + 1,
          );
          const ground = session.level.groundY(b.x) + 5;
          if (b.y - radius < ground)
            ink.ellipse(
              x,
              ground,
              radius * Math.sqrt(age / shockTime),
              12 + age * 18,
              this.tint,
              undefined,
              4,
            );
        }
        if (age > (grenade ? 0.075 : 0.035))
          for (let n = 0; n < 6; n++) {
            const a = (n * Math.PI) / 3 + Math.sin(b.x) * 0.3;
            const reach = radius * (0.14 + t * 0.32),
              size = radius * (0.18 + t * 0.16);
            this.smoke.set(
              32 + n * 7,
              32 + n * 7,
              30 + n * 7,
              235 * Math.min(1, (0.85 - age) / 0.3),
            );
            this.tint.set(24, 24, 24, this.smoke.a);
            this.cloud(
              ink,
              x + Math.cos(a) * reach,
              b.y + Math.abs(Math.sin(a)) * reach + t * (grenade ? 110 : 85),
              size,
              size * 1.05,
              this.smoke,
              this.tint,
              n * 0.4,
              4.2,
            );
          }
        if (age > 0.08 && age < 0.55) {
          this.light.set(250, 249, 245, 235 * Math.min(1, (0.55 - age) / 0.2));
          this.tint.set(24, 24, 24, this.light.a);
          this.cloud(
            ink,
            x,
            b.y + age * 70,
            radius * (0.36 + age * 0.14),
            radius * 0.35,
            this.light,
            this.tint,
            0.4,
            4,
          );
          // Ink flecks inside the pale foreground separate the cloud from a flat white disc.
          for (let n = 0; n < 7; n++) {
            const dx = Math.sin(n * 2.3) * radius * 0.22;
            const dy = Math.cos(n * 1.7) * radius * 0.18;
            ink.segment(
              x + dx,
              b.y + age * 70 + dy,
              x + dx * 1.08 + 2,
              b.y + age * 70 + dy + 4,
              3,
              this.tint,
            );
          }
        }
        if (age < (grenade ? 0.2 : 0.16)) {
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
          // Light foreground puff breaks the dark ink crown into a comic blast.
          this.cloud(
            ink,
            x,
            b.y + age * 95,
            radius * 0.23,
            radius * 0.3,
            colors.white,
            colors.ink,
            0.4,
            3,
          );
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
          p.kind === "smoke" ? 225 : 24,
          p.kind === "smoke" ? 225 : 24,
          p.kind === "smoke" ? 220 : 24,
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
        } else if (p.kind === "smoke") {
          this.smoke.set(24, 24, 24, color.a * 0.85);
          this.cloud(
            ink,
            p.x - cam,
            p.y,
            p.size + amount * 14,
            p.size * 0.8 + amount * 7,
            color,
            this.smoke,
            p.spin * 0.15,
            2.8,
          );
        } else if (p.kind === "dust")
          ink.ellipse(
            p.x - cam,
            p.y,
            p.size + amount * 7,
            p.size * 0.65 + amount * 5,
            color,
            color,
            1,
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
    // Render bodies after their smoke so the special weapon silhouette stays legible.
    for (const p of session.projectiles.items)
      if (p.active && p.x > cam - 70 && p.x < cam + visible + 70)
        this.projectileArt.draw(ink, p, cam, session.time);
    for (const g of session.grenades.items)
      if (g.active && g.x > cam - 30 && g.x < cam + visible + 30)
        this.projectileArt.grenade(ink, g, cam);
    const flash = (weapon: WeaponSystem) => {
      if (weapon.flash <= 0) return;
      const x = weapon.flashX - cam,
        y = weapon.flashY,
        d = weapon.flashFacing;
      const cs = Math.cos(weapon.flashPitch),
        sn = Math.sin(weapon.flashPitch);
      const g = ink.g,
        wide = weapon.id === "shotgun" ? 1.7 : weapon.id === "rocket" ? 1.4 : 1;
      const points = [
        0, 0, 6, 8, 13, 5, 26, 12, 20, 2, 33, 0, 19, -3, 25, -11, 12, -5, 6, -8,
      ];
      for (let i = 0; i < points.length; i += 2) {
        const a = points[i] * wide,
          b = points[i + 1] * wide;
        const px = x + (a * cs - b * sn) * d,
          py = y + a * sn + b * cs;
        if (i === 0) g.moveTo(px, py);
        else g.lineTo(px, py);
      }
      g.close();
      g.fillColor = colors.white;
      g.fill();
      g.strokeColor = colors.ink;
      g.lineWidth = 2.8;
      g.stroke();
      if (weapon.id === "shotgun")
        for (const side of [-1, 1])
          ink.segment(x + 22 * d, y + side * 23, x + 40 * d, y + side * 30, 2);
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
    ink.g.lineCap = Graphics.LineCap.ROUND;
  }
}
