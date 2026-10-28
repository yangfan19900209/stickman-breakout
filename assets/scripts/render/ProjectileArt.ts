import { Projectile } from "../combat/ProjectileManager";
import { Grenade } from "../combat/GrenadeSystem";
import { Ink, colors } from "./Ink";

/** The nose is at the collision point. All shapes rotate along the actual velocity. */
export class ProjectileArt {
  draw(ink: Ink, p: Projectile, cameraX: number, time: number): void {
    const x = p.x - cameraX,
      y = p.y,
      length = Math.hypot(p.vx, p.vy) || 1;
    const visualScale = p.kind === "rocket" ? 2.1 : p.kind === "bullet" || p.kind === "pellet" ? 1.6 : 1;
    const cs = (p.vx / length) * visualScale,
      sn = (p.vy / length) * visualScale;
    const line = (
      a: number,
      b: number,
      c: number,
      d: number,
      w = 2,
      tint = colors.ink,
    ) =>
      ink.segment(
        x + a * cs - b * sn,
        y + a * sn + b * cs,
        x + c * cs - d * sn,
        y + c * sn + d * cs,
        w,
        tint,
      );
    const shape = (points: number[], fill = colors.paper, w = 2.5) => {
      const g = ink.g;
      g.moveTo(
        x + points[0] * cs - points[1] * sn,
        y + points[0] * sn + points[1] * cs,
      );
      for (let i = 2; i < points.length; i += 2)
        g.lineTo(
          x + points[i] * cs - points[i + 1] * sn,
          y + points[i] * sn + points[i + 1] * cs,
        );
      g.close();
      g.fillColor = fill;
      g.fill();
      g.strokeColor = colors.ink;
      g.lineWidth = w;
      g.stroke();
    };
    if (p.kind === "shockwave") {
      shape(
        [-34, -9, -21, 4, -16, 21, -6, 9, 5, 20, 12, 5, 3, -10],
        colors.white,
        3,
      );
      line(-38, 2, -57, 3, 2.4);
      line(-37, -6, -51, -6, 2);
    } else if (p.kind === "rocket") {
      const flame = 8 + Math.sin(time * 63) * 3;
      shape(
        [-32, 4, -41, 6, -39, 2, -49 - flame, 0, -40, -2, -44, -6, -32, -4],
        colors.white,
        2,
      );
      shape([-24, 5, -31, 12, -37, 12, -33, 0, -37, -12, -31, -12, -24, -5]);
      const g = ink.g;
      const px = (a: number, b: number) => x + a * cs - b * sn;
      const py = (a: number, b: number) => y + a * sn + b * cs;
      g.moveTo(x, y);
      g.bezierCurveTo(
        px(-4, 5),
        py(-4, 5),
        px(-10, 7),
        py(-10, 7),
        px(-18, 6),
        py(-18, 6),
      );
      g.lineTo(px(-30, 5), py(-30, 5));
      g.lineTo(px(-30, -5), py(-30, -5));
      g.bezierCurveTo(px(-18, -7), py(-18, -7), px(-6, -7), py(-6, -7), x, y);
      g.close();
      g.fillColor = colors.paper;
      g.fill();
      g.strokeColor = colors.ink;
      g.lineWidth = 3;
      g.stroke();
      line(-9, -5, -9, 5, 2.2);
      line(-14, -5, -14, 5, 2);
      line(-18, 3, -27, 3, 1.2, colors.mid);
      line(-46, 13, -65, 13, 1.5, colors.muted);
      line(-46, -13, -60, -13, 1.5, colors.muted);
    } else if (p.kind === "pellet") {
      line(-15, 0, -5, 0, 1.5, colors.muted);
      ink.circle(x, y, 2.8, colors.ink, colors.paper, 1.7);
    } else if (p.kind === "cannon") {
      line(-22, 0, -8, 0, 2, colors.muted);
      shape([0, 0, -5, 6, -12, 4, -12, -4, -5, -6], colors.paper);
    } else {
      line(-23, 0, -12, 0, 1.6, colors.muted);
      shape([0, 0, -3, 2, -10, 2, -10, -2, -3, -2], colors.paper, 1.8);
    }
  }
  grenade(ink: Ink, p: Grenade, cameraX: number): void {
    const x = p.x - cameraX,
      y = p.y,
      cs = Math.cos(p.spin),
      sn = Math.sin(p.spin),
      g = ink.g;
    const px = (a: number, b: number) => x + a * cs - b * sn;
    const py = (a: number, b: number) => y + a * sn + b * cs;
    ink.circle(x, y, 7, colors.ink, colors.mid, 2.5);
    g.moveTo(px(-3, 5), py(-3, 5));
    g.lineTo(px(-3, 10), py(-3, 10));
    g.lineTo(px(3, 10), py(3, 10));
    g.lineTo(px(3, 5), py(3, 5));
    g.close();
    g.fillColor = colors.paper;
    g.fill();
    g.strokeColor = colors.ink;
    g.lineWidth = 2;
    g.stroke();
    ink.segment(px(3, 9), py(3, 9), px(8, 7), py(8, 7), 2);
    ink.segment(px(-4, 1), py(-4, 1), px(4, 1), py(4, 1), 1.4, colors.paper);
    ink.segment(
      x - p.vx * 0.035,
      y - p.vy * 0.035,
      x - p.vx * 0.065,
      y - p.vy * 0.065,
      1.5,
      colors.muted,
    );
    if (p.fuse < 0.3)
      ink.segment(px(3, 13), py(3, 13), px(7, 17), py(7, 17), 2);
  }
}
